# PIR — Payment Integrity Router

Routeur de paiement international B2B ouvert et sécurisé : intention signée, profils de juridiction, routeur multi‑rails (prédicteurs en ligne + optimiseur), garde règles → classifieur + Jev (Système 1) → Mistral (Système 2) → donneur d'ordre, journal hash‑chaîné, registre de confirmation sur Avalanche.

- Consigne du hackathon : [`CONSIGNE.md`](./CONSIGNE.md)
- Cadrage, problématique chiffrée, architecture, bibliographie : [`docs/projet.md`](./docs/projet.md)
- PRD, exigences P0/P1/P2, faisabilité, kit de démarrage : [`docs/prd.md`](./docs/prd.md)

## Démarrage

```bash
pnpm install
supabase start                      # Postgres/Auth local (Docker)
cp apps/web/.env.example apps/web/.env.local   # puis remplir les clés (voir docs/prd.md §12.4)
pnpm dev                            # web sur :3000
pnpm sor:dev                        # service de routage (CVXPY) sur :8000
(cd apps/contracts && forge install)   # dépendances Solidity (OpenZeppelin, forge-std), non versionnées
pnpm test:sor && pnpm test:contracts
```

Tout rail, PSP ou source de liquidité non branché sur une API réelle est **simulé** et étiqueté comme tel dans l'interface.

## Chaîne : L1 locale / L1 Fuji / repli Fuji C-Chain

Les contrats (`IntentRegistry`, `MockUSDC`, eERC Converter) sont chain-agnostiques : même bytecode, seule la config `CHAIN_RPC_URL` / `CHAIN_ID` / `EXPLORER_URL` change (`apps/web/src/lib/chain/pir.ts`, `defineChain` viem). Rien n'est déployé en mainnet ; toutes les clés sont des clés de test publiques.

| Cible                                | Quand                                   | chainId | Comment                                                                                                                                                                          |
| ------------------------------------ | --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **L1 locale « pir »** (défaut, démo) | dev et répétitions                      | `7810`  | `infra/avalanche/l1-local.sh up` (Subnet-EVM PoA via avalanche-cli, gas natif `PIR`, 4 comptes pré-financés) ; `l1-local.sh rpc` donne l'URL RPC (change à chaque redéploiement) |
| **L1 « pir » sur Fuji**              | si un wallet de test financé est fourni | `7810`  | `avalanche blockchain deploy pir --fuji` avec une clé de test (≥ 2 AVAX test), voir `docs/avalanche-l1.md`                                                                       |
| **Repli Fuji C-Chain**               | si la L1 Fuji ne passe pas              | `43113` | mêmes scripts avec `--rpc-url https://api.avax-test.network/ext/bc/C/rpc`, explorer `https://testnet.snowtrace.io`                                                               |

```bash
infra/avalanche/l1-local.sh up                   # crée + déploie la L1 locale (avalanche-cli)
CHAIN_RPC_URL=$(infra/avalanche/l1-local.sh rpc) # à coller dans apps/web/.env.local
pnpm deploy:registry                             # IntentRegistry → NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS
pnpm deploy:eerc                                 # MockUSDC + eERC Converter → NEXT_PUBLIC_MOCK_USDC_ADDRESS, NEXT_PUBLIC_EERC_ADDRESS, NEXT_PUBLIC_EERC_REGISTRAR_ADDRESS
pnpm --filter @pir/eerc eerc:register            # preuve zk de registration (auditeur, payeur) ; voir apps/eerc/README.md
pnpm test:contracts && pnpm test:eerc && pnpm --filter @pir/core test
```

- Registre de confirmation : `apps/contracts/src/IntentRegistry.sol` — publication **asynchrone** de l'intention (`packages/core` `IntentPublisher`), lecture `isConfirmed` **synchrone** au règlement ; seuls des hashes sont publiés on-chain.
- Jambe stablecoin : `apps/eerc/` — eERC en mode Converter, **partiel** : déploiement, registration zk, clé auditeur et dépôt vérifiés sur la L1 locale ; transfert/retrait chiffrés et déchiffrement auditeur restent à brancher via `@avalabs/eerc-sdk` (détail dans `apps/eerc/README.md`). Expéditeur, destinataire et horodatage restent publics.
- Le MCP Avalanche (`https://build.avax.network/api/mcp`) est utilisé en **lecture seule** (docs, commandes CLI) ; il ne déploie rien.
- Détails (commandes exactes, comptes de test, relance, bascule Fuji) : [`docs/avalanche-l1.md`](./docs/avalanche-l1.md).
