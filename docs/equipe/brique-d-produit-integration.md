# Brique D — Produit et intégration : API, pipeline, console, globe, démo

**Mission** : faire que _tout s'enchaîne et se voie_. D tient le squelette (`services/pir`, contrats, flux SSE), orchestre le pipeline, décide de l'action selon le niveau (F8), construit la console analyste et le globe, puis la démo, la vidéo et le deck. **D est l'intégrateur** : il fusionne `contrats.md` et vérifie chaque jalon.

**À lire** : PRD §6 (scénario de démo), §7 (F8, F9, F10, F14), §10 (plan de réponse), §11 (globe, événements), §12 (architecture), §13 (API). Interfaces : [`contrats.md`](./contrats.md) (tout).

**Existant** : `apps/web` (Next.js, DA, i18n, composants) ; `services/sor` (FastAPI) comme modèle de service.

**Dossiers** : `services/pir/pir/{contracts,api,pipeline}/`, `apps/web/`, `docs/` (deck, plan de réponse, slide conformité).

## Tâches, dans l'ordre

| #   | Tâche                                                                                                                               | Critère d'acceptation (test)                                                            | Prio |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---- |
| 0   | **F14** squelette `services/pir` (FastAPI, Python 3.12, pytest) + `pir/contracts/models.py` + `GET /v1/stream` SSE avec `id`        | Avant 1 h 45 : `contrats.md` traduit en code, flux SSE qui émet un événement de test    | P0   |
| 1   | Pipeline `POST /v1/intents` → … (contrats §3) branché sur les **stubs** des 4 briques ; `seed` idempotent                           | Avant 2 h 15 : scène 1 en stub produit la bonne suite d'événements                      | P0   |
| 2   | **F8** `pipeline.respond` : niveau → action (§10), kill switch connecteur, coupe-circuit régional                                   | Les quatre niveaux rejouables par test ; kill switch via `POST /v1/sim/events`          | P0   |
| 3   | **F10** fil texte (lisible sans WebGL) puis globe `react-globe.gl` (`next/dynamic`, `ssr: false`) sur un seul flux SSE              | Scènes 1, 2, 2b affichées ; une seule route visible par paiement ; étiquette « simulé » | P0   |
| 4   | Écran payeur (téléphone simulé) : signature EIP-712 via viem / `packages/core` ; écran contact connu (hors bande)                   | Claire signe ; Kwame refuse la demande hors bande en direct                             | P0   |
| 5   | **F9 (front)** console analyste : file de dossiers, signaux, réponses Jev, explication Mistral, actions libérer / retenir / bloquer | Dossier affiché ≤ 60 s ; Mistral n'a aucun bouton d'action                              | P0   |
| 6   | Démo : script minuté (§6), vidéo de secours à 9 h, deck 8 slides, plan de réponse, slide conformité, fiche de défense               | Répétition chronométrée < 3 min                                                         | P0   |

## Rôle d'intégrateur

- Fusionne les PR qui touchent `contrats/` ; rebase et fusion `main` toutes les ~90 min ; tient le tableau des jalons du README.
- À chaque point d'étape, rejoue la scène en cours de bout en bout et signale la brique qui casse.
- Respecte la DA existante de `apps/web` (minimaliste, propre, micro-animations, pas d'« IA slop »).

## Prompt de démarrage pour l'orchestrateur

> Tu es l'orchestrateur de la **brique D (produit et intégration)** du projet PIR. Lis `docs/equipe/README.md`, `docs/equipe/contrats.md`, `docs/equipe/brique-d-produit-integration.md` et les sections §6, §7, §10, §11, §12, §13 de `docs/prd-final.md`. Le PRD final prime sur `AGENTS.md`. Tu ne modifies que `services/pir/pir/{contracts,api,pipeline}/`, `apps/web/` et `docs/`. Urgence : tâche 0 (squelette + modèles Pydantic fidèles à `contrats.md` + SSE) avant 1 h 45, puis tâche 1 (pipeline sur stubs) avant 2 h 15, puis 2→6 : un sous-agent par tâche, une branche `brique-d/<tâche>` et une petite PR chacune, tests avant PR. Garde la DA existante de `apps/web`.
