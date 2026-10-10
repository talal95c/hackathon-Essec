# Brique C — Blockchain : intention signée, registre, séquestre, attaque 2b

**Mission** : garantir on-chain que _l'argent ne part que vers le bénéficiaire et le montant engagés_. Intention EIP-712 identique en TS / Python / Solidity, `IntentRegistry` étendu (engagement, attestation, révocation), séquestre mode A qui ne libère que sur `CONFIRMED`, et l'attaque de substitution/rejeu qui revert.

**À lire** : PRD §2 (principes 3, 4, 6, 7), §7 (F2, F12), §12 « Conception on-chain », §6 scènes 1, 2, 2b. Interfaces : [`contrats.md`](./contrats.md) §2 « C ». Mémo de la pile : README section « Chaîne ».

**Existant** (pile de branches à fusionner dans `main` en premier) : L1 locale `pir` (chainId 7810, `infra/avalanche/l1-local.sh`), `IntentRegistry.sol` + `pnpm deploy:registry`, `packages/core` (`intentHash` croisé TS/Solidity, EIP-712, `IntentPublisher`), `apps/eerc` (partiel), `TradeEscrow.sol` sur `main`.

**Dossiers** : `apps/contracts/`, `apps/eerc/`, `packages/core/`, `infra/avalanche/`, `services/pir/pir/chain/`.

## Tâches, dans l'ordre

| #   | Tâche                                                                                                                         | Critère d'acceptation (test)                                                                                                       | Prio |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 0   | Fusionner la pile chaîne dans `main` ; L1 locale up ; stub `pir.chain.*` (tx factices + explorer) avant 2 h 15                | Le pipeline de D passe en stub                                                                                                     | P0   |
| 1   | **F2** `fixtures/intent-vector.json` + `pir.chain.intent_hash` / `verify_signature` en Python (`eth_account`)                 | Le même vecteur passe en TS (`packages/core`), Python et Foundry ; tout champ modifié ⇒ autre hash                                 | P0   |
| 2   | **F12** `IntentRegistry` étendu : `PaymentCommitment`, `VerificationAttestation`, `Revocation` (EIP-712 vérifiés on-chain)    | `forge test` : signature invalide, rejeu de nonce et intention révoquée revert                                                     | P0   |
| 3   | **F12** séquestre mode A (EURC simulé / MockUSDC) : `deposit`, `release` seulement si `CONFIRMED`, remboursement à 24 h       | `release` sans `CONFIRMED` ⇒ revert `PaymentNotReleasable` ; `Refunded` après expiration ou révocation                             | P0   |
| 4   | Client Python `pir.chain` (web3.py ou appel au script TS) branché sur la L1 locale, émission des événements on-chain vers SSE | Scène 1 : `PaymentCommitted` visible avec lien explorer ; scène 2 : `VerificationRecorded(DENIED)` → `PaymentRevoked` → `Refunded` | P0   |
| 5   | **Scène 2b** : script d'attaque (substitution de compte, rejeu) contre connecteur et contrat                                  | Connecteur refuse (A) **et** contrat revert ; kill switch déclenché                                                                | P0   |
| 6   | eERC pour paiements faibles (time-box 3 h), ancrage Merkle du journal, Fuji si clé financée                                   | Si avance seulement ; sinon mode A public annoncé                                                                                  | P1   |

## Décisions déjà prises / à trancher vite

- **Réseau** : L1 PIR locale par défaut ; l'URL RPC change à chaque redéploiement → toujours `infra/avalanche/l1-local.sh rpc`, jamais en dur.
- **`TradeEscrow` à trois tranches** : réutiliser ou nouveau contrat simple mode A — à trancher par C avant 2 h 15 (recommandation : contrat mode A minimal, plus rapide à tester).
- Aucune donnée personnelle ni montant en clair hors mode A ; seulement des empreintes.

## Prompt de démarrage pour l'orchestrateur

> Tu es l'orchestrateur de la **brique C (blockchain)** du projet PIR. Lis `docs/equipe/README.md`, `docs/equipe/contrats.md`, `docs/equipe/brique-c-blockchain.md`, la section « Chaîne » du README et les sections §2, §6, §7, §12 « Conception on-chain » de `docs/prd-final.md`. Le PRD final prime sur `AGENTS.md` (pas de BNB/USDT : Avalanche L1 locale `pir`, chainId 7810). Tu ne modifies que `apps/contracts/`, `apps/eerc/`, `packages/core/`, `infra/avalanche/`, `services/pir/pir/chain/`. Commence par la tâche 0, puis 1→5 : un sous-agent par tâche, une branche `brique-c/<tâche>` et une petite PR chacune ; `forge test` et tests du vecteur `intent_hash` verts avant PR. Foundry dans le PATH (`~/.foundry/bin`). Ne change aucune signature sans me le demander.
