# Brique A — Fintech : normes, bénéficiaires, routage, connecteurs

> À lire avant : [`README.md`](./README.md) (contexte commun), PRD §4 (Claire, Kwame), §6 (F1, F3, F4, F5, F20), §7 (architecture), §8 (normes), §10 (réponse graduée), §14, §17, interfaces [`docs/equipe/contrats.md`](../docs/equipe/contrats.md).

## 1. Mission

Répondre à _« par où l'argent a-t-il le droit de passer, combien ça coûte, et vers qui exactement ? »_ : appliquer les normes des deux juridictions, vérifier le bénéficiaire, coter les routes autorisées et exécuter **uniquement** la jambe qui correspond à l'intention engagée. A garantit la promesse « substitution et rejeu impossibles » côté rail.

## 2. Périmètre et dossiers

| Dossier                             | Contenu                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `services/pir/pir/norms/`           | `engine.py` (évaluation déclarative), `loader.py` (packs YAML)                                    |
| `services/pir/pir/payees/`          | `registry.py`, `verify.py` (CoP / name check), `oob.py` (hors bande), `simswap.py`                |
| `services/pir/pir/routing/`         | `graph.py` (rails), `quote.py` (score S), `reroute.py`                                            |
| `services/pir/pir/connectors/`      | `base.py` (garde commune), `swift.py`, `sepa_psp.py`, `casp_vasp.py`, `momo.py`                   |
| `services/pir/fixtures/packs/`      | `profiles/fr.yaml`, `profiles/gh.yaml`, `fr-gh.yaml` (P0) ; `profiles/ng.yaml`, `ng-gh.yaml` (P1) |
| `services/pir/fixtures/actors.yaml` | Claire, Savanna Shea, Kwame, faux fournisseur (partagé avec B)                                    |

Dépendances : `pydantic`, `pyyaml`, `networkx`. Réutilisation possible de `services/sor` (FastAPI + CVXPY, endpoints `/optimize`, `/optimize_ml`) **en P1 seulement** pour le découpage multi-routes ; ne pas modifier ses endpoints.

## 3. Interfaces (ne pas changer sans le groupe)

Signatures exactes : [`docs/equipe/contrats.md`](../docs/equipe/contrats.md) §2 fait foi.

```python
pir.routing.candidate_routes(corridor: str) -> list[Route]
pir.norms.evaluate(c: PaymentCommitment, routes: list[Route]) -> NormResult
pir.routing.quote(c: PaymentCommitment, allowed: list[str], level: Level) -> Quote | None
pir.connectors.execute(c: PaymentCommitment, route: Route, emit) -> None   # lève IntentMismatch avant initiate
pir.payees.name_check(payee_id, holder_name) -> dict                       # {result: match|close|no_match, score}
pir.payees.sim_swap(phone) -> dict                                         # mock CAMARA
pir.payees.request_oob(payee_id, payment_id) -> str                        # id de demande
pir.payees.answer_oob(request_id, approved: bool) -> dict                  # → chain.record_verification
```

Ajouts internes à A (non exposés, libres) : `payees.verify_payee`, `routing.reroute(payment_id, failed_route)`.

## 4. Spécifications détaillées

### F1 — Moteur de normes et packs (P0, ≈ 2 h)

- **Profils déclaratifs** (YAML versionné, champ `version` + `sources`) :
  - `fr.yaml` : SEPA, VoP limitée au périmètre SEPA, MiCA/CASP pour EURC, Travel Rule crypto, champs GAFI R16 obligatoires.
  - `gh.yaml` : **recettes d'exportation créditées à la banque désignée** (règle `GH-EXPORT-DESIGNATED-BANK`), VASP Act 2025 (R3 via VASP « à revérifier » → `allow_with_flag`), Data Protection Act 2012, FIC 24 h.
- **Pack `fr-gh.yaml`** : routes R1–R4 (rails, frais, délais, plafonds, horaires, révocabilité), devises EUR → GHS, banque désignée simulée `GH-DESIGNATED-BANK-01`.
- **Évaluation** aux deux extrémités, **la plus stricte s'applique** ; résultat par route : `allowed | excluded(rule_id, reason_fr) | flagged`.
- Scène 1 : **R4 exclue** (biens → mobile money ≠ banque désignée). Une route exclue ne peut **jamais** revenir, quel que soit le score ou un modèle.
- Signal `N-R1` → `NormResult.signals` pour B (recettes routées hors banque désignée).
- Info fiscale FR-GH (P1) : avis informatif seulement, jamais un critère.
- Charger un pack ne modifie pas le code (`loader.py` valide avec Pydantic). P1 : `ng-gh.yaml` Lagos → Accra (PAPSS, GIP, NIP, mobile money, stablecoin ; tableau PRD §14).

### F3 — Registre bénéficiaires, vérification, hors bande (P0, ≈ 2 h)

- `Payee` : `id`, `legal_name`, `accounts[] {account, holder_name, added_at, provenance, verified}`, `contacts[] {id, name, channel, phone_hash}`. Provenance ∈ `registry | user_typed | pdf_email | api`.
- Savanna Shea : compte historique `GH-ACC-0001` (2024, `registry`, vérifié) ; contact **Kwame** connu de longue date. Faux fournisseur : nouveau compte `GH-ACC-9F3C` ajouté **il y a 2 jours**, `pdf_email`, titulaire « Savana Shea Trading ».
- `name_check` (style Confirmation of Payee / GSMA Number Verify) : normalisation (casse, accents, « Ltd/Exports/Trading »), Jaro-Winkler ≥ 0,92 `match`, ≥ 0,80 `close`, sinon `no_match`.
- **Règle F3** : nouveau compte issu d'un document non fiable ⇒ `PayeeCheck.requires_oob = true` (B en fait un niveau ≥ moyen).
- `simswap.py` (mock CAMARA SIM Swap) : renvoie `last_change` ; faux fournisseur = SIM changée il y a 26 h.
- **Hors bande** : le défi part vers le contact **déjà connu** (Kwame), jamais vers un numéro fourni dans la facture. `answer_oob(approved=False)` dans la scène 2 → D appelle `chain.record_verification(DENIED)`.

### F4 — Graphe de rails et devis (P0, ≈ 2 h)

- `networkx.DiGraph` : nœuds `institution × région` (Lyon, Paris CASP, Accra VASP, banque désignée, agents MoMo), arêtes = rails avec `fee_fixed`, `fee_pct`, `fx_spread`, `eta_s`, `cap`, `hours`, `revocable`, `status (up|degraded|down)`, `sim: true`.
- **Score de coût** (PRD §7) : `S = frais explicites + écart de change + coût de délai`, délai valorisé à 0,02 %/jour du montant (paramètre du pack). **Le risque n'entre jamais dans S** : il réduit seulement `allowed` (ex. `level >= medium` ⇒ routes non révocables R2 retirées, R3 en séquestre).
- `Quote` : routes classées avec détail par composante, route choisie, `expires_at = now + 600 s`, `rates_snapshot` (taux PRD §14 : 1 € = 655,957 FCFA ; ≈ 11,55 GH₵/$) ; ≤ 2 s.
- Scène 1 attendue pour 18 400 € : R3 choisie (≈ 0,20 % + minutes), R1 et R2 classées derrière, R4 grisée « exclue : règle GH-EXPORT-DESIGNATED-BANK ».
- P1 : découpage multi-routes via `services/sor` (`/optimize`) sous plafonds.

### F5 — Connecteurs simulés (P0, ≈ 2 h)

- `base.py` : **garde commune exécutée avant toute initiation**, dans cet ordre :
  1. `chain.is_confirmed(payment_id)` (pour une route en séquestre) ou intention publiée (route directe) ;
  2. `intent_hash(leg) == commitment.intent_hash` (recalculé avec le hash canonique de C, jamais copié depuis la requête) ;
  3. bénéficiaire, compte (`accountHash`), montant ≤ engagé, devise, `validUntil` non dépassé ;
  4. nonce jamais vu (`store.consume_nonce`, atomique) ;
  5. intention non révoquée, coupe-circuit du rail inactif.
     Échec ⇒ lever `IntentMismatch(reason_code)` + `emit("leg.refused", …)`, **sans appel au rail**.
- Rails : `swift.py` (pacs.008 simulé, UETR), `sepa_psp.py`, `casp_vasp.py` (appelle `chain.release` en mode séquestre), `momo.py`. Chaque connecteur renvoie un statut pacs.002 simulé (`ACSC`, `RJCT`).
- **Coupe-circuit par rail** et **reroutage** : rail `down` ⇒ `reroute()` recalcule le devis sur les routes encore autorisées (jamais une route exclue).
- Codes de refus : `INTENT_HASH_MISMATCH`, `PAYEE_MISMATCH`, `AMOUNT_EXCEEDS_COMMITMENT`, `NONCE_REUSED`, `INTENT_REVOKED`, `INTENT_EXPIRED`, `NOT_CONFIRMED`, `RAIL_KILLED`.

### F20 — Règles R2–R4 (P1)

Signaux supplémentaires paramétrés par pack, versionnés et sourcés.

## 5. Tests d'acceptation

- `test_r4_excluded_fr_gh` et `test_excluded_route_never_returns` (même avec `level=low` et un « avis » de modèle).
- `test_quote_scene1_picks_r3`, `test_risk_not_in_S` (même S pour `low` et `medium` sur les routes communes).
- `test_new_account_pdf_requires_oob`, `test_oob_targets_known_contact`.
- `test_connector_refuses_{substitution,replay,amount_up,revoked,expired,not_confirmed}` : **100 % des refus, pour chaque connecteur** (NF-3), aucun appel au rail (mock vérifié).
- `test_rail_down_reroutes_within_allowed`.

## 6. Découpage en sous-agents

1. **Stub** (≤ 30 min) : `evaluate` exclut R4 en dur, `quote` renvoie R3, `execute` accepte si `intent_hash` égal, `verify_payee` lit `actors.yaml`.
2. **norms** (F1) → 3. **payees** (F3) en parallèle → 4. **routing** (F4) → 5. **connectors** (F5) une fois le hash Python de C disponible (vecteur commun) → 6. P1 : pack NG-GH, SOR, R2–R4.

## 7. Pièges

- Ne pas importer le hash depuis la requête : toujours recalculer.
- Ne pas confondre fraude et coût ; ne pas réactiver une route exclue.
- Les noms/pays/banques sont fictifs et marqués `sim: true`.
- Pas de BNB/USDT/Lagos–Yiwu (cadrage hérité d'`AGENTS.md`).

## 8. Prompt de démarrage

> Tu es l'orchestrateur de la **brique A (Fintech)** de PIR. Lis `plan/README.md`, `plan/fintech.md`, `docs/equipe/contrats.md` et les §4, §6, §7, §8, §10, §14, §17 de `docs/prd-final.md` (le PRD final prime sur `AGENTS.md`). Tu ne modifies que `services/pir/pir/{norms,payees,routing,connectors}/` et `services/pir/fixtures/{packs,actors.yaml}`. Livre d'abord le stub (§6.1), puis un sous-agent par module dans l'ordre du §6, une branche `brique-a/<module>` et une petite PR chacune, tests du §5 écrits avant le code. Le hash d'intention vient de `services/pir/pir/chain/hash.py` (brique C) : ne le réimplémente pas. Ne change aucune signature sans me le demander.
