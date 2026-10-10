# Plan de construction — 4 briques

Une fiche complète par personne, à donner telle quelle à votre agent orchestrateur. Chaque fiche contient le contexte, ce qui existe déjà, les spécifications détaillées, les tests d'acceptation, le découpage en sous-agents et un prompt de démarrage.

| Fiche                                | Brique                                                                          | Modules PRD                    |
| ------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------ |
| [`ia-securite.md`](./ia-securite.md) | B · IA sécurité (risque, Jev Système 1, Mistral Système 2, données, évaluation) | F6, F7, F9 back, F11, F13, F21 |
| [`fintech.md`](./fintech.md)         | A · Fintech (normes, bénéficiaires, routage, connecteurs)                       | F1, F3, F4, F5, F20            |
| [`blockchain.md`](./blockchain.md)   | C · Blockchain (engagement EIP-712, registre, séquestre, attaque 2b)            | F2, F12 (+ eERC, ancrage)      |
| [`integration.md`](./integration.md) | D · Produit et intégration (API, pipeline, SSE, console, globe, démo)           | F8, F9 front, F10, F14         |

Sources de vérité, par ordre : [`docs/prd-final.md`](../docs/prd-final.md) → ces fiches → [`docs/equipe/contrats.md`](../docs/equipe/contrats.md) (interfaces) → `README.md` (commandes). `AGENTS.md` et `agent_docs/` sont hérités (Lagos–Yiwu, BNB, Claude) : ignorer ce qui contredit le PRD final.

## Contexte commun (à connaître par tous)

**PIR « L'Aiguilleur »** — routeur de paiements transfrontaliers B2B, Track 1 « Fintech Security » (Secure Horizons, ESSEC). Démo : **Claire** (entreprise lyonnaise) paie **Savanna Shea Exports** (beurre de karité, Ghana ; contact connu **Kwame**). Le routeur applique les normes France + Ghana, note le risque de fraude, choisit la route conforme la moins chère, **engage l'intention sur Avalanche** puis autorise l'action. Promesse : _l'argent ne part que vers le bénéficiaire et le montant engagés_.

Ordre de décision (immuable) : **NORMES → RISQUE → COÛT → COMMIT → ACTION**. Les modèles (Jev, Mistral, GBM) ne peuvent que **durcir** une décision ; sans eux le système est plus strict (échec sûr). Tout ce qui est simulé est étiqueté `sim: true`.

Scènes : **1** paiement légitime (R4 exclue par la norme, R3 choisie, `PaymentCommitted`) ; **2** faux fournisseur (nouveau compte via PDF par e-mail → « moyen » → séquestre → SIM-swap + hors bande → Kwame refuse → `VerificationRecorded(DENIED)`, `PaymentRevoked`, `Refunded`) ; **2b** substitution/rejeu refusés par le connecteur **et** revert on-chain `PaymentNotReleasable` ; **3** (P1) grappe de mules + coupe-circuit ; **bilan** chiffres mesurés graine B.

Routes FR → GH (simulées) : **R1** SWIFT correspondant (€80, 1–3 j) · **R2** PSP SEPA Instant + versement GHS (0,1 % + change 1 %, < 1 h, irrévocable) · **R3** CASP UE EUR→EURC → Avalanche → VASP ghanéen → banque désignée (0,10 % + 0,10 %, révocable pendant le séquestre) · **R4** transfert → mobile money (1,5 %, exclue pour des biens : recettes d'exportation → banque désignée).

Service unique : `services/pir/` (FastAPI, Python 3.12), un sous-paquet par brique. Gel du code dimanche 12 h, jury 13 h.
