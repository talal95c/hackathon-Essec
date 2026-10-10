// Usage : voir apps/eerc/README.md. Clés de TEST uniquement.
// Env : CHAIN_RPC_URL, EERC_ADDRESS, MOCK_USDC_ADDRESS, USER_PRIVATE_KEY, [AMOUNT]
// Dépôt Converter : mint mUSDC → approve → EncryptedERC.deposit(amount, token, amountPCT).
// amountPCT = chiffrement Poseidon du montant vers la clé BabyJubJub de l'utilisateur (7 mots :
// ciphertext[4], authKey[2], nonce) — non vérifié on-chain, sert au déchiffrement côté client.
import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { formatPrivKeyForBabyJub, poseidonEncrypt, genRandomBabyJubValue } from "maci-crypto";
import { createPublicClient, createWalletClient, http, defineChain, keccak256, toHex, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = process.env.CHAIN_RPC_URL, EERC = process.env.EERC_ADDRESS, USDC = process.env.MOCK_USDC_ADDRESS, USER_PK = process.env.USER_PRIVATE_KEY;
const AMOUNT = BigInt(process.env.AMOUNT ?? "30000000000"); // 30 000 mUSDC (6 déc.)
const account = privateKeyToAccount(USER_PK);
const chainId = await createPublicClient({ transport: http(RPC) }).getChainId();
const chain = defineChain({ id: chainId, name: "target", nativeCurrency: { name: "N", symbol: "N", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const pub = createPublicClient({ chain, transport: http(RPC) });
const wallet = createWalletClient({ chain, transport: http(RPC), account });

const privateKey = BigInt(keccak256(toHex(`pir-eerc-key:${USER_PK}`))) % subOrder;
const formatted = formatPrivKeyForBabyJub(privateKey) % subOrder;
const publicKey = mulPointEscalar(Base8, formatted).map(BigInt);

const BASE_POINT_ORDER = subOrder;
const nonce = BigInt(Math.floor(Math.random() * 1e9));
let encRandom = genRandomBabyJubValue(); if (encRandom >= BASE_POINT_ORDER) encRandom = genRandomBabyJubValue() / 10n;
const encKey = mulPointEscalar(publicKey, encRandom);
const authKey = mulPointEscalar(Base8, encRandom).map(BigInt);
const ciphertext = poseidonEncrypt([AMOUNT], encKey, nonce).map(BigInt);
const amountPCT = [...ciphertext, ...authKey, nonce];
if (amountPCT.length !== 7) throw new Error(`amountPCT len ${amountPCT.length}`);

const erc = parseAbi(["function mint(address,uint256)", "function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"]);
const eerc = parseAbi(["function deposit(uint256 amount, address tokenAddress, uint256[7] amountPCT)", "function balanceOf(address user, uint256 tokenId) view returns (((uint256 x, uint256 y) c1, (uint256 x, uint256 y) c2) eGCT, uint256 nonce, (uint256[7] pct, uint256 index)[] amountPCTs, uint256[7] balancePCT, uint256 transactionIndex)", "function tokenIds(address) view returns (uint256)"]);
const w = async (fn) => pub.waitForTransactionReceipt({ hash: await fn() });
console.log("mint", (await w(() => wallet.writeContract({ address: USDC, abi: erc, functionName: "mint", args: [account.address, AMOUNT] }))).status);
console.log("approve", (await w(() => wallet.writeContract({ address: USDC, abi: erc, functionName: "approve", args: [EERC, AMOUNT] }))).status);
const r = await w(() => wallet.writeContract({ address: EERC, abi: eerc, functionName: "deposit", args: [AMOUNT, USDC, amountPCT] }));
console.log("deposit", r.status, r.transactionHash, "gas", r.gasUsed);
const tokenId = await pub.readContract({ address: EERC, abi: eerc, functionName: "tokenIds", args: [USDC] });
const bal = await pub.readContract({ address: EERC, abi: eerc, functionName: "balanceOf", args: [account.address, tokenId] });
console.log("tokenId", tokenId, "eGCT.c1.x (chiffré) =", bal[0].c1.x.toString().slice(0, 20) + "…", "amountPCTs:", bal[2].length);
console.log("mUSDC public balance after:", await pub.readContract({ address: USDC, abi: erc, functionName: "balanceOf", args: [account.address] }));
process.exit(0);
