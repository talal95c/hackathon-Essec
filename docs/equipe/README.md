# Organisation de l'équipe — 4 briques, 4 orchestrateurs

> Point d'entrée de l'équipe pour la nuit. Le **quoi** est dans [`../prd-final.md`](../prd-final.md) (PRD v3.0) ; ce dossier dit **qui fait quoi, dans quels dossiers, avec quelles interfaces**.
> Si `AGENTS.md` ou `agent_docs/` contredisent le PRD final (corridor Lagos–Yiwu, BNB, Claude…), c'est **le PRD final qui fait foi** : ces fichiers sont hérités.

## Les 4 briques

| Brique | Qui                    | Mission en une phrase                                                                                                   | Modules PRD                               | Fiche                                                                  |
| ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| **A**  | Fintech                | Normes des deux pays, bénéficiaires, routage, connecteurs simulés : _quelle route est permise et la moins chère_.       | F1, F3, F4, F5 (+ F20 en P1)              | [`brique-a-fintech.md`](./brique-a-fintech.md)                         |
| **B**  | IA sécurité            | Score de fraude, Jev (Système 1), Mistral (Système 2), données à graine et évaluation : _ce paiement est-il suspect_.   | F6, F7, F9 (back), F11, F13 (+ F21 en P1) | [`brique-b-ia-securite.md`](./brique-b-ia-securite.md)                 |
| **C**  | Blockchain             | Intention signée, `IntentRegistry` étendu, séquestre mode A, attaque 2b : _l'argent ne part que vers ce qui est signé_. | F2, F12 (+ eERC, ancrage en P1)           | [`brique-c-blockchain.md`](./brique-c-blockchain.md)                   |
| **D**  | Produit et intégration | API `/v1`, orchestration du pipeline, flux SSE, console, globe, démo, pitch : _tout se voit et s'enchaîne_.             | F8, F9 (front), F10, F14 + vidéo, deck    | [`brique-d-produit-integration.md`](./brique-d-produit-integration.md) |

**Chemin critique** (PRD §18) : intention signée (C) → connecteurs qui vérifient (A) → flux d'événements (D) → globe (D) → scène faux fournisseur (A + B + D).

## Règle d'or : on se branche par des interfaces, pas par du code

1. **H+0 → H+45 min** : figer [`contrats.md`](./contrats.md) (modèles, signatures de fonctions, événements, vecteur `intent_hash`). D en est le gardien.
2. **Avant H+1 h 15** : chaque brique pousse un **stub** qui respecte son interface et renvoie les fixtures FR-GH. D branche le bout en bout sur les stubs tout de suite.
3. Ensuite chacun remplace son stub par le vrai code, **sans changer la signature**. Un changement de contrat = message dans le groupe + PR qui ne touche que `contrats.md` / `services/pir/pir/contracts/`, fusionnée par D.

## Propriété des dossiers (pas de conflits de fusion)

| Dossier                                                                                                               | Propriétaire                |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `services/pir/pir/contracts/` (modèles Pydantic, événements) · `services/pir/pir/api/` · `services/pir/pir/pipeline/` | D                           |
| `services/pir/pir/norms/` · `routing/` · `connectors/` · `payees/` · `fixtures/packs/`                                | A                           |
| `services/pir/pir/risk/` · `ai/` · `sim/` · `eval/` · `fixtures/dataset/`                                             | B                           |
| `apps/contracts/` · `apps/eerc/` · `packages/core/` · `infra/avalanche/` · `services/pir/pir/chain/`                  | C                           |
| `apps/web/`                                                                                                           | D                           |
| `docs/` (deck, plan de réponse, slide conformité)                                                                     | D (contenu fourni par tous) |

`services/pir/` = **nouveau** service FastAPI unique (Python 3.12) ; `services/sor/` reste tel quel, A peut en réutiliser le CVXPY pour le découpage (P1).

## Travailler avec les agents (orchestrateurs)

- **Une session orchestrateur par personne**, nourrie avec : `docs/equipe/README.md`, `docs/equipe/contrats.md`, **sa fiche de brique**, les sections du PRD citées dans la fiche. Le prompt de démarrage est en bas de chaque fiche.
- L'orchestrateur découpe sa brique en **un sous-agent par module** (F1, F4…), une branche et une petite PR par module : `brique-<a|b|c|d>/<module>` (ex. `brique-a/f1-normes`).
- **Tests d'acceptation d'abord** : chaque module part du critère d'acceptation du PRD §7, écrit en test (`pytest`, `forge test`, `vitest`) avant le code.
- **Fusion dans `main` toutes les ~90 min**, petites PR, hooks pre-commit obligatoires (pas de `--no-verify`). Rebase sur `main` avant chaque PR.
- **Ne jamais modifier le dossier d'une autre brique** ; si besoin, ouvrir une demande dans le groupe.
- **Honnêteté de la démo** : tout ce qui est simulé porte `sim: true` et l'étiquette « simulé » à l'écran.
- Clés : `MISTRAL_API_KEY`, `TYPESAFE_API_KEY` (Codiv, base `https://api.codiv.ai`) dans `.env.local` / `services/pir/.env`, jamais commitées. **Jev : ≤ 25 req/min, cache obligatoire, jamais pendant la démo en direct si le cache suffit.**

## Planning de la nuit (heure de Paris)

Hypothèse : départ ≈ 1 h, gel du code dimanche 12 h, jury 13 h. Environ 9 h utiles × 4 ≈ **36 h·p** pour ≈ 57 h·p de P0 → l'ordre de coupe (PRD §18) s'applique **dès maintenant** (voir plus bas).

| Heure   | Jalon                                                                                                        | Responsable de la vérification |
| ------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 1 h 00  | Pile chaîne + PRD final fusionnés dans `main` ; chacun lit sa fiche ; orchestrateurs lancés                  | D                              |
| 1 h 45  | `contrats.md` figé ; vecteur `intent_hash` commun ; squelette `services/pir` + SSE vide                      | D + C                          |
| 2 h 15  | Stubs des 4 briques sur `main` ; scène 1 traverse le pipeline **en stub**                                    | D                              |
| 4 h 30  | **Scène 1 réelle** : intention signée → normes (R4 exclue) → route R3 → `PaymentCommitted` → globe           | tous                           |
| 7 h 00  | **Scènes 2 et 2b** : faux fournisseur retenu (Jev + Mistral + hors bande + révocation), substitution refusée | tous                           |
| 8 h 30  | Gel des fonctionnalités P0 ; chiffres d'évaluation graine B                                                  | B                              |
| 9 h 00  | Vidéo de secours enregistrée                                                                                 | D                              |
| 10 h 00 | Deck, plan de réponse, slide conformité ; répétition                                                         | D + tous                       |
| 12 h 00 | Gel du code                                                                                                  | —                              |

Point d'étape de 10 min à **2 h 15, 4 h 30, 7 h 00** : chacun dit fait / bloqué / ce qu'il coupe.

## Ce qu'on coupe vu le temps (proposition)

- **Gardé (jamais coupé)** : normes FR-GH, intention signée et refus des connecteurs, séquestre mode A et révocation, vérification hors bande, scènes 1, 2 et 2b, fil texte, chiffres mesurés.
- **Simplifié** : modèle GBM → règles + graphe + IsolationForest ; Jev en cache si le quota coince ; globe P0 seulement.
- **Coupé sauf avance** : pack 2 Lagos → Accra, eERC, scène 3 (mules), découpage CVXPY, information fiscale, ancrage Merkle.
- **Chaîne** : L1 PIR **locale** (déjà prête sur la pile de branches) ; Fuji seulement si quelqu'un fournit une clé de wallet test financé.
