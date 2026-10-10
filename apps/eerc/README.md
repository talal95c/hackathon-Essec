# apps/eerc — jambe stablecoin chiffrée (eERC Converter) — **partiel**

Projet Foundry séparé (solc 0.8.27, exigé par `ava-labs/EncryptedERC`) : `MockUSDC` (6 décimales,
mint libre, **test uniquement**) enveloppé par un **EncryptedERC en mode Converter** (soldes et
montants chiffrés, expéditeur/destinataire/horodatage publics, clé auditeur rotative).

## Ce qui tourne (vérifié sur la L1 locale `pir`, chainId 7810)

| Étape                                                                                                                | État | Preuve                                             |
| -------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| Déploiement 5 vérifieurs Groth16 « prod » + BabyJubJub + Registrar + EncryptedERC(converter, 6 déc.) + MockUSDC      | ✓    | `forge script script/DeployEerc.s.sol`             |
| Enregistrement d'un compte (preuve zk de registration, ~350 ms, snarkjs)                                             | ✓    | `scripts/eerc-register.mjs` → `Registrar.register` |
| Auditeur = persona « Auditeur » (`AUDITOR_ADDRESS`) enregistré puis `setAuditorPublicKey`                            | ✓    | `isAuditorKeySet() == true`                        |
| Dépôt : mint 30 000 mUSDC → `approve` → `deposit(amount, token, amountPCT)` → solde chiffré (EGCT), solde public = 0 | ✓    | `scripts/eerc-deposit.mjs` (~786k gas)             |

## Ce qui est **partiel** (à dire honnêtement en démo)

- **Transfert / retrait chiffrés non branchés côté app** : les circuits `transfer` et `withdraw`
  (wasm + zkey officiels présents dans `lib/EncryptedERC/circom/build`) demandent de déchiffrer le
  solde ElGamal courant et de prouver `solde ≥ montant` ; c'est le rôle du SDK client
  `@avalabs/eerc-sdk` (hooks React). Non intégré dans `apps/web` dans le temps du hackathon.
- **Déchiffrement auditeur** non implémenté côté app (la clé auditeur est posée on-chain ; le
  déchiffrement des `amountPCT` par l'auditeur est à faire avec le SDK).
- **Clé BabyJubJub de test** dérivée de la clé EVM par `keccak256` dans les scripts (le SDK la
  dérive d'une signature de message) : acceptable pour la démo, pas pour la production.
- Aucune UI : l'app doit afficher « eERC : partiel » tant que le SDK n'est pas branché.

## Commandes

```bash
# Dépendances (lib/ n'est pas versionné)
cd apps/eerc && forge install --no-git foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts ava-labs/EncryptedERC
pnpm install                       # snarkjs, maci-crypto, poseidon-lite, @zk-kit/baby-jubjub, viem

pnpm test:eerc                     # 4 tests (câblage, MockUSDC, dépôt sans registration refusé)
pnpm deploy:eerc                   # lit apps/web/.env.local (CHAIN_RPC_URL, DEPLOYER_PRIVATE_KEY)
#   → NEXT_PUBLIC_MOCK_USDC_ADDRESS, NEXT_PUBLIC_EERC_ADDRESS, NEXT_PUBLIC_EERC_REGISTRAR_ADDRESS

# Auditeur : enregistrer puis poser la clé (OWNER = déployeur du EncryptedERC)
CHAIN_RPC_URL=… EERC_REGISTRAR_ADDRESS=… EERC_ADDRESS=… \
USER_PRIVATE_KEY=<clé test auditeur> OWNER_PRIVATE_KEY=<clé test déployeur> pnpm --filter @pir/eerc eerc:register

# Payeur : enregistrer puis déposer 30 000 mUSDC
CHAIN_RPC_URL=… EERC_REGISTRAR_ADDRESS=… USER_PRIVATE_KEY=<clé test payeur> pnpm --filter @pir/eerc eerc:register
CHAIN_RPC_URL=… EERC_ADDRESS=… MOCK_USDC_ADDRESS=… USER_PRIVATE_KEY=<clé test payeur> AMOUNT=30000000000 pnpm --filter @pir/eerc eerc:deposit
```

Toutes les clés de la L1 locale sont des clés de test publiques (voir `docs/avalanche-l1.md`).

## Pièges rencontrés

- Le dépôt officiel contient **deux jeux de vérifieurs** : `contracts/verifiers/*CircuitGroth16Verifier.sol`
  (regénérés par hardhat-zkit, clés ≠ artefacts) et `contracts/prod/*Verifier.sol` (clés des
  `circom/build/*/circuit_final.zkey` versionnés). Avec les premiers, `register` revert `InvalidProof()`
  (`0x09bde339`) alors que la preuve vérifie localement. Utiliser **`prod`**.
- Les scripts importent les artefacts depuis `lib/EncryptedERC/circom/build` (56 Mo, non versionnés
  ici : `forge install` les ramène).
- `amountPCT` (7 mots : ciphertext[4], authKey[2], nonce) n'est pas vérifié par `deposit` ; il sert
  uniquement au déchiffrement du solde par l'utilisateur / l'auditeur.
