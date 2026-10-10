# Contrats d'interface (à figer à H+45 min)

> Gardien : **D**. Ces signatures sont le seul couplage entre briques. Le code vit dans `services/pir/pir/contracts/` (Pydantic v2) ; ce fichier en est la version lisible. Toute modification passe par le groupe.

## 1. Modèles partagés (`pir/contracts/models.py`)

```python
Level = Literal["low", "medium", "high", "critical"]          # 0–39 / 40–69 / 70–89 / 90–100
Provenance = Literal["typed", "registry", "pdf_email", "unknown"]

class PaymentCommitment(BaseModel):      # signé EIP-712, type et mapping dans plan/blockchain.md §C1
    payment_id: str                      # bytes32 hex
    payer: str                           # adresse
    payee_id: str                        # réf. registre des bénéficiaires
    account: str                         # IBAN / compte / wallet (pseudonymisé en vue)
    amount_minor: int                    # centimes
    currency: str                        # "EUR", "GHS", "EURC"
    invoice_hash: str
    provenance: dict[str, Provenance]    # par champ : account, amount, payee…
    corridor: str                        # "FR-GH"
    nonce: str                           # bytes32 hex, usage unique
    valid_until: int                     # epoch s
    intent_hash: str                     # calculé par pir.chain.intent_hash()
    signature: str

class Hop(BaseModel):  institution: str; region: str; lat: float; lon: float; rail: str
class Route(BaseModel):
    id: str                              # "R1".."R4"
    hops: list[Hop]
    conditional: bool                    # séquestre / retenue possible
    reversible: bool
    sim: bool = True

class NormResult(BaseModel):
    allowed: list[str]                   # ids de routes
    excluded: list[dict]                 # {route, rule_id, reason}
    signals: list[dict]                  # signaux de normes pour B, ex. {"id": "N-R1", "weight": …}

class RiskResult(BaseModel):
    score: int                           # 0–100
    level: Level
    signals: list[dict]                  # {id: "B1", label, contribution}
    jev: list[dict] | None               # {question_id, answer, confidence, cached}
    model_version: str

class Quote(BaseModel):
    route: Route; score_s: float; breakdown: dict[str, float]
    alternatives: list[dict]; valid_until: int

class Decision(BaseModel):
    level: Level
    action: Literal["execute", "escrow", "block", "block_report"]
    reasons: list[str]

class Event(BaseModel):                  # une ligne du flux SSE
    id: int; ts: float; type: str; uetr: str; payload: dict
```

## 2. Fonctions exposées par brique

```python
# A — Fintech
pir.norms.evaluate(c: PaymentCommitment, routes: list[Route]) -> NormResult
pir.routing.candidate_routes(corridor: str) -> list[Route]
pir.routing.quote(c: PaymentCommitment, allowed: list[str], level: Level) -> Quote | None
pir.connectors.execute(c: PaymentCommitment, route: Route, emit) -> None   # lève IntentMismatch avant initiate
pir.payees.name_check(payee_id, holder_name) -> dict
pir.payees.sim_swap(phone) -> dict                                         # mock CAMARA
pir.payees.request_oob(payee_id, payment_id) -> str                        # id de demande
pir.payees.answer_oob(request_id, approved: bool) -> dict                  # → C.record_verification

# B — IA sécurité
pir.risk.score(c: PaymentCommitment, norms: NormResult, ctx: dict) -> RiskResult
pir.ai.jev_questions(c: PaymentCommitment, invoice_text: str) -> list[dict]       # 2 questions, cache
pir.ai.case_file(c, risk: RiskResult) -> dict                                  # Mistral, ≤ 60 s
pir.ai.explain(decision: Decision, risk: RiskResult) -> str                    # Mistral, ≤ 120 mots
pir.sim.generate(seed: int) -> dict                                             # transactions, attaques, pannes
pir.eval.run(train_seed: int, test_seed: int) -> dict                           # métriques §15

# C — Blockchain
pir.chain.intent_hash(c) -> str                  # identique à packages/core et IntentHash.sol
pir.chain.verify_signature(c) -> bool
pir.chain.publish(c) -> str                      # tx hash, événement PaymentCommitted
pir.chain.deposit(payment_id, amount_minor) -> str
pir.chain.record_verification(payment_id, ok: bool) -> str   # VerificationRecorded
pir.chain.revoke(payment_id) -> str              # PaymentRevoked (+ Refunded)
pir.chain.is_confirmed(payment_id) -> bool
pir.chain.release(payment_id) -> str             # revert PaymentNotReleasable si non CONFIRMED
pir.chain.explorer_url(tx) -> str

# D — Produit et intégration
pir.pipeline.respond(risk: RiskResult) -> Decision           # F8 : niveau → action, coupe-circuit, kill switch
pir.api.emit(type: str, uetr: str, payload: dict) -> None    # publie sur le flux SSE
```

## 3. Pipeline (orchestré par D, PRD « Ordre de décision »)

`POST /v1/intents` → `chain.verify_signature` → `norms.evaluate` → `risk.score` (+ `ai.jev_questions`) → `pipeline.respond` → `routing.quote(allowed, level)` → selon `Decision.action` :

- `execute` (faible) : `chain.publish` → `connectors.execute`.
- `escrow` (moyen) : `chain.publish` → `chain.deposit` → `payees.request_oob` → `answer_oob` → `chain.record_verification` → **seulement si `chain.is_confirmed`** : `chain.release` → `connectors.execute` ; sinon `chain.revoke` (remboursement). Aucune jambe vers le bénéficiaire avant `CONFIRMED`.
- `block` / `block_report` (élevé / critique) : **arrêt** — pas de `publish`, pas de `connectors.execute` ; événement `payment.blocked`, dossier ouvert (et déclaration préremplie si critique).

## 4. API HTTP (PRD §13) — P0 en gras

**`POST /v1/intents`**, **`POST /v1/quotes`**, **`POST /v1/payments`**, **`GET /v1/payments/{uetr}`**, **`GET /v1/stream`** (SSE), **`GET /v1/cases`**, **`POST /v1/cases/{id}/actions`**, **`POST /v1/payees/{id}/verify`**, **`POST /v1/sim/events`**, `POST /v1/name-check`, `GET /v1/directory/{alias}`, `GET /v1/metrics`.

## 5. Événements SSE (PRD §11) — qui émet

| Événement                                                                                                                                                                                                | Émetteur |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `intent.signed`, `intent.published`, `PaymentCommitted`, `Deposited`, `VerificationRecorded`, `PaymentRevoked`, `Refunded`, `PaymentNotReleasable`, `escrow.locked`, `escrow.released`, `intent.revoked` | C        |
| `route.selected`, `hop.sent`, `hop.settled`, `leg.rejected`, `payment.credited`, `rail.down`, `rail.up`                                                                                                  | A        |
| `risk.scored`, `alert.raised`                                                                                                                                                                            | B        |
| `payment.held`, `payment.blocked`, `breaker.on`, `breaker.off`                                                                                                                                           | D        |

Chaque `payload` contient au minimum les coordonnées utiles au globe (`from`, `to` : `{lat, lon, label}`) et `sim: true` quand c'est simulé. Les fonctions des briques reçoivent un `emit` et n'ouvrent jamais leur propre flux.

## 6. Fixtures communes (`services/pir/fixtures/`)

- `packs/fr-gh.yaml` (A) : profils France + Ghana, routes R1–R4 et paramètres simulés du PRD §8.
- `actors.yaml` (A + B) : Claire (payeuse, Lyon), Kwame (fournisseur karité, Ghana), contact connu, faux compte.
- `invoices/` (B) : facture légitime + facture du faux fournisseur (PDF par e-mail, nouveau compte).
- `intent-vector.json` (C) : un `PaymentCommitment` + son `intent_hash` attendu ; testé en TS, Python et Solidity.
