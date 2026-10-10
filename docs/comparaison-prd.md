# Comparaison des quatre PRD et arbitrages de fusion

> 10 octobre 2026 · Secure Horizons, ESSEC · Résultat : [`prd-final.md`](./prd-final.md)
> A, B et D sont conservés tels quels dans [`prd-sources/`](./prd-sources/) ; C reste dans [`prd.md`](./prd.md).

| Code  | PRD                                                                            | Auteur      | Langue                 | En une ligne                                                                                                                       |
| ----- | ------------------------------------------------------------------------------ | ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **A** | _Risk-Aware Payment Router_ ([source](./prd-sources/prd-risk-aware-router.md)) | non indiqué | anglais                | Routeur africain et agents IA ; idée forte : **séparer le risque de fraude du risque de route**.                                   |
| **B** | _L'aiguilleur_ ([source](./prd-sources/prd-aiguilleur-oscar.md))               | Oscar Hu    | français               | Lagos – Accra – Abidjan, terrain, détection géographique, réponse graduée et globe 3D.                                             |
| **C** | _Payment Integrity Router_ v1.1 ([`prd.md`](./prd.md))                         | équipe      | français               | Intégrité : intention signée, vérification hors bande, Jev/Mistral et code existant.                                               |
| **D** | _L'Aiguilleur_ v4 ([source](./prd-sources/prd-aiguilleur-youssef.md))          | Youssef     | anglais, ≈ 19 700 mots | Architecture normes → risque → coût, profils de juridiction, preuves on-chain EIP-712 et retours de deux sessions mentor intégrés. |

---

## 1. Notes par critère du jury

Notes de 1 à 5, _(analyse)_ : jugement de lecture, pas une mesure. Pondérations : détection 30 %, réponse 20 %, faisabilité 20 %, conformité 15 %, pitch 15 %.

| Critère             |    A    |    B    |    C    |    D     | Pourquoi                                                                                                                                                                                                               |
| ------------------- | :-----: | :-----: | :-----: | :------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Détection (30 %)    |    2    |  **5**  |    3    |  **5**   | B : typologies, géographie, graines A/B, références et ablations. C : BEC et substitution solides, mais vue payeur. D : jeu étiqueté, ablations et signaux de normes, notamment R1.                                    |
| Réponse (20 %)      |    3    |  **5**  |    4    |  **5**   | B : quatre niveaux, coupe-circuit et playbook. C : vérification, time-lock et révocation, sans console analyste. D : séquestre, attestations, révocation, remboursement et playbook.                                   |
| Faisabilité (20 %)  |    3    |    3    |    3    |    3     | A reste générique. B repart de zéro. C réutilise le dépôt mais son estimation P0 excède le temps prévu. D est bien phasé et time-boxé, mais lourd pour ≈ 21 h.                                                         |
| Conformité (15 %)   |    2    |  **5**  |    4    |  **5**   | B détaille les pays et les décisions rejouables. C a la chaîne et l'auditeur, mais peu de droit dans le PRD. D relie profils par juridiction, MiCA, DAC8, VoP et eERC avec clé d'auditeur.                             |
| Pitch / démo (15 %) |    2    |  **5**  |    4    |    4     | B a un globe en direct et un scénario visuel. C a le script et l'explorer, mais une scène moins visuelle. D a une carte de preuves et des événements on-chain, mais pas de visualisation live et un script de 4–5 min. |
| **Score pondéré**   | **2,4** | **4,6** | **3,5** | **4,45** | Notes D établies pour cette comparaison.                                                                                                                                                                               |

---

## 2. Le meilleur de chaque PRD

### A — Risk-Aware Payment Router

- Deux risques séparés : le risque de fraude décide si le paiement part ; le risque de route sert uniquement à choisir le rail. Changer de route ne corrige jamais une fraude.
- La fragmentation entre institutions explique l'intérêt d'une vue agrégée.
- À laisser de côté : l'habillage multi-agents sans protocole de mesure ni intégration au terrain déjà décrit par B et C.

### B — L'Aiguilleur (Oscar)

- Terrain ouest-africain documenté, analyste fraude comme utilisateur, KPI liés aux critères, typologies, données synthétiques, graines A/B, références et gain de la géographie isolé.
- Réponse à quatre niveaux, coupe-circuit régional, playbook, déclaration préremplie et qui-notifier-par-pays.
- Globe piloté par le flux d'événements, avec fil texte de secours ; sept rails et paramètres de simulation.
- À corriger : son terme de fraude dans le score de route ; le routeur ne doit pas rendre un paiement suspect éligible en changeant de rail.

### C — Payment Integrity Router (notre PRD)

- `PaymentIntent` signée, `intent_hash` contrôlé par chaque connecteur, nonce et révocation : une substitution en transit est refusée plutôt que seulement détectée.
- Bénéficiaires vérifiés, hors bande sur un contact connu, double contrôle, mode dégradé plus strict et humain dans la boucle.
- Jev (Système 1) pour deux questions, Mistral (Système 2) pour expliquer sans agir ; journal hash-chaîné, `IntentRegistry` existant, `packages/core`, base et contrats déjà présents.
- À déplacer ou corriger : corridor France–Chine, estimation P0 excessive et quelques fonctionnalités hors démo.

### D — L'Aiguilleur (Youssef)

**À reprendre :**

- Ordre de décision **normes → risque → coût → commit → action** ; un profil par pays et un pack de corridor dans un fichier.
- Les normes deviennent aussi des signaux de fraude R1–R4. R1 cible les recettes d'exportation qui n'arrivent pas à la banque désignée.
- VoP s'arrête à SEPA. Vérification SIM-swap sur le contact connu avant la demande hors bande (mock CAMARA).
- `PaymentCommitment`, `VerificationAttestation` et `Revocation` EIP-712, vérifiés on-chain ; séquestre dont `release` exige `CONFIRMED`.
- Scène 2b : substitution et rejeu refusés par le connecteur ou revert on-chain. Modèle eERC avec modes A/B et modèle de confiance explicite ; Chainlist, vérification du chain-ID et quorum à deux fournisseurs.
- Fiscalité informative seulement ; séparation System 1/System 2 ; protection de nos propres agents contre l'injection de prompt. La carte de preuves relie attente du mentor, scène et événement on-chain. Les retours de deux sessions mentor sont intégrés.

**À écarter ou corriger :**

- Longueur et anglais ; aucune visualisation en direct ; P0 trop lourd pour ≈ 21 h.
- La dépendance au mentor pour la L1 ; en mode A, les montants restent publics pendant le séquestre.
- Q5 sur les recettes d'exportation via VASP reste non résolue ; seuils encore provisoires.
- D parle d'un « Track 3 angle » : c'est le positionnement confirmé par l'équipe, à savoir **Track 1**, avec une ouverture possible sur la **Track 3**.

---

## 3. Contradictions et arbitrages

| Sujet                 | A                         | B                                | C                                 | D                                             | Décision v3.0                                                                                                                                                 |
| --------------------- | ------------------------- | -------------------------------- | --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corridor              | Afrique, deux pays        | Lagos – Accra – Abidjan          | France → Chine                    | France → Ghana + packs                        | **France → Ghana** pour la démo ; pack 2 Lagos → Accra ; pack 3 Paris → Abidjan sur papier. Chine rejetée.                                                    |
| Ordre de décision     | Séparer les risques       | Fraude incluse au score de route | Garde avant rail                  | Normes → risque → coût → commit → action      | Normes et risque filtrent d'abord ; le score S de routage ne contient jamais le risque de fraude.                                                             |
| Risque fraude / route | Séparés                   | Confondus dans `ρ·R`             | Intégrité puis risque             | Risque filtre les routes conformes            | Séparation A conservée ; filtres B/D et intégrité C composent la décision.                                                                                    |
| IA                    | Trois agents              | LLM secondaire                   | Jev + Mistral                     | System 1 / System 2, défense des agents       | Jev : deux questions à la signature ; Mistral : dossier et explication, jamais une action. Positionnement : Track 1, ouverture possible sur la Track 3.       |
| Intention / preuve    | Peu détaillé              | Journal et chaîne                | `IntentRegistry`, `PaymentIntent` | EIP-712 : commitment, attestation, révocation | `IntentRegistry` conservé et étendu aux trois types signés ; connecteur contrôle `intent_hash`.                                                               |
| Séquestre             | —                         | Réponse graduée                  | `TradeEscrow` déjà présent        | Mode A public, `release` exige `CONFIRMED`    | Mode A P0 ; réutilisation ou remplacement de `TradeEscrow` reste au propriétaire chaîne. Mode B P2.                                                           |
| Chaîne                | C-Chain                   | Fuji                             | L1 PIR, repli Fuji                | L1 dédiée si possible, Fuji P0 chez D         | L1 PIR si opérationnelle dimanche 0 h, sinon Fuji C-Chain ; exploration mentor sur L1, Snowtrace sur Fuji.                                                    |
| Nombre de P0          | Huit « Must »             | Neuf + globe                     | Quatorze                          | Modules nombreux et phases                    | Quatorze modules, ≈ 57 h·p pour ≈ 56 disponibles : au seuil, l'ordre de coupe s'applique dès le checkpoint.                                                   |
| Build                 | 36 h                      | Sam. 17 h → dim. 12 h            | 36 h                              | ≈ 21 h, à confirmer                           | Garder le calendrier v2.0 : ≈ 19 h de build utile ; ≈ 21 h selon D reste à confirmer.                                                                         |
| Nom                   | Risk-Aware Payment Router | L'Aiguilleur                     | PIR, nom de travail               | L'Aiguilleur                                  | Proposer **L'Aiguilleur** à l'oral ; garder `PIR` dans le code.                                                                                               |
| v2.0 → v3.0           | —                         | Triangle ouest-africain          | France → Chine                    | Intercontinental, normes par pays             | Le triangle Lagos–Accra–Abidjan cède la place à **France → Ghana et aux packs**, à la demande du mentor pour une démo intercontinentale avec normes par pays. |

---

## 4. Ce que la fusion change par rapport à notre PRD (C)

**On ajoute** : le terrain africain, les signaux géographiques et les mules de B ; les normes intercontinentales, le moteur de décision et la preuve on-chain de D ; les rails par corridor, l'évaluation et les ablations. **On garde** l'intention signée, les refus `intent_hash`, Jev/Mistral, les connecteurs et la base de code de C ; la séparation des risques de A. Le globe de B reste une présentation de la route et des événements, pas un moteur de décision.

**On perd ou reporte** : le corridor France → Chine et le triangle comme scénario principal ; les autres pays que les packs retenus ; la L1 consortium, le mode B, le guardian et les extensions P2. Le pack 2, au lieu d'être le fil rouge, devient une extension P1.

---

## 5. Verdict

**B et D sont co-bases** : 4,6 et 4,45 sont presque à égalité ; l'alignement de D sur les retours du mentor l'emporte sur l'écart de 0,15. D fournit l'architecture de décision et la preuve on-chain ; B, le terrain africain, la détection et les visuels ; C, l'intention signée, Jev/Mistral et le code existant ; A, la séparation des risques. Le PRD final v3.0 combine ces apports sans confondre fraude et coût de route.

**Trois décisions d'équipe** : (1) corridor principal France → Ghana et pack 2 Lagos → Accra ; (2) durée réelle du build ; (3) proposer « L'Aiguilleur », tout en gardant `PIR` dans le code.
