# Brique D — Produit et intégration : API, pipeline, flux, console, globe, démo

> À lire avant : [`README.md`](./README.md) (contexte commun), PRD §2–5 (scènes, personas), §6 (F8, F9 front, F10, F14), §7 (architecture), §10 (réponse graduée), §12–13 (démo, UX), §16 (NF), §19–20 ; interfaces [`docs/equipe/contrats.md`](../docs/equipe/contrats.md). D est aussi **l'intégrateur** : il fusionne dans `main` toutes les ~90 min.

## 1. Mission

Faire de A, B et C **une seule histoire que le jury voit** : le service `services/pir` (API `/v1` + pipeline), le flux d'événements en direct, la console analyste et le globe dans `apps/web`, le pilote de démo et la vidéo de secours. D possède l'ordre **NORMES → RISQUE → COÛT → COMMIT → ACTION** ; il ne réimplémente aucune logique métier des autres briques.

## 2. Périmètre et dossiers

| Dossier                                          | Contenu                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ------ | -------- |
| `services/pir/pyproject.toml`, `pir/main.py`     | Squelette FastAPI (Python 3.12, `uvicorn pir.main:app --port 8100`)      |
| `services/pir/pir/contracts/`                    | Modèles Pydantic de `contrats.md` §1 (**à livrer en premier, ≤ 45 min**) |
| `services/pir/pir/api/`                          | Routes `/v1`, flux SSE, `emit()`                                         |
| `services/pir/pir/pipeline/`                     | `run.py` (orchestration), `respond.py` (F8), `journal.py`, `store.py`    |
| `services/pir/scripts/`                          | `seed.py` (idempotent), `demo.py scene1                                  | scene2 | scene2b` |
| `apps/web/src/app/[locale]/console/`, `…/globe/` | Console analyste, globe, fil texte                                       |
| `apps/web/messages/{en,fr,zh}.json`              | Toutes les chaînes UI                                                    |
| `docs/`                                          | Script de démo, deck, captures                                           |

Ajouter à la racine `package.json` : `"pir:dev": "cd services/pir && .venv/bin/uvicorn pir.main:app --reload --port 8100"` et `"test:pir": "cd services/pir && .venv/bin/pytest -q"`.

## 3. Livrables H+0:45 (débloquent tout le monde)

1. `pir/contracts/` : `PaymentCommitment`, `Route`, `Hop`, `NormResult`, `RiskResult`, `Quote`, `Decision`, `Event`, `Level` exactement comme `contrats.md` §1.
2. Squelette des sous-paquets `norms/ routing/ connectors/ payees/ risk/ ai/ sim/ eval/ chain/` avec `__init__.py` et fonctions stub qui lèvent `NotImplementedError` — chaque brique remplace ensuite par son stub fonctionnel.
3. `GET /health`, `pytest` qui passe, CI locale (`pnpm test:pir`).

## 4. Spécifications détaillées

### API `/v1` (Pydantic en entrée et sortie)

| Méthode et chemin                              | Rôle                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | ------ | ------------ | ------- |
| `POST /v1/intents`                             | Crée l'engagement, lance le pipeline, renvoie `{uetr, decision, quote?, intent_hash}` |
| `POST /v1/payees/{id}/verify`                  | Délègue à `payees` (CoP + SIM swap)                                                   |
| `POST /v1/name-check`                          | Délègue à `payees.name_check`                                                         |
| `POST /v1/quotes`                              | Devis seul (`routing.quote`), ≤ 2 s                                                   |
| `POST /v1/payments`                            | Confirme et exécute un devis accepté (re-vérifie `valid_until`)                       |
| `GET /v1/payments/{uetr}`                      | État complet + événements                                                             |
| `GET /v1/stream`                               | SSE `text/event-stream`, reprise via `Last-Event-ID`, filtre `?uetr=`                 |
| `GET /v1/directory/{alias}`                    | Résolution d'alias bénéficiaire                                                       |
| `GET /v1/cases`, `POST /v1/cases/{id}/actions` | Dossiers analyste ; actions `approve                                                  | reject | request_info | report` |
| `POST /v1/oob/{request_id}`                    | Réponse hors bande (bouton « Kwame » de la démo) → `payees.answer_oob`                |
| `POST /v1/sim/events`                          | Pilote de démo : rail down, coupe-circuit, attaque 2b, vague mules (P1)               |
| `GET /v1/metrics`                              | Rapport d'évaluation de B (`eval/report.json`)                                        |

Rôles (NF-6, entête `X-PIR-Role` en démo) : `payer`, `approver`, `analyst`, `ops`, `auditor` ; l'auteur d'une intention ne peut pas l'approuver.

### Pipeline `pipeline/run.py` (contrats.md §3, **ne pas réordonner**)

```text
chain.verify_signature → norms.evaluate(c, routing.candidate_routes(corridor))
→ risk.score (+ ai.jev_questions) → respond(risk) → routing.quote(allowed, level)
execute       : chain.publish → connectors.execute
escrow        : chain.publish → chain.deposit → payees.request_oob → (answer_oob)
                → chain.record_verification → si chain.is_confirmed : chain.release → connectors.execute
                                              sinon : chain.revoke (+ Refunded)
block / block_report : arrêt, aucun publish ni execute, payment.blocked, dossier ouvert
                       (+ déclaration préremplie Mistral pour critical)
```

### F8 — Réponse graduée `respond.py` (P0)

| Niveau   | Action         | Détail                                                                      |
| -------- | -------------- | --------------------------------------------------------------------------- |
| low      | `execute`      | route la moins chère autorisée                                              |
| medium   | `escrow`       | route révocable (R3) uniquement, hors bande obligatoire, time-lock          |
| high     | `block`        | retenue, double contrôle approbateur, dossier Mistral                       |
| critical | `block_report` | blocage, dossier + déclaration préremplie, compte à rebours 24 h (FIC/NFIU) |

Coupe-circuit : vague détectée dans une région ⇒ seuils −20 pendant 24 h (transmis à B via `ctx.breaker_on`). Kill switch par rail (A). **Mode dégradé** (NF-2) : toute exception Jev/Mistral/chaîne ⇒ niveau ≥ celui calculé, jamais `execute` si la chaîne est indisponible pour une route en séquestre ; bandeau `degraded`.

### Journal hash-chaîné `journal.py` (P0)

Chaque événement : `{id, ts, type, uetr, payload, prev_hash, hash = sha256(prev_hash + json canonique)}` ; versions des règles/modèle (`model_version`, `pack.version`) dans chaque décision ; `GET /v1/payments/{uetr}` permet de rejouer ; racine ancrée via `chain.anchor` (P1). Stockage : SQLite (`services/pir/pir.db`), `store.consume_nonce` atomique pour A.

### Événements SSE (types figés)

`intent.received`, `norms.evaluated`, `risk.scored`, `jev.answered`, `decision.made`, `quote.ready`, `chain.committed`, `escrow.deposited`, `oob.requested`, `oob.answered`, `chain.verification`, `chain.revoked`, `escrow.released`, `escrow.refunded`, `leg.executed`, `leg.refused`, `chain.revert`, `payment.blocked`, `case.opened`, `breaker.on`, `rail.down`, `degraded.on`. Chaque payload porte `sim: true` si simulé et `tx`/`explorer_url` pour les événements chaîne.

### F9 front + F10 — Console, globe, fil texte (P0, `apps/web`)

- Réutiliser les composants existants : `transaction-timeline`, `audit-log`, `agent-action-stream`, `escrow-status-card`, `quote-breakdown-card`, `kyb-live-status` (adapter les libellés, ne pas réécrire).
- **Console analyste** `/[locale]/console` : file de dossiers, top-3 signaux, réponses Jev (badge « en cache »), explication Mistral, route exclue grisée avec la règle, boutons d'action, journal avec vérification d'empreinte et lien explorateur.
- **Globe** `/[locale]/globe` (P0 léger) : arcs Lyon → Paris CASP → Avalanche → Accra VASP → banque désignée, couleur par état (vert engagé, orange séquestre, rouge révoqué/refusé). Lib légère (`react-globe.gl` ou SVG + d3-geo). **Repli obligatoire** : fil texte (même flux SSE, sans WebGL) et vidéo (NF-10).
- UI : identité visuelle existante, sobre, micro-animations (framer-motion), chiffres en `tnum` + `Intl.NumberFormat`. Toutes les chaînes dans `messages/{en,fr,zh}.json` (fr d'abord, en/zh traduits). Client SSE : `EventSource(NEXT_PUBLIC_PIR_API_URL + "/v1/stream")`.

### F14 — Démo, seed, vidéo, deck (P0)

- `scripts/seed.py` : idempotent (supprime puis recrée), charge `fixtures/actors.yaml`, packs, cache Jev, déploie/lie les adresses chaîne depuis `.env`.
- `scripts/demo.py scene1|scene2|scene2b` : enchaîne les appels API avec pauses ; `--offline` utilise le stub chaîne et le cache Jev.
- Scène 1 : 18 400 €, R4 exclue, R3 choisie, `PaymentCommitted`. Scène 2 : faux fournisseur → `medium` → séquestre → SIM swap 26 h → Kwame refuse → `VerificationRecorded(DENIED)`, `PaymentRevoked`, `Refunded`. Scène 2b : `leg.refused` + `chain.revert PaymentNotReleasable`. Bilan : `/v1/metrics` (graine B).
- Vidéo de secours enregistrée **à 9 h** au plus tard ; deck 6 diapos (problème, promesse, démo, sécurité, chiffres mesurés, conformité) avec les réponses jury du PRD §20.

## 5. Tests d'acceptation

- `test_pipeline_order` (mocks : l'ordre des appels est exactement celui du §4).
- `test_block_never_publishes_nor_executes`, `test_escrow_executes_only_after_confirmed`, `test_denied_revokes_and_refunds`.
- `test_degraded_stricter`, `test_journal_tamper_detected`, `test_seed_idempotent`.
- E2E : `demo.py scene1/2/2b --offline` vert en CI locale ; Playwright P1 sur la console.

## 6. Découpage en sous-agents

1. **contracts + squelette** (H+0:45) → 2. **pipeline + respond + journal** sur les stubs → 3. **API + SSE** → 4. **console** (web) en parallèle de 3 → 5. **seed + demo.py** → 6. **globe + fil texte** → 7. **vidéo + deck**. Intégration réelle : remplacer un stub dès que la PR d'une brique est verte.

## 7. Jalons d'intégration

Bout en bout sur stubs **2 h 15** · scène 1 réelle **4 h 30** · scènes 2/2b **7 h** · gel fonctionnel **8 h 30** · vidéo **9 h** · gel code dimanche 12 h.

## 8. Pièges

- Ne pas changer un modèle de `contracts/` sans prévenir A, B, C.
- Ne pas mettre de logique métier dans les routes FastAPI (elles délèguent).
- Ne pas utiliser Clerk/Anthropic/BNB (hérités) ; secrets côté serveur seulement.
- Vérifier la démo sans réseau (cache Jev + stub chaîne).

## 9. Prompt de démarrage

> Tu es l'orchestrateur de la **brique D (Produit et intégration)** de PIR. Lis `plan/README.md`, `plan/integration.md`, `docs/equipe/contrats.md` et les §2–7, §10, §12–13, §16, §19–20 de `docs/prd-final.md` (le PRD final prime sur `AGENTS.md`). Tu possèdes `services/pir/pir/{contracts,api,pipeline}/`, `services/pir/scripts/`, `apps/web/` et `docs/`. Livre d'abord en 45 min les modèles Pydantic et le squelette (§3), puis un sous-agent par étape du §6, une branche `brique-d/<module>` et une petite PR chacune, tests du §5 avant le code. Respecte l'ordre du pipeline à la lettre. Ne change aucun contrat sans me le demander.
