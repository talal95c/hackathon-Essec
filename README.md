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
