# Brique C — Blockchain : engagement EIP-712, registre, séquestre, attaque 2b

> À lire avant : [`README.md`](./README.md) (contexte commun), PRD §6 (F2, F12), §7 (Avalanche), §11–12, §16, §20 ; `README.md` racine (section chaîne) ; interfaces [`docs/equipe/contrats.md`](../docs/equipe/contrats.md).

## 1. Mission

Rendre la substitution et le rejeu **impossibles et prouvables** : une intention signée (EIP-712) publiée dans un registre indépendant, lu par le connecteur avant le règlement ; un séquestre qui ne libère que si l'intention est confirmée ; un revert visible `PaymentNotReleasable` dans la scène 2b. _« Un attaquant qui compromet notre base ne peut ni réécrire l'intention ni effacer une révocation. »_

## 2. Ce qui existe déjà (ne pas refaire)

- `packages/core` (`@pir/core`, TS) : `PaymentIntent` (Zod : `payerIdHash`, `beneficiaryIdHash`, `maxAmountMinor`, `currency`, `deadline`, `nonce`), `intentHash()` (`keccak256(abi.encode(TYPEHASH, …))`), `INTENT_TYPES` + `intentDomain()` (`name: "PIR Payment Integrity Router"`, `version: "1"`), publisher. Tests : `pnpm --filter @pir/core test`.
- `apps/contracts/src/IntentHash.sol` (même hash en Solidity) et `IntentRegistry.sol` : `publishIntent`, `revoke`, `isConfirmed`, `getIntent`, `attestBeneficiary`, `setAuditor`, `anchorJournal` ; sans fonds, sans PII (hashes seulement), chain-agnostique. Tests : `pnpm test:contracts`.
- `apps/eerc` : eERC (déploiement, enregistrement zk, clé auditeur, dépôt) ; transfert/retrait chiffrés à brancher. Tests : `pnpm test:eerc`.
- Chaîne : L1 locale Avalanche **`pir`**, chainId **7810** (`infra/avalanche/l1-local.sh up`, RPC via `l1-local.sh rpc`, **jamais codé en dur** : il change à chaque redéploiement) ; repli **Fuji** 43113 ; MCP Avalanche en **lecture seule**. Déploiement : `pnpm deploy:registry`, `pnpm deploy:eerc`. **Jamais de mainnet.**

## 3. Périmètre et dossiers

`apps/contracts/` (Foundry), `apps/eerc/`, `packages/core/`, `infra/avalanche/`, `services/pir/pir/chain/` (`hash.py`, `client.py`, `vectors.py`), `fixtures/vectors/intent-hash.json` (vecteur commun).

## 4. Spécifications détaillées

### C1 — Engagement de paiement et vecteur commun (P0, ≈ 1 h 30, **bloquant pour A et D**)

L'intention actuelle n'engage pas le **compte** ni la **facture** : il faut les ajouter pour que la substitution soit refusée. Type proposé (nouveau type, l'ancien `PaymentIntent` reste pour compatibilité) :

```solidity
PaymentCommitment(bytes32 paymentId,bytes32 payerIdHash,bytes32 beneficiaryIdHash,bytes32 accountHash,
                  uint256 amount,bytes32 currency,bytes32 invoiceHash,uint64 validUntil,bytes32 nonce)
```

- `paymentId = keccak256(utf8(uetr))` ; `accountHash = keccak256(utf8(account))` (fiat) ou `keccak256(abi.encode(recipient))` (adresse on-chain R3) ; `invoiceHash = sha256(PDF)` ; montant en unités du jeton (MockEURC 6 décimales : `amount = amount_minor_eur × 10⁴`).
- Domaine EIP-712 : `{name: "PIR Payment Integrity Router", version: "1", chainId, verifyingContract: IntentRegistry}`.
- **Trois implémentations identiques** : `packages/core` (viem), `IntentHash.sol`, `services/pir/pir/chain/hash.py` (`eth_abi.encode` + `eth_utils.keccak`, signature via `eth_account` `encode_typed_data`). Un fichier `fixtures/vectors/intent-hash.json` (5 cas, dont caractères non ASCII et montant max `uint256`) est testé par **Vitest, Foundry et pytest**. Toute divergence = build rouge.

### C2 — `IntentRegistry` étendu : statuts et attestations (P0, ≈ 2 h)

- États : `NONE → COMMITTED → CONFIRMED | DENIED → RELEASED | REVOKED | EXPIRED`.
- `commit(PaymentCommitment c, bytes sig)` : vérifie la signature EIP-712 de l'émetteur autorisé, refuse un `paymentId` ou un `nonce` déjà vus, émet `PaymentCommitted(paymentId, intentHash, validUntil)`.
- `recordVerification(paymentId, intentHash, result, reasonHash, attestorSig)` : signataire = attestateur autorisé (rôle distinct de l'émetteur, NF-6) ; émet `VerificationRecorded(paymentId, result)` ; `DENIED` est définitif.
- `revoke(paymentId, reasonHash)` → `PaymentRevoked` ; `isConfirmed(paymentId, intentHash)` → `true` seulement si `CONFIRMED`, hash égal, non révoqué, non expiré.
- `anchorJournal(root)` (existe) : D y ancre la racine du journal hash-chaîné (P1 : toutes les N décisions).
- Règles : NatSpec sur chaque fonction publique/externe, erreurs personnalisées (`PaymentNotReleasable`, `NonceReused`, `BadSignature`, `NotAttestor`), `ReentrancyGuard` là où il y a des transferts, aucune PII.

### C3 — Séquestre mode A (P0, ≈ 2 h)

- `PirEscrow.sol` + `MockEURC.sol` (ERC-20, 6 décimales, mint libre **en test seulement**, `sim`).
- `deposit(paymentId, recipient, amount)` : exige `COMMITTED`, `amount == c.amount`, `keccak256(abi.encode(recipient)) == c.accountHash` (sinon revert `RecipientMismatch`) → `Deposited`.
- `release(paymentId)` : exige `registry.isConfirmed(paymentId, hash)` sinon **revert `PaymentNotReleasable`** ; transfert au `recipient` engagé, `Released`. Pull-payment ou transfert unique protégé.
- `refund(paymentId)` : si `DENIED`, `REVOKED` ou `EXPIRED` → retour au payeur, `Refunded`.
- Réutilisation du séquestre trois tranches hérité : non (question ouverte PRD §20 ; mode A une tranche suffit).

### F12 — Attaque 2b (P0, ≈ 1 h)

- Script `apps/contracts/script/Attack2b.s.sol` ou `services/pir/pir/chain/attack.py` : (a) substitution de `recipient` → `RecipientMismatch` ; (b) `release` d'une intention non confirmée/révoquée → `PaymentNotReleasable` ; (c) rejeu du même `nonce` → `NonceReused`. Chaque revert renvoie le `txHash`/raison à D pour la console (lien explorateur local ou Snowtrace Fuji).

### C4 — Client Python et publication (P0, ≈ 1 h)

`services/pir/pir/chain/client.py` (`web3.py`) expose exactement les fonctions `pir.chain.*` de `docs/equipe/contrats.md` §2 (`intent_hash`, `verify_signature`, `publish`, `deposit`, `record_verification`, `revoke`, `is_confirmed`, `release`, `explorer_url`) + `anchor(root)` ; `deposit(payment_id, amount_minor)` retrouve `recipient` depuis l'engagement stocké. Lit `CHAIN_RPC_URL`, `CHAIN_ID`, `REGISTRY_ADDRESS`, `ESCROW_ADDRESS`, `PIR_ISSUER_KEY`, `PIR_ATTESTOR_KEY` depuis l'environnement (clés de démo, jamais commitées). Vérifie `eth_chainId` au démarrage. Publication **asynchrone** (la décision n'attend pas le bloc) ; la lecture `is_confirmed` au règlement est **synchrone**. Chaîne indisponible ⇒ `ChainUnavailable` ⇒ D passe en mode dégradé (aucune libération).

### P1/P2

eERC transfert/retrait chiffré + déchiffrement auditeur (pas un prérequis P0) ; racines Merkle du journal ; quorum de deux RPC ; bascule Fuji automatisée.

## 5. Tests d'acceptation (Foundry + Vitest + pytest)

- Vecteur commun identique dans les trois langages.
- `test_commit_rejects_reused_nonce`, `test_bad_signature`, `test_only_attestor`.
- `test_release_requires_confirmed` (revert `PaymentNotReleasable`), `test_deposit_recipient_mismatch`, `test_refund_after_denied`, `test_expired`.
- Invariant : jamais `Released` sans `CONFIRMED` ; solde séquestre = Σ dépôts − libérés − remboursés.
- `pnpm test:contracts`, `pnpm --filter @pir/core test`, `pytest services/pir/tests/chain` verts.

## 6. Découpage en sous-agents

1. **Stub** (≤ 30 min) : `chain/client.py` en mémoire (même API, `is_confirmed` réel côté logique) pour que D branche sans nœud.
2. **C1 vecteur** (prioritaire, publier dès que prêt) → 3. **C2 registre** → 4. **C3 séquestre** → 5. **C4 client** + déploiement L1 → 6. **F12** → 7. P1 eERC.

## 7. Pièges

- Ne jamais coder le RPC ni committer `apps/web/.env.local` / des clés.
- Ordre ABI : le hash dépend de l'ordre exact des champs ; ne pas « ranger » les champs.
- `uint64` pour `validUntil` (secondes Unix), `bytes32` pour la devise (`currencyToBytes32` existant).
- L1 locale perdue au redémarrage : script de redéploiement + mise à jour des adresses dans `.env`.

## 8. Prompt de démarrage

> Tu es l'orchestrateur de la **brique C (Blockchain)** de PIR. Lis `plan/README.md`, `plan/blockchain.md`, `docs/equipe/contrats.md`, la section chaîne du `README.md` et les §6, §7, §11–12, §16 de `docs/prd-final.md` (le PRD final prime sur `AGENTS.md` : pas de BNB, pas de mainnet). Tu ne modifies que `apps/contracts/`, `apps/eerc/`, `packages/core/`, `infra/avalanche/` et `services/pir/pir/chain/`. Livre d'abord le stub en mémoire, puis le vecteur commun (C1) que A et D attendent, puis C2, C3, C4, F12, une branche `brique-c/<module>` et une PR chacun ; NatSpec partout, tests Foundry/Vitest/pytest avant PR. Ne change aucune signature sans me le demander.
