# Payment Integrity Router — payer n'importe quelle entreprise, partout, par le meilleur chemin, sans jamais perdre le contrôle de qui reçoit l'argent

> Secure Horizons — ESSEC, 10–11 octobre 2026 — Track 1 « Fintech Security: Guardians of Value »
> Document de cadrage (v1). Légende des sources : ✅ vérifié à la source primaire, 🟡 chiffre de mémoire / à confirmer.

---

## 0. En une page

**Le problème.** Quand une entreprise paie un fournisseur à l'étranger, son paiement traverse 3 à 4 institutions (banques, correspondants, PSP, parfois rails crypto) qui ne partagent ni format de données, ni horaires d'ouverture, ni contrôles. Chaque maillon refait ses vérifications, attend son guichet et perd de l'information. Résultat : des jours de délai, 6 à 8 % de coûts, et un angle mort — **personne ne vérifie de bout en bout que l'argent part vers le bon bénéficiaire, pour le bon montant**. C'est là que frappe la première fraude des entreprises, la fausse facture / le changement de coordonnées bancaires (_Business Email Compromise_, 3 Md$ de pertes aux États‑Unis en 2025, désormais assistée par IA), et les parades existantes (vérification du bénéficiaire) s'arrêtent aux frontières.

**La problématique.** _Comment permettre à une entreprise de payer n'importe quelle autre entreprise, partout dans le monde, par le chemin le plus rapide et le moins cher, avec la garantie qu'aucun paiement ne part vers un bénéficiaire ou un montant qu'elle n'a pas voulu ?_

**La solution.** Un routeur de paiement international **ouvert et sécurisé**, en deux couches :

1. **Le routeur (interopérabilité).** Le donneur d'ordre crée sa demande à partir de la facture et la **signe** : c'est l'_intention_, source de vérité. Le système détecte la localisation des deux parties, charge les règles de chaque pays, et choisit automatiquement le meilleur chemin parmi tous les rails disponibles (banque, stablecoin, PSP local, escrow) selon coût, délai, horaires d'ouverture et réglementation — avec des prédicteurs qui apprennent en ligne des paiements passés. Les contrôles (KYB, AML, Travel Rule, documents) sont faits une fois et **voyagent avec le paiement** au lieu d'être répétés.
2. **La défense (sécurité).** Chaque geste du routeur est vérifié contre l'intention signée : règles déterministes (plafonds, sanctions, nouveau bénéficiaire → vérification hors bande), puis un juge rapide (**Jev, Système 1**, quelques millisecondes) et un classifieur comportemental ; en cas de doute, un raisonneur (**Mistral, Système 2**) explique en clair et le **donneur d'ordre** confirme ou annule. Aucun rail n'exécute une jambe qui ne correspond pas à l'intention ; tout est journalisé de bout en bout, de façon infalsifiable.

**La promesse.** « Arrivé au bon bénéficiaire, au prix annoncé, à l'heure prévue — et la preuve pour l'audit. »

**Pour qui.** Les PME qui paient des fournisseurs à l'étranger (clientes directes) ; les fintechs, PSP et banques qui veulent intégrer la couche (API/SDK, _layer++_).

**Ce qu'on démontre en 36 h.** Un corridor (PME française → fournisseur chinois, un vendredi soir), une attaque BEC en direct, une substitution de coordonnées en transit, un tableau de bord de KPI, et l'ajout d'un pays en un fichier de profil.

---

## 1. La douleur, chiffrée

| Dimension          | Constat                                                                                                                                                                                                                                                                                                                                  | Source                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Coût               | 6,36 % de coût moyen mondial pour envoyer 200 $ (T3 2025) ; Afrique subsaharienne la plus chère (~8 % 🟡). Cible G20 : **1 % en moyenne, aucun corridor > 3 % fin 2027**. FSB oct. 2024 : « progrès limités », mêmes régions à la traîne sur coût et vitesse.                                                                            | Banque mondiale RPW ✅ ; FSB G20 Targets ✅ ; FSB KPI Report 2024 ✅ |
| Délai              | Cible G20 : **75 % des paiements crédités en < 1 h**, le reste en < 1 jour ouvré (fin 2027). SWIFT gpi y parvient sur son réseau (≈ 60 % < 30 min, ≈ 100 % < 24 h) mais les corridors à correspondants multiples (Afrique ↔ Asie) restent à J+2–5 🟡 et rien ne bouge le week‑end.                                                       | FSB ✅ ; Swift ✅                                                    |
| Fraude             | **76 % des entreprises US** ont subi une tentative ou une fraude aux paiements en 2025 (AFP 2026, 465 répondants). BEC : **3,05 Md$ de pertes US en 2025** (2ᵉ perte derrière l'investissement) ; **55 Md$ cumulés dans le monde 2013‑2023**. L'IA/deepfake (voix, vidéo) est désormais une catégorie suivie à part par le FBI et l'AFP. | AFP ✅ ; FBI IC3 2025 ✅ ; FBI PSA sept. 2024 ✅                     |
| Parades existantes | Confirmation of Payee (UK) : 300+ organisations, **2 M de vérifications/jour**. Verification of Payee (UE, règlement 2024/886) : le PSP doit vérifier nom ↔ IBAN avant autorisation. **Domestiques uniquement** (UK, euro) ; rien à l'international ni sur les rails crypto.                                                             | Pay.UK ✅ ; EUR‑Lex ✅                                               |
| Crypto             | 2,02 Md$ volés par la Corée du Nord en 2025 (Bybit ≈ 1,5 Md$), 158 000 compromissions de wallets ; réseaux de blanchiment chinois dominants. 99 juridictions ont ou préparent la Travel Rule.                                                                                                                                            | Chainalysis 2026 ✅ ; FATF 2025 ✅                                   |
| Accès / liquidité  | Déficit de financement du commerce : **2 500 Md$** (2022), concentré sur les PME ; préfinancement des comptes nostro immobilisé 🟡.                                                                                                                                                                                                      | ADB 2023 ✅                                                          |
| Opérations         | 1 alerte de fraude sur 5 seulement est vraie ; 1 client sur 6 a eu une transaction légitime refusée (cartes). Paiements échoués/réparés : coût estimé > 100 Md$/an 🟡.                                                                                                                                                                   | arXiv 1710.07709 ✅ ; LexisNexis 🟡                                  |

**Lecture.** Le marché a trois douleurs distinctes : _cher et lent_ (bien documenté, le G20 s'en occupe), _opaque_ (SWIFT gpi a largement répondu sur son réseau) et _dangereux_ (BEC, substitution de bénéficiaire) — et cette dernière n'a **aucune réponse transfrontalière**. Coût et délai sont notre ticket d'entrée ; **l'intégrité du paiement est notre différenciateur**.

---

## 2. Pourquoi les solutions existantes ne suffisent pas

| Famille                            | Exemples                                                                                                                                                 | Ce qu'ils font bien                                          | Ce qu'ils ne font pas                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Routeurs fiat mondiaux fermés      | **Wise Platform** (160+ pays, 40+ devises, 80 licences, 77 % des paiements instantanés < 20 s ✅)                                                        | Vitesse, coût, réseau de licences                            | Réseau propriétaire ; aucune garantie d'intégrité bénéficiaire ; pas d'escrow ; pas de choix de rail par le client                            |
| Agrégateurs B2B licenciés          | **Airwallex** (API publique, payouts locaux, « transfers via stablecoin » ✅), **XTransfer**, **LianLian Global**                                        | Comptes locaux, conformité par pays, paiements vers la Chine | Fermés ; l'utilisateur ne choisit pas le chemin ; contrôles internes non portables                                                            |
| Réseaux stablecoin institutionnels | **Circle Payments Network** (banques, PSP, VASP ; « one‑to‑many », 24/7 ✅)                                                                              | Règlement 24/7, une intégration pour des payouts mondiaux    | Un seul émetteur (USDC), réservé aux institutions, pas d'intégrité côté donneur d'ordre                                                       |
| Interconnexion publique            | **BIS Nexus** (concl., < 60 s entre systèmes instantanés, « une connexion pour tous » ✅), **Agorá** (tokenisation wholesale, en cours ✅), **PAPSS** ✅ | Vision d'infrastructure, standardisation                     | Pas vers la Chine ni la crypto ; horizon long ; pas d'anti‑fraude bout‑en‑bout                                                                |
| Vérification de bénéficiaire       | **CoP** (UK), **VoP** (UE)                                                                                                                               | Efficace contre le détournement domestique                   | Domestique uniquement ; rien sur les rails crypto ni entre juridictions                                                                       |
| Détection de fraude bancaire       | Moteurs des banques, SWIFT Payment Controls                                                                                                              | Détection comportementale                                    | Ratent les BEC : le paiement **est** autorisé par le vrai client ; aucune notion d'« intention signée »                                       |
| Mandats agentiques                 | **AP2** (Google), x402, Open Agent Passport                                                                                                              | Mandats signés, exécution asynchrone                         | Protègent _après_ signature ; failles runtime (replay, concurrence) publiées (arXiv 2608.23858, 2602.06345) ; pas de routage ni de rails fiat |

**Notre place.** Nous n'avons pas de licence et ne déplaçons pas d'argent : nous sommes **la couche d'orchestration et d'intégrité au‑dessus de rails licenciés** (Wise Platform, Circle CPN, PSP locaux, banques, escrow on‑chain). C'est une force : pas de capital réglementaire, intégrable partout, et nous **fusionnons** ce que chacun fait séparément — routage (Wise/Juspay), règlement 24/7 (Circle), vérification de bénéficiaire (CoP/VoP), mandats signés (AP2) — en y ajoutant ce que personne ne vend : la garantie d'intégrité de bout en bout, multi‑rails et multi‑juridictions.

---

## 3. Principe directeur

> **Une intention de paiement signée est la source de vérité. Tout composant ne peut que la restreindre ou la vérifier, jamais l'élargir. Les modèles proposent ; le déterministe dispose ; le donneur d'ordre tranche.**

Corollaires :

- Aucune jambe de paiement n'est exécutée si elle ne correspond pas à l'intention signée (vérification cryptographique dans chaque adaptateur de rail).
- Un modèle (Jev, classifieur, Mistral) ne peut jamais autoriser ce qu'une règle a interdit ; il ne peut que faire passer, retenir ou bloquer.
- Le système fonctionne sans Jev ni Mistral (mode dégradé : règles + humain). Jamais l'inverse.
- Tout nouveau bénéficiaire ou nouveau compte est vérifié hors bande **avant** signature.
- Chaque décision est explicable, rejouable, et personne — y compris nous — ne peut l'effacer.

---

## 4. Architecture

### 4.1 Vue d'ensemble

```
                     ┌──────────────────────────────────────────────────────────────┐
                     │                    DONNEUR D'ORDRE (PME)                     │
                     │   facture → intention signée │ confirme/annule les retenus   │
                     └───────────────┬──────────────────────────▲───────────────────┘
                                     │ PaymentIntent (signé)     │ explication (Mistral)
┌──────────────┐  ┌──────────────────▼───────────────┐  ┌───────┴────────────────────┐
│ Registre de  │◄─┤ 1. INTAKE & INTENTION            │  │ 6. GARDE (Système 1 + 2)   │
│ bénéficiaires│  │ extraction IA, provenance/champ, │  │ règles → classifieur + Jev │
│ vérifiés (VC)│  │ vérif. hors bande, time‑lock     │  │ → Mistral → humain         │
└──────┬───────┘  └──────────────────┬───────────────┘  └───────▲────────────────────┘
       │                             │                          │ chaque geste
┌──────▼───────┐  ┌──────────────────▼───────────────┐          │
│ 3. Profils de│─►│ 4. ROUTEUR                       │──────────┤
│ juridiction  │  │ prédicteurs en ligne (bandits)   │          │
│ (CLEAR)      │  │ + optimiseur déterministe        │          │
└──────────────┘  │ + fractionnement + fallback      │          │
                  └──────────────────┬───────────────┘          │
                                     │ Route = [PaymentLeg…]    │
                  ┌──────────────────▼───────────────┐          │
                  │ 5. ADAPTATEURS DE RAILS          │──────────┘
                  │ SEPA · SWIFT/pain.001 · stablecoin│
                  │ on/off‑ramp · PSP local · escrow │
                  │ (vérifient intent_hash + nonce)  │
                  └──────────────────┬───────────────┘
                                     │ événements normalisés
                  ┌──────────────────▼───────────────┐
                  │ 7. JOURNAL hash‑chaîné, VC,      │
                  │ exports ISO 20022, KPI live      │
                  └──────────────────┬───────────────┘
                                     │ écriture asynchrone / lecture au règlement
                  ┌──────────────────▼───────────────┐
                  │ 8. REGISTRE DE CONFIRMATION      │
                  │ (Avalanche) : intent_hash,       │
                  │ révocation, attestation payee,   │
                  │ racine du journal, escrow        │
                  └──────────────────────────────────┘
```

### 4.2 Les huit composants

**1. Intake & Intention.**
La facture (PDF/image) est extraite en données structurées (vision Claude/Mistral, sorties Zod, score de confiance — brique existante dans la base de code). Le formulaire est pré‑rempli ; **chaque champ porte sa provenance** (`invoice_pdf_email`, `verified_registry`, `user_input`, `psp_attestation`). Le donneur d'ordre signe :

```ts
type PaymentIntent = {
  id: string; // UUID
  payer: Party; // LEI / SIREN / CAC…
  payee: Party; // référence au registre de bénéficiaires
  payee_account: AccountRef; // IBAN / wallet / compte local, avec first_seen
  amount: Money; // montant + devise de facturation
  due_date: string;
  invoice_hash: string; // SHA‑256 du document source
  provenance: Record<keyof PaymentIntent, ProvenanceTag>;
  constraints: { max_total_cost_bps: number; latest_settlement: string; allow_crypto: boolean };
  signature: Signature; // clé du donneur d'ordre ; ≥ seuil → 2 signatures (dual control)
};
```

Règles d'amorçage (déterministes, avant signature) : un `payee_account` dont la provenance est un document non fiable **et** `first_seen` récent déclenche la **vérification hors bande** (appel/WhatsApp au numéro connu du fournisseur — jamais celui de la facture) et un **time‑lock** proportionnel au montant. C'est la contre‑mesure n°1 de la BEC, et les analyses d'AP2 montrent que c'est précisément _avant_ la signature que les protections manquent (arXiv 2608.23858).

**2. Registre de bénéficiaires vérifiés.**
`Payee{ legal_id, kyb_status, accounts[] }`, chaque compte avec sa **preuve** (micro‑dépôt, attestation du PSP, historique de paiements réussis) et sa date de première vue. Amorçage (_cold start_) par sources existantes : LEI/GLEIF, registres du commerce (INPI, CAC Nigeria, Tianyancha), VoP/CoP là où ils existent, attestations des PSP partenaires. Effet réseau : un fournisseur vérifié une fois l'est pour tous les payeurs. Les attestations sont émises comme **Verifiable Credentials** (W3C, divulgation sélective, compatibles EUDI Wallet 2026 — arXiv 2506.00262, 2001.01659).

**3. Profils de juridiction.**

```ts
type Jurisdiction = {
  country: string;
  currency: string;
  rails: RailDescriptor[]; // SEPA Inst, NIP, CNAPS via PSP, USDC/USDT on‑ramp…
  hours: { open: string; close: string; tz: string; weekend: boolean }[];
  cutoffs: string[];
  limits: { per_tx: Money; per_day: Money; docs_required_above: Money };
  requirements: ("VoP" | "TravelRule" | "SAFE_docs" | "OpenBankingNG")[];
  clear_score: {
    cost: number;
    legality: number;
    experience: number;
    architecture: number;
    reach: number;
  };
};
```

La détection de localisation (pays du payeur et du bénéficiaire, devise, entité) charge les deux profils et produit la **liste des chemins légaux**. Chaque rail est noté selon la grille **CLEAR** (Cost, Legality, Experience, Architecture, Reach — SoK stablecoins, arXiv 2601.00196). Ajouter un pays = ajouter un fichier de profil. Démo : FR, CN, NG, US.

**4. Routeur.**

- _Prédicteurs appris en ligne_ : pour chaque rail × heure × tranche de montant, probabilité de succès, délai réel, coût effectif, probabilité de contrôle manuel à l'arrivée. Modèle : GBM léger + **bandits non stationnaires avec boucle de rétroaction**, le schéma utilisé en production par Juspay et Dream11 (arXiv 2510.16735, 2308.01028). Chaque paiement exécuté renvoie son résultat réel et met à jour les scores : **des poids changent**, et on peut le montrer (« après 200 paiements, le routeur a appris que le PSP X est lent le lundi »).
- _Optimiseur déterministe_ : graphe des chemins `devise_source → {rails} → pivot → {rails} → devise_cible`, résolu par programmation convexe (CVXPY, brique existante) : minimiser coût pondéré + délai + risque sous contraintes (horaires, plafonds, `allow_crypto`, `latest_settlement`, risque max). **Explicable** : le solveur produit la justification du chemin.
- _Fractionnement_ : un gros paiement peut être « packetisé » sur plusieurs chemins (idée Spider, arXiv 1809.05088) pour éviter d'épuiser la liquidité d'un rail et réduire le risque de concentration ; le SOR existant le fait déjà pour les sources de liquidité, on l'étend aux chemins complets.
- _Horaires_ : le routeur sait qu'un vendredi 19 h à Paris la jambe CNY ouvre lundi 9 h ; il choisit « provisionner l'escrow/stablecoin maintenant, payer à l'ouverture », avec ETA affiché aux deux parties.
- _Fallback_ : si une jambe échoue ou retourne les fonds, re‑routage automatique sur un autre rail, dans les bornes de l'intention.
- Le stablecoin n'est **pas** toujours gagnant (France → Chine : SWIFT/Airwallex suffisent ; MiCA en UE ; restrictions au Nigeria 🟡) : le routeur peut choisir « pas de crypto ». Il gagne sur Afrique/LatAm, week‑ends et préfinancement.

**5. Adaptateurs de rails.**

```ts
interface RailAdapter {
  quote(input: QuoteInput): Promise<QuoteResult>;
  initiate(leg: PaymentLeg): Promise<TransferResult>; // vérifie intent_hash, nonce, fenêtre
  status(transferId: string): Promise<TransferStatus>;
  onWebhook(req: Request): Promise<NormalizedRailEvent>;
  reconcile(input: ReconciliationInput): Promise<ReconciliationResult>;
  recall?(transferId: string): Promise<RecallResult>; // chemin de retour
}

type PaymentLeg = {
  id: string;
  intent_id: string;
  intent_hash: string;
  nonce: string;
  valid_from: string;
  valid_until: string; // anti‑replay / anti‑doublon
  rail: string;
  direction: "collect" | "convert" | "escrow" | "payout";
  debtor: Party;
  creditor: Party;
  amount: Money;
  end_to_end_id: string;
  remittance_info: string; // ISO 20022
  idempotency_key: string;
  status: "initiated" | "pending" | "settled" | "failed" | "returned";
  credentials: VerifiableCredential[]; // KYB, AML, Travel Rule, documents
  hop_chain: SignedHop[]; // provenance de délégation (HDP)
};
```

Modèle canonique inspiré d'ISO 20022 (pain.001 / pacs.008 / camt.054), états normalisés, idempotence. **Chaque adaptateur vérifie, avant d'exécuter, que la jambe correspond à l'intention** (montant, devise, bénéficiaire, `intent_hash`) et que le **nonce** n'a pas déjà été consommé dans la fenêtre — réponse directe aux failles runtime d'AP2 (replay, concurrence, re‑tentatives). La chaîne de hops signés reprend la structure du protocole HDP (arXiv 2604.04522) : on peut prouver, pour toute jambe, par quelle chaîne d'autorisation elle a été produite. Pour la jambe stablecoin/escrow, la conformité est vérifiée **au point d'exécution** par un _policy wrapper_ on‑chain (arXiv 2605.00071) : montant ≤ intention, bénéficiaire ∈ intention, credentials présents, intention non révoquée. Démo : SEPA, stablecoin on/off‑ramp, PSP CNY, escrow on‑chain (contrat `TradeEscrow` existant), export pain.001.

**6. Garde — Système 1 + Système 2.**
Intercepte _chaque_ geste : créer/modifier/exécuter une jambe, changer un paramètre, re‑router.

- **Règles déterministes** (Cedar/OPA ou code) : plafonds, sanctions, allowlist, provenance (paramètre sensible issu d'un document non fiable → vérification obligatoire), nouveau compte → time‑lock, dual control au‑dessus d'un seuil. 0 ms, non contournables. Le benchmark APort Vault (4 371 attaques humaines, 14 modèles) montre qu'un **contrôle déterministe pré‑action** réduit massivement le taux d'attaques réussies par rapport au modèle seul (arXiv 2609.22076).
- **Classifieur comportemental** (GBM) : features de l'**historique du couple payeur‑fournisseur** — nouveauté du bénéficiaire/compte, écart au montant habituel, cadence, heure, pays, délai facture→paiement, changement récent de coordonnées. Ce sont les features comportementales qui divisent les faux positifs (arXiv 1710.07709). Explications TreeSHAP.
- **Jev (Système 1)** : banque de **questions fixes sur champs normalisés**, réponse = probabilité calibrée en 100–300 ms : « ce geste est‑il inclus dans l'intention signée ? », « ce changement de coordonnées en transit est‑il anormal ? », « cette facture a‑t‑elle les caractéristiques d'une BEC (domaine proche, urgence, nouveau compte) ? ». Jev juge la sémantique ; le classifieur juge le comportement ; **désaccord → retenir**.
- **Score de risque cumulé + budget d'alertes** : plutôt que deux seuils binaires, chaque paiement accumule un score de risque (règles + classifieur + Jev) traité comme **priorisation continue** (risk‑based alerting, arXiv 2609.02465) ; le donneur d'ordre ne voit que le haut de la liste, et le budget de retenues s'adapte à sa capacité (cible : < 3 % des paiements légitimes retenus ; gestion de capacité selon arXiv 2206.13202).
- **Mistral (Système 2)** : uniquement sur les cas retenus. Analyse facture + contexte + historique → explication en langage clair + recommandation (« l'IBAN diffère de vos 12 paiements précédents à ce fournisseur, est domicilié dans un autre pays, et la facture provient d'un domaine proche mais différent »). Hors chemin critique ; **sans pouvoir d'autoriser** ; le schéma « LLM borné appliqué aux cas incertains » suit arXiv 2607.19266. Remplaçable (modèle européen par défaut).
- **Donneur d'ordre (humain dans la boucle)** : notification hors bande avec l'explication → confirme / annule ; au‑dessus d'un seuil, **deux personnes** (multi‑signature). Kill switch sur le paiement et ses jambes.

**7. Journal, conformité portable, mesure.**
Chaque décision est un événement **hash‑chaîné** (qui, quoi, preuve, règle/question, score, explication). Racine ancrée périodiquement dans le registre de confirmation (composant 8) : ni un initié ni l'opérateur de la plateforme ne peuvent réécrire l'historique (« Who audits the auditor ? », arXiv 2604.22096). Les contrôles effectués (KYB, AML, Travel Rule IVMS101, documents SAFE) sont émis comme **Verifiable Credentials** attachés à la route : chaque maillon les vérifie sans les refaire — c'est la réponse à « multiplication des contrôles ». Exports ISO 20022 (pain.001, camt.054) et rapport d'audit. **KPI live** : coût total %, délai, taux STP, fraudes bloquées, faux positifs, économies cumulées.

**8. Registre de confirmation (Avalanche).**
Un contrat sur Avalanche (C‑Chain ; Fuji pour la démo, sous‑réseau dédié envisageable) sert de **source de confirmation indépendante de la plateforme** : ce que nous affirmons, n'importe quel maillon peut le vérifier sans nous faire confiance.

- _Intentions_ : à la signature, `intent_hash`, payeur (identifiant haché), bénéficiaire (haché), montant plafond, devise et date limite sont publiés. Un rail, un PSP ou le fournisseur **confirme** qu'une jambe correspond à une intention existante avant d'exécuter ou d'accepter des fonds.
- _Révocation / kill switch_ : la révocation d'une intention est inscrite on‑chain ; tous les maillons la voient au même instant, y compris un adaptateur que nous ne contrôlons pas.
- _Attestation de bénéficiaire_ : le fournisseur (ou le PSP qui tient son compte) signe une attestation « ce compte m'appartient » dont le hash est ancré ; la vérification de bénéficiaire devient **vérifiable par n'importe qui**, pas seulement par nous — c'est l'extension transfrontalière de CoP/VoP sous une forme neutre.
- _Journal_ : racine de la chaîne de hashs publiée périodiquement.
- _Escrow conditionnel_ : le contrat `TradeEscrow` (existant) ne libère les fonds que s'il lit sur la chaîne « intention confirmée, non révoquée, bénéficiaire attesté, credentials présents » (policy wrapper, arXiv 2605.00071).
  Contraintes : écriture **asynchrone** (jamais sur le chemin critique de la garde : ~2 s de finalité Avalanche contre < 500 ms visés), lecture synchrone uniquement au moment du règlement d'une jambe ; **aucune donnée personnelle en clair** (hashes et engagements seulement, RGPD/PIPL) ; le système fonctionne si la chaîne est indisponible (mode dégradé : confirmation par notre API, signalé comme tel). Pourquoi Avalanche : finalité ~1–2 s, frais faibles, EVM (réutilisation de `TradeEscrow.sol` et de viem), sous‑réseaux permissionnés possibles pour un consortium de PSP.

### 4.3 Pourquoi cette architecture est innovante

1. **Intention signée comme source de vérité, vérifiée dans chaque rail** — personne ne le fait pour les paiements B2B fiat ; AP2 le fait pour le commerce agentique, mais après signature et sans rails.
2. **Protection avant signature** (provenance des champs, vérification hors bande) — comble la faille structurelle identifiée dans les protocoles de mandats.
3. **Vérification de bénéficiaire transfrontalière et multi‑rails** — ce que CoP/VoP font domestiquement, étendu au monde et à la crypto.
4. **Routeur qui apprend en ligne mais décide de façon déterministe et explicable** — l'état de l'art des orchestrateurs de paiement, appliqué à des rails hétérogènes avec horaires et réglementation.
5. **Deux juges indépendants + un raisonneur borné + un humain** — rapide (ms), calibré, explicable, et résistant à l'_approval fatigue_ grâce au budget d'alertes.
6. **Conformité portable en Verifiable Credentials** — compatible EUDI, interopérable par construction.
7. **Journal infalsifiable qui couvre aussi le workflow d'approbation** — argument DORA / assureur.
8. **Confirmation indépendante de la plateforme (Avalanche)** — intentions, révocations et attestations de bénéficiaire vérifiables par tout maillon sans nous faire confiance ; la vérification de bénéficiaire transfrontalière devient un bien commun, pas un silo de plus.

### 4.4 Pourquoi c'est plus rapide et moins cher

- _Rapide_ : règles 0 ms, Jev 100–300 ms, classifieur < 10 ms → la garde ajoute < 0,5 s par geste ; Mistral n'intervient que sur les retenus. Le règlement stablecoin/escrow tourne 24/7 ; les jambes fiat sont planifiées à l'ouverture avec ETA. Cible démo : fonds disponibles < 1 h quand les rails sont ouverts, provisionnés sinon.
- _Moins cher_ : pas de chaîne de correspondants (3–4 intermédiaires → 1–2 jambes), choix du rail le moins cher à l'instant t, fractionnement pour éviter le slippage, contrôles faits une fois. Jev coûte ~0,04 $/M tokens d'entrée, sortie gratuite 🟡 (prix LawHack) → ≈ 84 $ par million de jugements contre ≈ 1 200 $ avec un LLM large en juge (hypothèse 2 k tokens/appel). Cible démo : coût total < 1 % sur le corridor (cible G20 2027), contre 6–8 % aujourd'hui.

---

## 5. Flux

**Nominal.** Facture → extraction → bénéficiaire connu (12 paiements réussis, VC KYB valide) → intention signée → juridictions FR/CN → routeur : SEPA Inst → USDC → PSP CNY, choisi car vendredi 19 h à Paris et jambe CNY ouverte lundi 9 h ; escrow provisionné maintenant → garde : règles ✔, classifieur 0,03, Jev « geste ⊂ intention » 0,97 → `intent_hash` publié sur Avalanche (asynchrone) → exécution jambe par jambe, chaque adaptateur vérifie `intent_hash` + nonce, le PSP CNY confirme l'intention sur la chaîne avant de créditer → journal → notification « payé lundi 9 h 04, coût 0,9 %, 18 h ».

**Attaque BEC.** Facture modifiée reçue d'un domaine proche, nouvel IBAN → provenance = `invoice_pdf_email`, `first_seen` = aujourd'hui → **règle** : vérification hors bande obligatoire + time‑lock (avant signature) ; classifieur 0,81 ; Jev « correspond à l'historique ? » 0,12 → **retenu** → Mistral : explication → appel au numéro connu du fournisseur → le donneur d'ordre annule → le paiement repart vers le compte vérifié ; tout est dans le journal, exportable.

**Substitution en transit.** Après signature, un adaptateur compromis ou une re‑tentative tente d'exécuter une jambe vers un autre compte → l'adaptateur aval refuse (`intent_hash` ≠, nonce consommé, ou intention introuvable/révoquée dans le registre Avalanche) → la garde détecte la dérive → kill switch sur la route → fallback vers un autre rail → alerte, preuve dans le journal.

**Défaillance de rail.** Le PSP CNY retourne les fonds → événement `returned` normalisé → re‑routage automatique (autre PSP ou pain.001 SWIFT) dans les bornes de l'intention → ETA mis à jour → aucune action humaine si le nouveau chemin respecte `max_total_cost_bps` et `latest_settlement`.

---

## 6. Évaluation : prouver que c'est une vraie solution

- **Jeu d'évaluation** : ≈ 500 scénarios — paiements légitimes (variés en pays, montants, heures), BEC (nouveau compte, domaine proche, urgence), substitution en transit, montants anormaux, replays/doublons, rails défaillants. Construit à partir du générateur synthétique **AMLworld** (IBM, arXiv 2306.16424) et d'attaques type **APort** (arXiv 2609.22076). Les **raccourcis de simulateur** sont identifiés et retirés avant toute mesure (leçon d'arXiv 2607.19266).
- **Métriques publiées** : taux de détection sur scénarios d'attaque (cible > 95 %), taux de retenue sur légitimes (cible < 3 %), latence de la garde (p95 < 500 ms), coût total %, délai, STP, taux de re‑routage réussi.
- **Ablations** : règles seules / + classifieur / + Jev / + Mistral, pour montrer la contribution de chaque couche — et que le système tient sans les modèles.
- **Tableau de bord live** pendant la démo.

---

## 7. Marché, adoption, modèle économique

**Deux clients.**

1. La **PME** achète _un paiement moins cher avec garantie d'intégrité_ : tarification en points de base sur le volume, inférieure au coût actuel.
2. La **fintech / le PSP / la banque** achète _la couche_ (API/SDK, abonnement) : conformité VoP/Travel Rule/DORA, réduction des pertes BEC, nouveaux corridors sans intégrations bilatérales. C'est le mode **layer++** : l'acheteur garde ses rails et ses agents ; on s'insère devant (proxy d'orchestration) ou à côté (garde seule, mode ombre → lint → hold → enforcement).

**Déploiement progressif.** Semaine 1 : mode ombre (la garde observe et score, rien ne bloque) → semaine 2 : vérification hors bande sur nouveaux bénéficiaires → semaine 3 : hold sur retenus → semaine 4 : enforcement + rapport. L'acheteur voit en 30 jours : fraudes qui seraient passées, économies de coût/délai, faux positifs réels.

**Ce qu'on ne couvre pas (à assumer).** Nous n'émettons ni ne détenons de fonds (dépendance à des rails licenciés) ; la vérification hors bande exige la coopération du fournisseur ; le registre a un _cold start_ atténué mais réel ; Jev est un service hébergé avec quota ; MiCA/PIPL/RGPD imposent des contraintes de localisation des données à traiter en production.

---

## 8. Plan 36 h et ordre de coupe

| Fenêtre     | Livrable                                                                                                                                                                                      | Coupe              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| H+0 → H+6   | Modèle `PaymentIntent` / `PaymentLeg` / profils FR‑CN ; registre amorcé (fixtures) ; 3 adaptateurs mock avec statuts + webhooks ; vérification `intent_hash` + nonce                          | cœur, jamais coupé |
| H+6 → H+14  | Garde : règles + classifieur (features historiques) + banque de questions Jev + seuils/score cumulé ; Mistral sur retenus ; notification + confirmation donneur d'ordre ; journal hash‑chaîné | cœur               |
| H+14 → H+20 | Routeur : optimiseur (CVXPY existant) + prédicteurs en ligne (bandit) + horaires + fallback ; UI : intention, timeline multi‑rails, KPI live ; scène BEC et scène transit                     | cœur               |
| H+20 → H+26 | Jeu d'évaluation (AMLworld + APort), métriques, ablations ; exports ISO 20022 ; VC pour KYB/AML                                                                                               | 3ᵉ coupe           |
| H+26 → H+30 | Registre de confirmation Avalanche (Fuji) : publication `intent_hash` + révocation, lecture par les adaptateurs ; profils NG/US ; un sandbox réel (Airwallex)                                 | 2ᵉ coupe           |
| H+30 → H+34 | **Bonus** : attestation de bénéficiaire ancrée, ancrage du journal, escrow conditionnel (policy wrapper), fractionnement multi‑rails                                                          | 1ʳᵉ coupe          |
| H+34 → H+36 | Pitch 3 min (une histoire, un chiffre), vidéo de secours                                                                                                                                      | jamais coupé       |

Base de code : plateforme B2B existante (intake, quote engine/SOR, escrow, dashboard, i18n ≈ 60 % du routeur) copiée dans ce dépôt, à laquelle on ajoute la couche garde, les adaptateurs et le registre de confirmation.

---

## 9. Risques et réponses au jury

| Objection                                             | Réponse                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Wise / Airwallex le font déjà »                     | Ils routent dans leur réseau fermé ; aucun ne garantit l'intégrité du bénéficiaire de bout en bout ni ne laisse le client choisir le rail. Nous nous posons **au‑dessus** d'eux.                                                                                                                     |
| « Vous n'avez pas de licence »                        | Exact, et c'est voulu : couche d'orchestration et d'intégrité, pas de détention de fonds ; intégrable chez les licenciés.                                                                                                                                                                            |
| « Un LLM qui décide des paiements ? »                 | Non : règles déterministes d'abord, Jev et classifieur ne peuvent que restreindre, Mistral explique sans autoriser, le donneur d'ordre tranche. Le système tourne sans les modèles.                                                                                                                  |
| « Le stablecoin est risqué/illégal chez moi »         | `allow_crypto = false` : le routeur choisit un chemin fiat ; les profils de juridiction encodent la légalité (score CLEAR).                                                                                                                                                                          |
| « Le fraudeur contrôle déjà la boîte mail du payeur » | Provenance des champs + vérification hors bande sur un canal connu + time‑lock + dual control : la BEC classique échoue même si l'e‑mail est compromis.                                                                                                                                              |
| « Faux positifs, les PME vont désactiver »            | Budget d'alertes adaptatif, score cumulé, features historiques : cible < 3 % de retenue, mesurée et publiée.                                                                                                                                                                                         |
| « Et la preuve ? »                                    | Journal hash‑chaîné couvrant décisions **et** approbations, ancré sur Avalanche, exports ISO 20022 et rapport d'audit.                                                                                                                                                                               |
| « Pourquoi une blockchain ? »                         | Pas pour déplacer l'argent : pour que la confirmation d'une intention, sa révocation et l'attestation du bénéficiaire soient vérifiables par des maillons qui ne nous font pas confiance (PSP, fournisseur, auditeur). Hors chemin critique, sans données personnelles, le système tourne sans elle. |

---

## 10. Bibliographie

**Institutions et marché**

- FSB — _G20 Targets for Enhancing Cross‑border Payments_ (cibles 2027) ✅ ; _Annual Progress Report, KPI 2024_ (oct. 2024) ✅.
- BIS/CPMI — _Enhancing cross‑border payments: building blocks of a global roadmap_ (CPMI Papers 194, 2020) ✅ ; BIS Innovation Hub — _Project Nexus_ (conclu) ✅, _Project Agorá_ (en cours, maj mai 2026) ✅ ; BIS WP 1270 _Stablecoins and safe asset prices_ (2025) ✅.
- Banque mondiale — _Remittance Prices Worldwide_, T3 2025 ✅. ADB — _Trade Finance Gaps, Growth and Jobs Survey_ 2023 ✅.
- Swift — _Swift GPI_ ✅. Pay.UK — _Confirmation of Payee_ ✅. EUR‑Lex — Règlement (UE) 2024/886 (paiements instantanés, vérification du bénéficiaire) ✅.
- FBI IC3 — _2025 Internet Crime Report_ ✅ ; PSA I‑091124 _BEC: The $55 Billion Scam_ ✅. AFP — _2026 Payments Fraud and Control Survey_ ✅. Chainalysis — _2026 Crypto Crime Report_ ✅. FATF — _Targeted Update on Virtual Assets and VASPs_ (2025) ✅.
- Wise Platform, Circle Payments Network, Airwallex, XTransfer, LianLian Global, Open Banking Nigeria — pages produit/documentation ✅.

**Recherche**

- Routage : _Maximizing Success Rate of Payment Routing using Non‑stationary Bandits_ (arXiv 2308.01028) ; _A Control‑Theoretic Approach to Dynamic Payment Routing_ (arXiv 2510.16735) ; _Spider: High Throughput Cryptocurrency Routing in Payment Channel Networks_ (arXiv 1809.05088) ; _SoK: Stablecoins in Retail Payments_ — cadre CLEAR (arXiv 2601.00196).
- Mandats et autorisation : _Beyond the Mandate: Security Analysis of AP2_ (arXiv 2608.23858) ; _Zero‑Trust Runtime Verification for Agentic Payment Protocols_ (arXiv 2602.06345) ; _HDP: Human Delegation Provenance_ (arXiv 2604.04522) ; _Cryptographically Verifiable Agent Authorization_ (arXiv 2607.21325) ; _Compliance‑Aware Agentic Payments on Stablecoin Rails_ (arXiv 2605.00071) ; _APort Vault_ (arXiv 2609.22076).
- Fraude : _CAPE — Modular and Adaptive BEC Detection_ (arXiv 2308.10776) ; _Solving the "false positives" problem in fraud prediction_ (arXiv 1710.07709) ; _Toward Auditable Fraud Detection_ (arXiv 2607.19266) ; _FraudTransformer_ (arXiv 2509.23712) ; _Realistic Synthetic Financial Transactions for AML — AMLworld_ (arXiv 2306.16424) ; _Who Audits the Auditor? Blockchain‑Anchored Explainable ML_ (arXiv 2604.22096).
- Humain dans la boucle : _Can Risk‑Based Alerting Mitigate Alert Fatigue?_ (arXiv 2609.02465) ; _Human‑AI Collaboration in Decision‑Making: Beyond Learning to Defer_ (arXiv 2206.13202) ; _A Survey on LLM‑as‑a‑Judge_ (arXiv 2411.15594).
- Conformité portable : _KYChain_ (arXiv 2001.01659) ; _Compact and Selective Disclosure for Verifiable Credentials_ (arXiv 2506.00262).
