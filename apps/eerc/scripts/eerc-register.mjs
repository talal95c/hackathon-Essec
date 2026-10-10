// Enregistre un compte dans le Registrar eERC (preuve zk Groth16 de registration générée ici
// avec snarkjs + artefacts circom/build du dépôt officiel), puis, si OWNER_PRIVATE_KEY est
// fourni, définit ce compte comme auditeur du EncryptedERC (clé auditeur = persona Auditeur).
// Usage : voir apps/eerc/README.md. Clés de TEST uniquement.
// Env : CHAIN_RPC_URL, EERC_REGISTRAR_ADDRESS, USER_PRIVATE_KEY, [EERC_ADDRESS + OWNER_PRIVATE_KEY], [EERC_BUILD]
import * as snarkjs from "snarkjs";
import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { formatPrivKeyForBabyJub } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import { createPublicClient, createWalletClient, http, defineChain, keccak256, toHex, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RPC = process.env.CHAIN_RPC_URL;
const BUILD = process.env.EERC_BUILD ?? resolve(dirname(fileURLToPath(import.meta.url)), "../lib/EncryptedERC/circom/build");
const REGISTRAR = process.env.EERC_REGISTRAR_ADDRESS;
const EERC = process.env.EERC_ADDRESS;
const USER_PK = process.env.USER_PRIVATE_KEY; // EVM key of the account to register (test only)
const OWNER_PK = process.env.OWNER_PRIVATE_KEY; // optional: eERC owner → setAuditorPublicKey(user)

const account = privateKeyToAccount(USER_PK);
const chainId = BigInt(await (async () => { const c = createPublicClient({ transport: http(RPC) }); return c.getChainId(); })());
const chain = defineChain({ id: Number(chainId), name: "target", nativeCurrency: { name: "N", symbol: "N", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const pub = createPublicClient({ chain, transport: http(RPC) });

// Clé BabyJubJub dérivée déterministement de la clé EVM (démo/test uniquement ; le SDK eERC
// dérive la sienne d'une signature de message — même principe, l'utilisateur garde le secret).
const privateKey = BigInt(keccak256(toHex(`pir-eerc-key:${USER_PK}`))) % subOrder;
const formattedPrivateKey = formatPrivKeyForBabyJub(privateKey) % subOrder;
const publicKey = mulPointEscalar(Base8, formattedPrivateKey).map((x) => BigInt(x));
const registrationHash = poseidon3([chainId, formattedPrivateKey, BigInt(account.address)]);

const abi = parseAbi([
  "function isUserRegistered(address) view returns (bool)",
  "function getUserPublicKey(address) view returns (uint256[2])",
  "function register(((uint256[2] a, uint256[2][2] b, uint256[2] c) proofPoints, uint256[5] publicSignals) proof)",
  "function setAuditorPublicKey(address user)",
  "function auditor() view returns (address)",
  "function isAuditorKeySet() view returns (bool)",
]);

if (await pub.readContract({ address: REGISTRAR, abi, functionName: "isUserRegistered", args: [account.address] })) {
  console.log("déjà enregistré", account.address);
} else {
  const input = {
    SenderPrivateKey: formattedPrivateKey,
    SenderPublicKey: publicKey,
    SenderAddress: BigInt(account.address),
    ChainID: chainId,
    RegistrationHash: registrationHash,
  };
  const t0 = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `${BUILD}/registration/registration.wasm`, `${BUILD}/registration/circuit_final.zkey`);
  console.log(`preuve générée en ${Date.now() - t0} ms`);
  const vkey = JSON.parse(readFileSync(`${BUILD}/registration/registration_verification_key.json`, "utf8"));
  console.log("vérif locale :", await snarkjs.groth16.verify(vkey, publicSignals, proof));
  const proofPoints = {
    a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    b: [[BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])], [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]],
    c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
  };
  const wallet = createWalletClient({ chain, transport: http(RPC), account });
  const hash = await wallet.writeContract({ address: REGISTRAR, abi, functionName: "register", args: [{ proofPoints, publicSignals: publicSignals.map(BigInt) }] });
  const rcpt = await pub.waitForTransactionReceipt({ hash });
  console.log("register tx", hash, rcpt.status);
}
console.log("publicKey on-chain :", await pub.readContract({ address: REGISTRAR, abi, functionName: "getUserPublicKey", args: [account.address] }));

if (OWNER_PK && EERC) {
  const owner = createWalletClient({ chain, transport: http(RPC), account: privateKeyToAccount(OWNER_PK) });
  const hash = await owner.writeContract({ address: EERC, abi, functionName: "setAuditorPublicKey", args: [account.address] });
  const rcpt = await pub.waitForTransactionReceipt({ hash });
  console.log("setAuditorPublicKey tx", hash, rcpt.status);
  console.log("auditor :", await pub.readContract({ address: EERC, abi, functionName: "auditor" }), "keySet :", await pub.readContract({ address: EERC, abi, functionName: "isAuditorKeySet" }));
}
process.exit(0);
