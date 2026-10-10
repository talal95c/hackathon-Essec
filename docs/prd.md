# PRD — Payment Integrity Router (nom de travail)

> Product Requirements Document, v1 — Secure Horizons, ESSEC, 10–11 octobre 2026, Track 1.
> Document de référence amont : [`docs/projet.md`](./projet.md) (problématique, douleur chiffrée, architecture, bibliographie). Ce PRD ne redit pas le _pourquoi_ ; il fixe le _quoi_ : ce que le produit doit faire, pour qui, avec quels critères d'acceptation et quelles priorités.
> Priorités : **P0** = cœur de la démo, jamais coupé · **P1** = complète la solution, coupé en dernier · **P2** = bonus / roadmap.

---

## 1. Vision et objectifs

### 1.1 Vision

Permettre à une entreprise de payer n'importe quelle autre entreprise, partout dans le monde, par le chemin le plus rapide et le moins cher, **avec la garantie qu'aucun paiement ne part vers un bénéficiaire ou un montant qu'elle n'a pas voulu** — et la preuve pour l'audit.

### 1.2 Ce que le produit est / n'est pas

- **Est** : une couche d'orchestration et d'intégrité au‑dessus de rails de paiement licenciés (banques, PSP, on/off‑ramps stablecoin, escrow on‑chain), utilisable par une PME (application) ou intégrée par une fintech/PSP (API, mode _layer++_).
- **Tracks** : Track 1 (transactions sur une L1 Avalanche dédiée, registre de confirmation, jambe stablecoin chiffrée) en principal ; Track 3 en secondaire (défense agentique : Système 1 Jev / Système 2 Mistral déclenchent, retiennent ou bloquent, l'humain tranche).
- **N'est pas** : un établissement de paiement, un détenteur de fonds, un émetteur de stablecoin, un outil de détection de fraude bancaire générique, ni une messagerie d'agents IA.

### 1.3 Objectifs mesurables

| KPI produit                     | Définition                                                                 | Cible hackathon (jeu d'évaluation)                                                      | Cible 6 mois (pilotes)                            |
| ------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Taux de détournement**        | paiements exécutés vers un bénéficiaire/montant ≠ intention signée / total | **0** sur le jeu d'attaque                                                              | 0 confirmé sur volume réel                        |
| **Confirmations on‑chain** (P1) | intentions publiées et lues par un adaptateur avant règlement              | 100 % des paiements de la démo si F‑AVAX‑1/2 livrés, aucune donnée personnelle en clair | idem, sous‑réseau consortium à l'étude            |
| **Détection des attaques**      | scénarios d'attaque retenus ou bloqués / scénarios d'attaque               | > 95 %                                                                                  | > 98 %                                            |
| **Faux positifs**               | paiements légitimes retenus / paiements légitimes                          | < 3 %                                                                                   | < 2 %, budget d'alertes respecté                  |
| **Coût total**                  | frais + spread FX + frais de rail, en % du montant                         | < 1 % sur le corridor démo                                                              | < 1,5 % moyenne, aucun corridor > 3 % (cible G20) |
| **Délai de disponibilité**      | signature → fonds disponibles chez le bénéficiaire                         | < 1 h rails ouverts ; provisionné 24/7 sinon                                            | 75 % < 1 h                                        |
| **Latence de la garde**         | p95 par geste, sans Mistral                                                | < 50 ms sans Jev ; < 1 s aux points Jev                                                 | < 500 ms aux points Jev                           |
| **STP**                         | paiements sans intervention humaine ni re‑routage                          | > 90 % des légitimes                                                                    | > 95 %                                            |
| **Extension**                   | ajout d'un pays                                                            | 1 fichier de profil, < 1 h                                                              | idem + sandbox réel < 1 semaine                   |

### 1.4 Objectif de la démo (3 min)

Une PME française paie 48 000 $ à un fournisseur chinois un vendredi 19 h ; le routeur choisit SEPA → USDC → PSP CNY, provisionne maintenant, règle lundi 9 h ; une facture BEC avec nouvel IBAN est retenue en < 1 s, expliquée par Mistral, refusée par le donneur d'ordre ; une substitution en transit est refusée par l'adaptateur ; le tableau de bord affiche coût 0,9 %, délai 18 h, 2 fraudes bloquées, 0 faux positif ; on ajoute le Nigeria en un fichier.

---

## 2. Utilisateurs et personas

| Persona                                         | Rôle                                                                                   | Besoin principal                                                         | Peur principale                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| **Claire, DAF d'une PME** (donneur d'ordre)     | Crée et signe les demandes de paiement, confirme ou annule les retenus                 | Payer vite, moins cher, sans se faire piéger                             | Virer 48 k$ à un fraudeur et devoir l'expliquer au CEO |
| **Marc, CEO / 2ᵉ approbateur**                  | Co‑signe au‑dessus d'un seuil                                                          | Garder le contrôle sans tout relire                                      | Être dérangé pour rien (approval fatigue)              |
| **M. Chen, fournisseur** (bénéficiaire)         | Fournit ses coordonnées, répond à la vérification hors bande, suit l'arrivée des fonds | Être payé à l'heure, savoir quand                                        | Perdre une commande à cause d'un paiement bloqué       |
| **Aïcha, intégratrice chez un PSP** (_layer++_) | Branche la couche devant ses rails via API                                             | Conformité VoP/Travel Rule, réduction des pertes BEC, nouveaux corridors | Casser ses flux existants                              |
| **Auditeur / assureur**                         | Consulte la preuve a posteriori                                                        | Rejouer une décision, prouver qu'elle n'a pas été modifiée               | Un journal réécrit par l'opérateur                     |
| **Ops de la plateforme** (nous)                 | Supervise rails, incidents, modèles                                                    | Voir ce qui dérive, couper un rail                                       | Un adaptateur compromis qui exécute en silence         |

---

## 3. Parcours utilisateur

### 3.1 Paiement nominal (P0)

1. Claire dépose la facture (PDF) → extraction automatique (bénéficiaire, compte, montant, devise, échéance) avec score de confiance et provenance par champ.
2. Le bénéficiaire est **connu** (12 paiements réussis, KYB valide) → formulaire pré‑rempli, aucune vérification supplémentaire.
3. Claire fixe ses contraintes (coût max, date limite, crypto autorisée ou non) et **signe** l'intention.
4. Le routeur affiche le chemin choisi, son coût, son ETA et sa justification (« SEPA → USDC → PSP CNY : 0,9 %, lundi 9 h ; SWIFT direct : 2,4 %, mercredi »).
5. Exécution jambe par jambe, timeline en direct ; M. Chen reçoit un lien de suivi.
6. Notification finale « payé, 0,9 %, 18 h » ; l'événement entre dans le journal et les KPI.

### 3.2 Nouveau bénéficiaire / nouveau compte (P0)

1. Facture d'un fournisseur jamais payé, ou compte différent d'un fournisseur connu.
2. Le système indique **avant signature** : « compte vu pour la première fois, provenance : PDF reçu par e‑mail » → vérification hors bande requise.
3. Claire déclenche la vérification : appel/WhatsApp au numéro **déjà connu** du fournisseur (jamais celui de la facture), ou micro‑dépôt, ou attestation PSP.
4. Le compte passe en `verified` (credential émis) ; un **time‑lock** proportionnel au montant s'applique au premier paiement.
5. Claire signe ; le reste suit 3.1.

### 3.3 Retenu pour suspicion BEC (P0)

1. Facture « urgente » d'un fournisseur connu, domaine expéditeur proche mais différent, nouvel IBAN dans un autre pays.
2. Règles : provenance non fiable + compte nouveau → vérification obligatoire ; classifieur 0,81 ; Jev « correspond à l'historique ? » 0,12 → **retenu**.
3. Mistral produit l'explication en clair et une recommandation.
4. Claire reçoit une notification **hors bande** (app/SMS, pas e‑mail) avec l'explication ; elle appelle le fournisseur, confirme la fraude, **annule**.
5. Le paiement repart vers le compte vérifié d'origine ; l'incident est journalisé et exportable.

### 3.4 Substitution en transit (P0)

1. Après signature, un adaptateur compromis (ou une re‑tentative) tente d'exécuter une jambe vers un autre compte, ou de rejouer une jambe déjà exécutée.
2. L'adaptateur aval refuse : `intent_hash` ≠ ou nonce déjà consommé.
3. La garde détecte la dérive → **kill switch** sur la route, révocation inscrite sur Avalanche (visible par tous les rails) → fallback vers un autre rail → alerte Ops + Claire.
4. Preuve dans le journal (jambe refusée, raison, horodatage).

### 3.5 Rail défaillant (P1)

1. Le PSP CNY retourne les fonds (`returned`).
2. Re‑routage automatique dans les bornes de l'intention (coût max, date limite) ; si impossible, retenue et proposition à Claire.
3. ETA mis à jour pour Claire et M. Chen.

### 3.6 Consultation d'audit (P1)

L'auditeur ouvre un paiement, voit la chaîne complète (intention → route → gestes → décisions → preuves), vérifie la chaîne de hashs et **confirme sur Avalanche**, sans notre API, que l'intention publiée correspond et n'a pas été révoquée (racine du journal ancrée en P2), exporte un rapport et les fichiers ISO 20022.

### 3.7 Intégration _layer++_ (P2)

Aïcha branche la garde en **mode ombre** devant ses flux existants (observe et score, ne bloque rien), puis active progressivement vérification hors bande, hold, enforcement.

---

## 4. Exigences fonctionnelles

Format : **ID** · priorité · _user story_ · critères d'acceptation (CA).

### 4.1 Intake & intention

- **F‑INT‑1** · P0 · _En tant que donneur d'ordre, je dépose une facture et obtiens un formulaire pré‑rempli._ CA : PDF/PNG/JPG ≤ 10 Mo ; champs extraits (bénéficiaire, compte, montant, devise, échéance, référence) avec score de confiance ; champ < 0,8 surligné ; extraction ≤ 10 s.
- **F‑INT‑2** · P0 · _Chaque champ porte sa provenance._ CA : valeurs ∈ {`invoice_pdf_email`, `invoice_pdf_portal`, `verified_registry`, `user_input`, `psp_attestation`, `history`} ; affichée au survol ; immuable après signature.
- **F‑INT‑3** · P0 · _Je fixe mes contraintes._ CA : `max_total_cost_bps`, `latest_settlement`, `allow_crypto` ; valeurs par défaut issues du profil entreprise ; stockées dans l'intention.
- **F‑INT‑4** · P0 · _Je signe l'intention._ CA : signature de la clé du donneur d'ordre (WebAuthn/passkey ou clé gérée) sur le hash canonique de l'intention ; `intent_hash` affiché ; toute modification après signature crée une **nouvelle** intention.
- **F‑INT‑5** · P1 · _Au‑dessus d'un seuil, deux signatures._ CA : seuil configurable par entreprise (défaut 20 k€) ; 2ᵉ approbateur notifié hors bande ; aucune jambe créée avant la 2ᵉ signature.
- **F‑INT‑6** · P1 · _Je peux révoquer une intention._ CA : révocation → toutes les jambes non exécutées annulées, jambes en cours rappelées si le rail le permet ; événement journalisé.

### 4.2 Registre de bénéficiaires vérifiés

- **F‑REG‑1** · P0 · _Le système sait si un bénéficiaire/compte est connu._ CA : `first_seen`, nombre de paiements réussis, statut KYB, preuves du compte ; affiché avant signature.
- **F‑REG‑2** · P0 · _Tout nouveau compte passe par une vérification hors bande._ CA : canal ≠ canal de la facture, utilisant un contact déjà enregistré ; options micro‑dépôt / attestation PSP ; statut `verified` avec date, méthode, opérateur ; sans vérification, la signature est **bloquée** (pas seulement avertie) si la provenance est non fiable.
- **F‑REG‑3** · P0 · _Un time‑lock s'applique au premier paiement vers un nouveau compte._ CA : barème par montant (ex. < 5 k€ : 0 ; 5–50 k€ : 4 h ; > 50 k€ : 24 h), configurable ; affiché dans l'ETA ; outrepassable uniquement par dual control.
- **F‑REG‑4** · P1 · _Amorçage par sources existantes._ CA : import LEI/GLEIF, registres (INPI, CAC, Tianyancha) en fixtures/API ; VoP/CoP consultés quand disponibles.
- **F‑REG‑5** · P1 · _Les attestations sont des Verifiable Credentials._ CA : format W3C VC, émetteur, validité, divulgation sélective (« compte vérifié » sans exposer les documents).
- **F‑REG‑6** · P2 · _Un fournisseur vérifié l'est pour tous les payeurs._ CA : partage inter‑entreprises des VC avec consentement du fournisseur.

### 4.3 Profils de juridiction

- **F‑JUR‑1** · P0 · _La localisation des deux parties est détectée et charge les profils._ CA : pays/devise/entité déduits du registre et de l'IBAN/compte ; profils FR et CN complets ; profil = un fichier déclaratif.
- **F‑JUR‑2** · P0 · _Un profil décrit rails, horaires, plafonds, exigences._ CA : rails disponibles, heures d'ouverture/cut‑offs/fuseaux/week‑ends, plafonds par transaction et par jour, documents requis au‑dessus d'un seuil, exigences (VoP, Travel Rule, SAFE, Open Banking NG), score CLEAR par rail.
- **F‑JUR‑3** · P2 · _Information fiscale par corridor._ CA : le profil porte `fiscalite` { convention bilatérale OUI/NON (réseau OCDE), retenue à la source indicative sur services, documents attendus (certificat de résidence, facture conforme) } ; affiché dans « Chemin proposé » et dans la notification au fournisseur ; **le routeur informe, ne calcule ni ne retient d'impôt** (NF‑11).
- **F‑JUR‑3** · P1 · _Ajouter un pays = ajouter un profil._ CA : profils NG et US ajoutés pendant la démo ; aucun changement de code.
- **F‑JUR‑4** · P1 · _Les chemins illégaux n'existent pas._ CA : un rail non autorisé pour la paire (pays, devise, montant) n'apparaît pas dans le graphe ; `allow_crypto = false` exclut toute jambe crypto.

### 4.4 Routeur

- **F‑RTR‑1** · P0 · _Le routeur propose le meilleur chemin avec justification._ CA : optimiseur convexe sous contraintes (coût max, date limite, horaires, plafonds, risque) ; sortie = liste ordonnée de jambes + coût total % + ETA + justification lisible ; ≤ 2 s.
- **F‑RTR‑2** · P0 · _Le routeur tient compte des horaires._ CA : une jambe fermée est planifiée à la prochaine ouverture ; la jambe amont (collecte/escrow/stablecoin) peut s'exécuter immédiatement ; ETA = heure locale du bénéficiaire.
- **F‑RTR‑3** · P0 · _Le routeur compare au moins 3 chemins._ CA : fiat direct (SWIFT/pain.001), stablecoin (on‑ramp → off‑ramp), PSP local ; la comparaison est affichée.
- **F‑RTR‑4** · P1 · _Les prédicteurs apprennent des paiements exécutés._ CA : par rail × heure × tranche de montant : p(succès), délai, coût effectif, p(contrôle manuel) ; mise à jour en ligne (bandit non stationnaire) après chaque résultat réel ; écran « ce que le routeur a appris » (évolution des scores).
- **F‑RTR‑5** · P1 · _Fallback automatique._ CA : jambe `failed`/`returned` → re‑route dans les bornes de l'intention sans action humaine ; sinon retenue.
- **F‑RTR‑6** · P2 · _Fractionnement multi‑chemins._ CA : un paiement peut être divisé sur ≥ 2 chemins si cela réduit coût ou risque ; chaque fraction porte le même `intent_hash` ; somme des fractions = montant de l'intention, vérifiée.

### 4.5 Adaptateurs de rails

- **F‑RAIL‑1** · P0 · _Interface commune._ CA : `quote`, `initiate`, `status`, `onWebhook`, `reconcile` (+ `recall` optionnel) ; modèle `PaymentLeg` canonique (ISO 20022 : `end_to_end_id`, débiteur, créancier, montant, devise, `remittance_info`) ; états `initiated → pending → settled | failed | returned`.
- **F‑RAIL‑2** · P0 · _Aucune jambe exécutée si elle ne correspond pas à l'intention._ CA : avant `initiate`, l'adaptateur vérifie `intent_hash` (montant, devise, bénéficiaire ⊂ intention), fenêtre `valid_from/valid_until`, nonce non consommé, intention non révoquée ; refus journalisé avec raison ; test automatisé pour chaque adaptateur.
- **F‑RAIL‑3** · P0 · _Idempotence._ CA : même `idempotency_key` → même résultat, aucune double exécution ; testé par re‑soumission.
- **F‑RAIL‑4** · P0 · _Trois adaptateurs simulés réalistes._ CA : SEPA Inst (délai 10 s, horaires 24/7), stablecoin on/off‑ramp (slippage simulé, 24/7), PSP CNY (horaires lun–ven 9–17 CST, retour aléatoire paramétrable) ; webhooks normalisés ; clairement étiquetés « simulé » dans l'UI.
- **F‑RAIL‑5** · P1 · _Export ISO 20022._ CA : `pain.001` par paiement, `camt.054` par événement de règlement, validés par schéma XSD.
- **F‑RAIL‑6** · P1 · _Un rail réel en sandbox._ CA : un adaptateur branché sur un sandbox (Airwallex ou équivalent) exécute `quote` et `initiate` ; étiqueté « sandbox ».
- **F‑RAIL‑7** · P2 · _Escrow on‑chain conditionnel._ CA : `TradeEscrow` ne libère les fonds que si le registre de confirmation (§4.10) indique intention confirmée, non révoquée, bénéficiaire attesté, credentials présents ; testnet uniquement.
- **F‑RAIL‑8** · P2 · _Travel Rule sur la jambe crypto._ CA : message IVMS101 généré et attaché à la jambe.

### 4.6 Garde (Système 1 + Système 2)

- **F‑GRD‑1** · P0 · _Chaque geste passe par la garde._ CA : création/modification/exécution de jambe, changement de paramètre, re‑routage ; aucun chemin de code ne contourne la garde (test : appel direct d'adaptateur sans décision → refus).
- **F‑GRD‑2** · P0 · _Règles déterministes en premier, non contournables._ CA : plafonds, sanctions (liste simulée), allowlist, provenance non fiable sur paramètre sensible → vérification obligatoire, nouveau compte → time‑lock, seuil → dual control ; évaluées en < 5 ms ; une interdiction ne peut être levée par aucun modèle.
- **F‑GRD‑3** · P0 · _Jev répond à une banque de questions fixes._ CA : **3 questions P0** (« geste ⊂ intention ? », « cohérent avec l'historique du couple ? », « facture type BEC ? ») + 2 P1 (« changement en transit anormal ? », « provenance fiable ? ») ; **une question par appel** (les réponses d'un même appel ne sont pas indépendantes — constat LawHack), appels lancés **en parallèle** ; réponse = probabilité calibrée (`noul` = P(oui)) ; p95 < 1 s pour les 3 questions ; Jev n'est sollicité qu'à **deux points** (signature de l'intention ; création/modification de la jambe de règlement), pas à chaque geste ; question et réponse journalisées ; cache des réponses clé = hash des champs normalisés.
- **F‑GRD‑4** · P0 · _Un classifieur comportemental indépendant._ CA : features d'historique (nouveauté bénéficiaire/compte, écart au montant habituel, cadence, heure, pays, délai facture→paiement, changement récent de coordonnées) ; GBM entraîné sur le jeu synthétique ; explications SHAP top‑3 ; < 10 ms.
- **F‑GRD‑5** · P0 · _Décision graduée._ CA : score de risque cumulé (règles + classifieur + Jev) → `pass` / `hold` / `block` ; désaccord classifieur/Jev → `hold` ; seuils configurables ; décision et contributions affichées.
- **F‑GRD‑6** · P0 · _Mistral explique les retenus._ CA : déclenché uniquement sur `hold` ; entrée = intention, facture, historique, décisions ; sortie = explication ≤ 120 mots en langue de l'utilisateur + recommandation ; aucune action possible depuis Mistral ; timeout 10 s → explication par défaut issue des règles/SHAP.
- **F‑GRD‑7** · P0 · _Le donneur d'ordre tranche, hors bande._ CA : notification app/SMS (pas e‑mail) avec explication ; actions confirmer / annuler / demander vérification ; expiration → annulation ; journalisé.
- **F‑GRD‑8** · P1 · _Budget d'alertes._ CA : taux de `hold` sur légitimes suivi ; si > budget (défaut 3 %), seuils ajustés et Ops alerté ; jamais d'ajustement qui lève une règle.
- **F‑GRD‑9** · P1 · _Mode dégradé._ CA : Jev ou Mistral indisponible → règles + classifieur + humain ; bandeau « mode dégradé » ; aucun geste n'est débloqué par défaut.
- **F‑GRD‑10** · P2 · _Honeytokens._ CA : faux bénéficiaires/comptes injectés dans le contexte ; leur apparition dans une intention ou une jambe → `block` + alerte « environnement compromis ».

### 4.7 Journal, conformité portable, KPI

- **F‑LOG‑1** · P0 · _Journal hash‑chaîné._ CA : chaque événement (qui, quoi, preuve, règle/question, score, explication) porte le hash du précédent ; vérification de chaîne exposée ; test d'altération → détection.
- **F‑LOG‑2** · P0 · _Timeline par paiement._ CA : intention → route → jambes → décisions → confirmations, en temps réel pour Claire, en lecture seule pour M. Chen (sans montants intermédiaires ni raisons de sécurité).
- **F‑LOG‑3** · P0 · _Tableau de bord KPI live._ CA : coût total %, délai, STP, fraudes bloquées, faux positifs, économies cumulées vs référence (SWIFT), mis à jour à chaque événement.
- **F‑LOG‑4** · P1 · _Contrôles portables._ CA : KYB, AML, Travel Rule, documents émis comme VC attachés à la route ; un adaptateur peut exiger un VC et le vérifier sans refaire le contrôle.
- **F‑LOG‑5** · P1 · _Export d'audit._ CA : rapport PDF/JSON par paiement avec chaîne de hashs ; exports ISO 20022.
- **F‑LOG‑6** · P2 · _Ancrage on‑chain._ CA : racine de la chaîne publiée périodiquement dans le registre de confirmation ; vérification depuis l'UI.

### 4.10 Registre de confirmation (Avalanche)

Rôle : source de confirmation **indépendante de la plateforme** — un rail, un PSP, le fournisseur ou un auditeur vérifient une intention, sa révocation ou l'attestation d'un bénéficiaire sans nous faire confiance. Écriture asynchrone, lecture au règlement, hashes uniquement.

Choix **Avalanche‑native** (décision après échange mentor) : la cible de la démo est une **L1 PIR dédiée** sur Avalanche (testnet, ≈ 1,33 AVAX de test), privée, gas en USDC de test ou token custom, déployée via le MCP Avalanche, explorer fourni par le mentor ; **Fuji C‑Chain est le repli** si la L1 n'est pas opérationnelle à H+20. Les contrats (`IntentRegistry`, `TradeEscrow`, eERC) sont chain‑agnostiques : même bytecode, seule la config RPC/chainId change.

- **F‑AVAX‑1** · P1 · _Chaque intention signée est publiée._ CA : à la signature, `intent_hash`, identifiants hachés payeur/bénéficiaire, montant plafond, devise, date limite écrits dans le contrat `IntentRegistry` (L1 PIR, repli Fuji) ; écriture asynchrone, la garde n'attend pas la finalité ; statut « publié / en attente » visible dans la timeline ; aucune donnée personnelle en clair.
- **F‑AVAX‑2** · P1 · _Un adaptateur confirme l'intention avant de régler._ CA : avant `initiate` de la jambe de règlement, l'adaptateur lit le registre : intention existante, non révoquée, non expirée, montant ≤ plafond ; sinon refus journalisé ; démo : le PSP CNY simulé fait cette lecture.
- **F‑AVAX‑3** · P1 · _La révocation est inscrite on‑chain._ CA : révocation (F‑INT‑6) ou kill switch → événement `Revoked` ; toute lecture ultérieure retourne « révoquée » ; latence de propagation < 5 s affichée.
- **F‑AVAX‑4** · P2 · _Attestation de bénéficiaire ancrée._ CA : le fournisseur (ou son PSP) signe « ce compte m'appartient » ; hash de l'attestation + identifiant haché du compte ancrés ; F‑REG‑2 accepte cette attestation comme méthode de vérification ; vérifiable par un tiers depuis l'écran de suivi.
- **F‑AVAX‑5** · P2 · _Ancrage du journal._ = F‑LOG‑6.
- **F‑AVAX‑6** · P1 · _Mode dégradé sans chaîne._ CA : RPC indisponible → confirmation par notre API, bandeau « confirmation on‑chain indisponible », écriture rejouée dès retour ; aucune jambe débloquée par défaut.
- **F‑AVAX‑7** · P1 · _Jambe stablecoin chiffrée (eERC, mode converter)._ CA : mock USDC + contrat eERC déployés sur la L1 ; l'adaptateur stablecoin encapsule (USDC → eUSDC), transfère, le bénéficiaire désencapsule ; soldes et montants invisibles sur l'explorer ; **l'adresse auditeur** du contrat eERC est celle du persona Auditeur et est enregistrée dans `IntentRegistry` ; l'écran Audit montre le montant déchiffré par l'auditeur, l'explorer montre qu'il est chiffré pour les autres ; si la génération de preuves zk n'est pas utilisable en 36 h, le flux est montré côté contrat et étiqueté « partiel ».
- **F‑AVAX‑8** · P1 · _L1 PIR dédiée._ CA : chaîne déployée (nom, chainId, token de gas, RPC sur sous‑domaine, nœud sur une VM), explorer accessible, `IntentRegistry`/`TradeEscrow`/eERC déployés dessus, `.env` pointant vers la L1 ; bascule vers Fuji par simple changement de config ; décision L1 vs repli prise à H+20 et consignée.
- **F‑AVAX‑9** · P1 · _Preuve visible en démo._ CA : depuis la timeline, lien explorer vers l'intention publiée, puis vers l'événement `Revoked` après l'attaque ; un tiers peut refaire la vérification sans notre UI.

### 4.8 Prérequis de plateforme (ajoutés par la revue de faisabilité)

- **F‑AUTH‑1** · P0 · _Comptes et rôles._ CA : Supabase Auth ; rôles `payer_admin` (Claire), `approver` (Marc), `ops`, `auditor`, `payee` (M. Chen, accès par lien signé) ; RLS par entreprise ; une démo = 2 entreprises préconfigurées.
- **F‑DATA‑1** · P0 · _Fixtures de démo._ CA : 2 entreprises (FR, NG en P1), 3 fournisseurs (CN connu avec 12 paiements historiques et compte vérifié ; CN nouveau ; US), 3 factures PDF (légitime connue, légitime nouveau fournisseur, BEC : domaine proche + nouvel IBAN autre pays), profils FR/CN, statistiques de rails initiales ; script `seed` idempotent.
- **F‑DEMO‑1** · P0 · _Horloge pilotable._ CA : l'heure « système » de la démo est réglable (ex. vendredi 19:00 Europe/Paris) et avance à la demande ; horaires des rails, time‑locks, ETA et planification s'y réfèrent ; affichée dans l'UI avec mention « horloge de démo ».
- **F‑DEMO‑2** · P0 · _Téléphone simulé._ CA : panneau « téléphone de Claire » (seconde fenêtre/colonne) qui reçoit les notifications hors bande et permet confirmer/annuler ; remplaçable par Twilio (P2) sans changer l'API de notification.
- **F‑KEY‑1** · P0 · _Clé de signature du donneur d'ordre._ CA : paire de clés générée côté navigateur (WebCrypto, ECDSA P‑256) et stockée localement, clé publique enregistrée ; signature vérifiée côté serveur ; passkey/WebAuthn en P1.

### 4.9 Évaluation

- **F‑EVAL‑1** · P0 · _Jeu de scénarios._ CA : ≥ 300 scénarios (cible 500) : légitimes variés, BEC, substitution en transit, montants anormaux, replay/doublon, rails défaillants ; générés à partir d'AMLworld et d'attaques type APort ; raccourcis de simulateur identifiés et neutralisés (ex. : la fraude n'est pas corrélée à un seul champ).
- **F‑EVAL‑2** · P0 · _Métriques publiées._ CA : détection, faux positifs, latence p95, coût, délai, STP, re‑routage ; un script reproduit les chiffres.
- **F‑EVAL‑3** · P1 · _Ablations._ CA : règles seules / + classifieur / + Jev / + Mistral ; tableau comparatif.

---

## 5. Exigences non fonctionnelles

| ID    | Exigence                | Critère                                                                                                                                                           |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NF‑1  | Latence de la garde     | règles + classifieur p95 < 50 ms sur chaque geste ; avec Jev (3 questions en parallèle, aux 2 points où il est appelé) p95 < 1 s ; Mistral hors chemin critique   |
| NF‑2  | Disponibilité dégradée  | Fonctionne sans Jev, sans Mistral, sans chaîne ; jamais l'inverse ; aucun déblocage par défaut                                                                    |
| NF‑3  | Idempotence & cohérence | Toute opération externe est idempotente ; états de jambe monotones ; reprise après crash sans double exécution                                                    |
| NF‑4  | Sécurité des clés       | Clés de signature des donneurs d'ordre jamais côté serveur (passkey/WebAuthn ou KMS) ; clés d'adaptateurs en coffre ; rotation documentée                         |
| NF‑5  | Non‑répudiation         | Intention, jambes refusées, décisions et confirmations signées ou hash‑chaînées ; horodatage fiable                                                               |
| NF‑6  | Confidentialité         | RGPD/PIPL : minimisation (VC à divulgation sélective), résidence des données par juridiction documentée, pas de documents bruts envoyés aux modèles sans masquage |
| NF‑7  | Observabilité           | Traces par paiement et par geste ; métriques de garde (taux pass/hold/block, latences) ; alertes Ops                                                              |
| NF‑8  | Testabilité             | Tests automatisés sur F‑RAIL‑2/3, F‑GRD‑1/2, F‑LOG‑1 ; jeu d'évaluation rejouable en CI                                                                           |
| NF‑9  | Internationalisation    | FR/EN/ZH ; devises, fuseaux, formats locaux ; ETA en heure locale de chaque partie                                                                                |
| NF‑10 | Accessibilité & UX      | Écran de retenue compréhensible en < 30 s par un non‑technicien ; actions à un geste ; DA minimaliste cohérente                                                   |
| NF‑11 | Honnêteté de la démo    | Tout rail simulé ou sandbox est étiqueté comme tel ; aucun chiffre affiché sans source ou sans mesure                                                             |

---

## 6. Règles métier et seuils (valeurs par défaut, configurables par entreprise)

| Règle                                                           | Défaut                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time‑lock nouveau compte                                        | < 5 k€ : 0 · 5–50 k€ : 4 h · > 50 k€ : 24 h                                                                                                        |
| Dual control                                                    | ≥ 20 k€, ou tout nouveau bénéficiaire ≥ 5 k€                                                                                                       |
| Provenance non fiable (`invoice_pdf_email`) sur compte sensible | vérification hors bande obligatoire avant signature                                                                                                |
| Vérification hors bande                                         | contact déjà enregistré uniquement ; validité 12 mois ; renouvelée à tout changement de compte                                                     |
| Seuils de décision                                              | `pass` < 0,3 · `hold` 0,3–0,8 · `block` > 0,8 ; désaccord classifieur/Jev > 0,4 → `hold`                                                           |
| Budget d'alertes                                                | 3 % des paiements légitimes sur 30 jours glissants                                                                                                 |
| Expiration d'une retenue                                        | 72 h → annulation                                                                                                                                  |
| `allow_crypto`                                                  | hérité du profil entreprise ; forcé à `false` si une juridiction l'interdit                                                                        |
| Cut‑offs                                                        | selon profil ; jambe fermée → planifiée à l'ouverture, amont exécutée immédiatement si cela ne crée pas de risque de change > `max_total_cost_bps` |
| Verrouillage FX                                                 | cotation gelée 15 min ; au‑delà, recotation et re‑validation si l'écart dépasse 20 bps                                                             |
| Révocation                                                      | possible jusqu'à la première jambe `settled` non rappelable                                                                                        |

---

## 7. Données et intégrations

### 7.1 Modèles principaux

- `PaymentIntent` — payeur, bénéficiaire (réf. registre), compte, montant/devise, échéance, `invoice_hash`, provenance par champ, contraintes, signature(s), `intent_hash`.
- `Payee` / `PayeeAccount` — identifiants légaux, statut KYB, comptes avec preuves, `first_seen`, VC.
- `Jurisdiction` — rails, horaires, plafonds, exigences, scores CLEAR.
- `Route` / `PaymentLeg` — jambes avec `intent_hash`, nonce, fenêtre, rail, direction, montants, identifiants ISO 20022, statut, credentials, `hop_chain`.
- `GuardDecision` — geste, règles déclenchées, score classifieur + SHAP, question/réponse Jev, score cumulé, décision, explication Mistral, action humaine.
- `LedgerEvent` — événement hash‑chaîné.
- `RailStats` — statistiques apprises par rail × heure × tranche.

### 7.2 Intégrations

| Intégration                                                                                                    | Démo                                                             | Statut                                                      |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Jev (Système 1)                                                                                                | API hébergée, banque de questions                                | réel (quota)                                                |
| Mistral (Système 2)                                                                                            | API, modèle européen                                             | réel                                                        |
| Extraction de facture                                                                                          | vision Claude ou Mistral                                         | réel                                                        |
| SEPA Inst, PSP CNY, on/off‑ramp                                                                                | adaptateurs **simulés**                                          | simulé, étiqueté                                            |
| Sandbox PSP (Airwallex ou équivalent)                                                                          | `quote` + `initiate`                                             | sandbox (P1)                                                |
| Registres (GLEIF, INPI, CAC, Tianyancha)                                                                       | fixtures + API quand gratuite                                    | mixte (P1)                                                  |
| Base de données                                                                                                | Supabase/Postgres (RLS)                                          | réel                                                        |
| L1 PIR dédiée (chaîne privée, gas USDC/test, RPC + explorer)                                                   | Avalanche L1 testnet, MCP Avalanche, Foundry, viem               | testnet (P1) ; repli Fuji C‑Chain                           |
| Registre de confirmation `IntentRegistry` (intentions, révocations, attestations, auditeur, racine du journal) | L1 PIR / Fuji, viem                                              | testnet (P1 intentions/révocation, P2 attestations/ancrage) |
| Jambe stablecoin chiffrée (mock USDC + eERC converter, clé auditeur)                                           | L1 PIR / Fuji                                                    | testnet (P1, « partiel » si preuves zk indisponibles)       |
| Escrow conditionnel `TradeEscrow`                                                                              | L1 PIR / Fuji                                                    | testnet (P2)                                                |
| Notifications hors bande                                                                                       | panneau « téléphone simulé » dans l'UI (F‑DEMO‑2) ; Twilio en P2 | simulé, étiqueté                                            |

---

## 8. UX et écrans

Direction artistique : minimaliste, propre, pixel‑perfect, micro‑animations ; reprise de l'identité de la base de code existante (polices, couleurs, clair/sombre). Langues FR/EN/ZH.

1. **Nouvelle demande** — dépôt de facture, champs extraits avec confiance et provenance, statut du bénéficiaire (connu / nouveau), contraintes, bouton « Signer ».
2. **Vérification hors bande** — méthode, contact enregistré, statut, time‑lock résultant.
3. **Chemin proposé** — comparaison de 3 chemins (coût %, ETA, risque, pourquoi), chemin retenu, horaires et ETA en heure locale.
4. **Timeline du paiement** — jambes, états, décisions de garde (pass/hold/block avec contributions), événements rail, ETA.
5. **Retenue** — en une vue : ce qui a été demandé, ce qui a dévié, l'explication Mistral, les preuves, trois actions (confirmer / annuler / vérifier).
6. **Tableau de bord KPI** — coût %, délai, STP, fraudes bloquées, faux positifs, économies ; onglet « ce que le routeur a appris ».
7. **Audit** — chaîne d'événements, vérification de hashs, lien de confirmation on‑chain (explorateur Avalanche), exports.
8. **Suivi bénéficiaire** (M. Chen) — statut et ETA, sans détails internes.
9. **Ops** — état des rails, incidents, kill switch, mode dégradé, budget d'alertes.

---

## 9. Évaluation et démo

- **Jeu d'évaluation** : voir F‑EVAL‑1/2/3 ; chiffres affichés dans le pitch uniquement s'ils sortent du script de mesure.
- **Script de démo (3 min)** : 0:00 problème en une phrase + 1 chiffre (BEC 3,05 Md$) · 0:20 nominal vendredi soir, chemin et ETA · 0:45 **preuve** : intention publiée sur la L1 PIR (explorer), montant de la jambe stablecoin chiffré (eERC) que seul l'auditeur déchiffre · 1:00 BEC en direct : retenue, explication, annulation, révocation visible sur l'explorer · 1:50 substitution en transit refusée par l'adaptateur (intention révoquée on‑chain) · 2:15 dashboard KPI + « ce que le routeur a appris » · 2:40 ajout du Nigeria en un fichier · 2:55 promesse.
- **Vidéo de secours** enregistrée à H+34.

---

## 10. Hors périmètre, risques, questions ouvertes

**Hors périmètre hackathon** : détention de fonds, licence, KYB réel, production sur mainnet, réconciliation comptable complète, litiges/chargebacks, paiements récurrents, multi‑entités.

**Risques**

| Risque                                                 | Mitigation                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| L1 dédiée : temps ops (nœud, RPC, DNS)                 | une personne dédiée dès H+14, repli Fuji décidé à H+20, contrats chain‑agnostiques |
| eERC : lib immature, preuves zk lentes ou côté serveur | flux montré côté contrat et étiqueté « partiel » ; question posée au mentor        |
| Avalanche sur le chemin critique                       | écriture asynchrone, lecture seulement au règlement, mode dégradé F‑AVAX‑6         |
| Données personnelles on‑chain                          | hashes et engagements uniquement, revue RGPD/PIPL des champs publiés               |
| Jev indisponible / quota                               | mode dégradé (NF‑2), cache des réponses sur le jeu de démo                         |
| Jeu synthétique trop facile                            | neutralisation des raccourcis, ablations, honnêteté sur les limites                |
| Trop de périmètre pour 36 h                            | priorités P0/P1/P2 et ordre de coupe de `projet.md` §8                             |
| Simulations prises pour du réel                        | étiquetage systématique (NF‑11)                                                    |
| Approval fatigue en démo                               | budget d'alertes et scénarios légitimes nombreux dans le jeu                       |

**Questions ouvertes**

1. ~~Base de code~~ → tranché : base de code B2B existante copiée dans `hackathon-Essec` (web Next.js, SOR CVXPY, escrow, Supabase), voir README.
2. Nom du produit.
3. ~~Notifications hors bande~~ → tranché : téléphone simulé visible (F‑DEMO‑2), Twilio en P2.
4. Sandbox PSP accessible en 36 h (Airwallex demande une validation) ?
5. ~~Clé de signature~~ → tranché : WebCrypto côté navigateur en P0, passkey en P1 (F‑KEY‑1).
6. ~~Taille de l'équipe~~ → tranché : 4 personnes, répartition §12.4.

---

## 11. Rétroaction — critique du PRD et corrections apportées

Relecture du PRD contre `projet.md` et contre l'objectif « vraie solution à une vraie douleur quantifiée ». Ce qui n'allait pas, et ce qui a été corrigé dans cette version :

1. **Le PRD surchargeait les P0.** Première passe : 31 exigences P0, intenables en 36 h. Corrigé : dual control, fallback, prédicteurs en ligne, ISO 20022, VC, budget d'alertes, mode dégradé passés en P1 ; fractionnement, escrow policy wrapper, Travel Rule, honeytokens, ancrage, partage inter‑entreprises en P2. Il reste **28 P0** (+ 5 prérequis P0 ajoutés par la revue de faisabilité §12 : auth, fixtures, horloge, téléphone simulé, clé — ce sont des fondations, pas du périmètre), ce qui est encore lourd : si le planning dérape, les premiers P0 à sacrifier sont F‑RTR‑3 (comparaison de 3 chemins → 2), F‑EVAL‑2 (métriques publiées → mesurées à la main), puis F‑GRD‑4 (classifieur → règles + Jev seulement, en le disant). Les P0 restants couvrent exactement les quatre flux de la démo et le jeu d'évaluation.
2. **« Avertir » n'est pas « empêcher ».** F‑REG‑2 disait d'abord que la signature était possible avec un avertissement si la provenance était non fiable. Incohérent avec le principe directeur et avec la leçon AP2 (protéger _avant_ signature). Corrigé : la signature est bloquée tant que la vérification hors bande n'est pas faite.
3. **La notification de retenue par e‑mail aurait recréé la faille BEC.** Corrigé : F‑GRD‑7 impose un canal hors bande (app/SMS), jamais l'e‑mail.
4. **Le mode dégradé pouvait être lu comme « on laisse passer ».** Corrigé : NF‑2 et F‑GRD‑9 précisent « aucun déblocage par défaut » ; dégradé = règles + classifieur + humain, plus strict, pas plus laxiste.
5. **Le budget d'alertes pouvait contredire les règles.** Un ajustement automatique des seuils pour tenir 3 % aurait pu, mal implémenté, affaiblir la sécurité. Corrigé : F‑GRD‑8 interdit tout ajustement qui lève une règle ; l'ajustement ne porte que sur la zone grise classifieur/Jev.
6. **Le risque de change n'était pas traité.** Le routeur « provisionne maintenant, paie lundi » crée une exposition FX sur 60 h. Ajouté en §6 : cotation gelée 15 min, recotation et re‑validation au‑delà de 20 bps ; l'amont n'est exécuté immédiatement que si l'exposition reste sous `max_total_cost_bps`. Qui porte le risque résiduel reste une question de modèle économique (à documenter en roadmap).
7. **Le bénéficiaire était oublié.** M. Chen n'avait ni parcours ni écran, alors que la vérification hors bande dépend de lui et qu'un paiement « bloqué » est sa peur principale. Ajouté : persona, écran de suivi (sans détails de sécurité), rôle dans la vérification.
8. **Les KPI mélangeaient démo et promesse.** Corrigé : §1.3 distingue cible hackathon (mesurée sur le jeu d'évaluation) et cible 6 mois (pilotes) ; NF‑11 interdit tout chiffre non mesuré dans le pitch.
9. **Le classifieur et Jev risquaient de juger la même chose.** Clarifié : le classifieur juge le _comportement_ (historique du couple), Jev la _sémantique_ (facture, intention, contexte) ; leur indépendance est ce qui rend le désaccord informatif.
10. **Avalanche était un bonus décoratif.** « Ancrer le journal » n'apportait rien que le hash‑chaînage ne fasse déjà pour un auditeur qui nous fait confiance. Corrigé : la chaîne sert à **confirmer** ce qui doit être vérifiable par des tiers qui ne nous font pas confiance — intentions, révocations, attestations de bénéficiaire (§4.10) — avec deux garde‑fous : hors chemin critique et sans données personnelles. Reste discutable : la lecture on‑chain par un PSP réel suppose qu'il accepte de l'intégrer ; en démo, seul l'adaptateur simulé le fait.
11. **Retour mentor (ex‑Avalanche) intégré.** (a) « Blockchain = tout le monde voit nos paiements » : la jambe stablecoin passe en **eERC** (montants chiffrés, clé auditeur = persona Auditeur) → confidentialité et AML dans le même geste (F‑AVAX‑7) ; (b) **L1 dédiée** plutôt que C‑Chain publique : forme concrète du « L1 permissionné pour PSP », quasi gratuite sur testnet, mais ops inédites → P1 avec repli Fuji décidé à H+20 (F‑AVAX‑8) ; (c) ce qu'il veut voir : la **preuve d'immutabilité** visible et une attaque bloquée → F‑AVAX‑9 et script de démo ; (d) **fiscalité** (conventions OCDE, retenues) absente → F‑JUR‑3 en information seulement ; (e) pas de standard d'attestation dans l'écosystème → attestation EIP‑712 ancrée conservée ; (f) Track 1 principal, Track 3 secondaire assumé (§1.2).
12. **Ce qui reste discutable** (assumé, pas corrigé) : (a) Jev reste un service hébergé externe sur le chemin critique — le cache de démo et le mode dégradé limitent le risque, mais une version auto‑hébergée du Système 1 serait préférable en production ; (b) les adaptateurs simulés rendent les KPI coût/délai illustratifs — seuls les KPI de sécurité (détournement, détection, faux positifs, latence) sont réellement mesurés sur le jeu ; (c) le registre de bénéficiaires a un cold start réel que les fixtures masquent ; (d) la valeur « layer++ » pour un PSP n'est pas démontrée en 36 h, seulement rendue crédible par l'interface `RailAdapter` et le mode ombre.

**Verdict** : le PRD est aligné avec `projet.md` (même principe directeur, mêmes huit composants, mêmes quatre flux, mêmes cibles), et il est honnête sur ce qui est simulé. Son point fort est que chaque exigence P0 a un critère d'acceptation testable et que les garanties annoncées au jury (§4.3 de `projet.md`) correspondent chacune à au moins une exigence : intention vérifiée dans chaque rail → F‑RAIL‑2 ; protection avant signature → F‑REG‑2 ; vérification transfrontalière → F‑REG‑2/4/5 ; routeur apprenant mais déterministe → F‑RTR‑1/4 ; deux juges + raisonneur + humain → F‑GRD‑3/4/5/6/7 ; conformité portable → F‑LOG‑4 ; journal infalsifiable → F‑LOG‑1/6.

---

## 12. Revue de faisabilité et kit de démarrage (v1.1)

Relecture complète avec trois questions : le PRD est‑il complet ? est‑il faisable en 36 h ? qu'est‑ce qu'il faut concrètement pour démarrer à H+0 ?

### 12.1 Complétude — trous trouvés et corrigés dans cette version

| Trou                                                                                                                                                                                                                                                                    | Correction                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aucune exigence sur les comptes, rôles et cloisonnement des données (6 personas, 0 exigence d'authentification)                                                                                                                                                         | **F‑AUTH‑1** (Supabase Auth, 5 rôles, RLS)                                                                                                           |
| Les parcours supposent « 12 paiements historiques », une facture BEC, des profils… sans exigence qui les produise                                                                                                                                                       | **F‑DATA‑1** (fixtures + `seed` idempotent)                                                                                                          |
| La démo se passe « vendredi 19 h » mais rien ne permet de régler l'heure ni d'avancer jusqu'à lundi 9 h                                                                                                                                                                 | **F‑DEMO‑1** (horloge pilotable) — sans elle, le flux nominal n'est pas démontrable                                                                  |
| La notification hors bande était « app/SMS » sans décision ni exigence                                                                                                                                                                                                  | **F‑DEMO‑2** (téléphone simulé visible), Twilio en P2                                                                                                |
| La clé de signature restait une question ouverte alors que F‑INT‑4 en dépend dès H+0                                                                                                                                                                                    | **F‑KEY‑1** tranché (WebCrypto P0, passkey P1)                                                                                                       |
| F‑GRD‑3 demandait « ≥ 5 questions » Jev « à chaque geste » en « < 300 ms » — incompatible avec ce qu'on sait de Jev (LawHack) : réponses d'un même appel non indépendantes → une question par appel ; ~400–500 ms par appel ; quota **60 req/min** partagé avec la démo | F‑GRD‑3 et NF‑1 réécrits : 3 questions P0 en parallèle, à 2 points seulement, p95 < 1 s, cache ; latence « < 50 ms » réservée à règles + classifieur |
| KPI « confirmations on‑chain 100 % » présenté comme hackathon alors que F‑AVAX est P1                                                                                                                                                                                   | KPI marqué (P1) et conditionné                                                                                                                       |
| Ordre des dépendances implicite : le classifieur (F‑GRD‑4) ne peut pas être entraîné avant le générateur de scénarios (F‑EVAL‑1) ; les adaptateurs ne peuvent pas vérifier `intent_hash` avant que le format canonique de l'intention soit figé                         | Chemin critique explicité en §12.3                                                                                                                   |

Ce qui est volontairement laissé hors PRD (roadmap) : API publique _layer++_ documentée (OpenAPI), facturation, multi‑entités, réconciliation comptable, rappel/litige complets, Travel Rule réelle, sandbox PSP réel si Airwallex ne valide pas le compte à temps.

### 12.2 Faisabilité — charge estimée des P0

Estimation en heures‑personne (h·p), hypothèse : base de code existante réutilisée (intake, quote/SOR, escrow, dashboard, i18n, Supabase déjà là) — c'est désormais le cas.

| Bloc                               | Exigences                               | h·p           | Réutilise l'existant                                                              |
| ---------------------------------- | --------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| Fondations                         | F‑AUTH‑1, F‑DATA‑1, F‑DEMO‑1/2, F‑KEY‑1 | 14            | Auth, schéma, seed existants                                                      |
| Intention                          | F‑INT‑1…4                               | 12            | intake vision + Zod existants                                                     |
| Registre                           | F‑REG‑1…3                               | 8             | table KYB existante                                                               |
| Juridictions                       | F‑JUR‑1/2                               | 6             | —                                                                                 |
| Routeur                            | F‑RTR‑1/2/3                             | 12            | SOR CVXPY existant (ajouter graphe, horaires)                                     |
| Adaptateurs                        | F‑RAIL‑1…4                              | 16            | sources/quote existants (ajouter `initiate/status/webhook`, vérif. `intent_hash`) |
| Garde                              | F‑GRD‑1…7                               | 24            | — (Jev SDK, Mistral, GBM)                                                         |
| Journal & KPI                      | F‑LOG‑1…3                               | 10            | dashboard/timeline existants                                                      |
| Évaluation                         | F‑EVAL‑1/2                              | 10            | —                                                                                 |
| UI (9 écrans, DA existante)        | transverse                              | 16            | layout, composants                                                                |
| Pitch, vidéo, intégration continue | transverse                              | 6             | —                                                                                 |
| **Total P0**                       |                                         | **≈ 134 h·p** |                                                                                   |

Lecture : à **4 personnes × ~30 h effectives** (≈ 120 h·p), les P0 passent _tout juste_ en appliquant la coupe annoncée (§11.1 : F‑RTR‑3 → 2 chemins, F‑EVAL‑2 à la main, F‑GRD‑4 en dernier recours) ; les P1 Avalanche (F‑AVAX‑1/2/3, ≈ 10 h·p : contrat `IntentRegistry` ~80 lignes + tests Foundry + lecture viem) sont atteignables si une personne les prend en parallèle dès H+14. À **3 personnes** (≈ 90 h·p), il faut couper d'emblée : F‑GRD‑4 (classifieur) remplacé par 2 règles comportementales déterministes (écart au montant habituel, nouveauté), F‑RTR‑3 à 2 chemins, F‑LOG‑3 réduit à 4 KPI, F‑REG‑3 time‑lock affiché mais non planifié, et Avalanche limité à F‑AVAX‑1 (publication) sans lecture par l'adaptateur. **Sans la base existante** (de zéro), ajouter ≈ 40 h·p : non faisable à moins de 5 personnes.

Dépendances externes et leur risque :

| Dépendance                                                   | Risque                                                                                                         | Parade                                                                                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clé Codiv/TypeSafe (Jev, `openjev-latest`), quota 60 req/min | **élevé** : partagé entre démo, dev et évaluation ; une évaluation à plein régime casse la démo (vécu LawHack) | cache des réponses ; évaluation lancée **séquentiellement, la nuit, ≤ 25 req/min** ; mode dégradé F‑GRD‑9 ; ne jamais lancer deux jobs Jev en même temps |
| Clé Mistral                                                  | moyen : 429 à concurrence ≥ 3, clés qui expirent                                                               | un appel à la fois, backoff, explication de repli (règles + SHAP)                                                                                        |
| Clé Anthropic ou Mistral vision (extraction de facture)      | faible                                                                                                         | 3 factures de démo pré‑extraites en fixtures si l'API tombe                                                                                              |
| L1 PIR (MCP Avalanche, nœud, RPC, explorer du mentor)        | **moyen** : ops inédites pour l'équipe                                                                         | personne D dès H+14, repli Fuji à H+20                                                                                                                   |
| eERC (AvaCloud) sur testnet                                  | moyen : maturité de la lib / preuves zk                                                                        | mode « partiel » étiqueté                                                                                                                                |
| Avalanche Fuji (RPC public + faucet) — repli                 | faible : faucet parfois lent                                                                                   | demander les AVAX de test à H+0 ; RPC de secours                                                                                                         |
| Airwallex sandbox                                            | **élevé** : validation de compte non garantie en 36 h                                                          | reste P1 ; adaptateur simulé étiqueté                                                                                                                    |
| Docker + Supabase local                                      | faible                                                                                                         | déjà éprouvé sur la base de code                                                                                                                         |

### 12.3 Chemin critique (ce qui doit être figé en premier)

1. **H+0 → H+2** : format canonique de `PaymentIntent` (champs, canonicalisation JSON, `intent_hash` = SHA‑256), `PaymentLeg`, `GuardDecision`, `LedgerEvent` — figés dans un paquet `core` partagé ; tout le monde dépend de ça.
2. **H+2 → H+6** : fixtures + horloge de démo + auth ; squelette des 3 adaptateurs avec `initiate` qui vérifie `intent_hash` (test rouge → vert).
3. **H+6 → H+10** : générateur de scénarios (F‑EVAL‑1) **avant** le classifieur ; banque de questions Jev et client (une question par appel) ; règles.
4. **H+10 → H+20** : routeur (graphe + horaires), garde assemblée, écrans Nouvelle demande / Chemin / Timeline / Retenue, Mistral.
5. **H+20 → H+26** : jeu d'évaluation complet, KPI, scène BEC et scène transit répétées ; en parallèle `IntentRegistry` sur Fuji.
6. **H+26 → H+34** : P1 (fallback, profils NG/US, ISO 20022, lecture on‑chain par l'adaptateur), polish UI, vidéo de secours à H+34.

### 12.4 Kit de démarrage — tout ce qu'il faut pour se mettre en marche

**Décision prise : la base de code B2B existante est copiée à la racine de `hackathon-Essec`** (monorepo pnpm/turbo + Supabase + SOR + contrats Foundry) ; on y ajoute `packages/core` (types + hash + signature), `apps/web/src/lib/guard`, `apps/web/src/lib/rails`, `apps/web/src/lib/jurisdictions`, `services/eval`. Repartir de zéro aurait coûté ≈ 40 h·p de plus.

**Outils (vérifiés sur la VM)** : Node 22 + pnpm 10, Python 3.10+ (venv pour le SOR : CVXPY, XGBoost, FastAPI), Docker (Supabase local), Foundry (`forge`, requis aussi par le hook pre‑commit) pour les contrats, Git. Commandes : `pnpm install`, `supabase start`, `(cd apps/contracts && forge install)`, `pnpm dev` (web :3000), `pnpm sor:dev` (:8000), `pnpm test:sor`, `pnpm test:contracts`. État au moment d'écrire : `typecheck` OK, 5 tests SOR OK, tests Foundry OK.

**Comptes et clés à obtenir avant H+0** (dans `apps/web/.env.local`, jamais commités) :

| Variable                                                                                                                                                                      | Usage                                        | Qui / où                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TYPESAFE_API_KEY`, `TYPESAFE_BASE_URL=https://api.codiv.ai`, `SYSTEM_ONE_MODEL=openjev-latest`                                                                               | Jev (Système 1)                              | clé Codiv existante (LawHack) — vérifier le quota                                                                                                                         |
| `MISTRAL_API_KEY`                                                                                                                                                             | Système 2 + extraction de facture (repli)    | console Mistral                                                                                                                                                           |
| `ANTHROPIC_API_KEY` (optionnel)                                                                                                                                               | extraction de facture (vision)               | déjà prévu dans `lib/intake`                                                                                                                                              |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`…                                                                                                                      | base, auth, storage                          | `supabase start` les affiche                                                                                                                                              |
| `CHAIN_RPC_URL`, `CHAIN_ID`, `EXPLORER_URL`, `DEPLOYER_PRIVATE_KEY` (compte de test uniquement), adresses `IntentRegistry`/`TradeEscrow`/`MockUSDC`/`eERC`, `AUDITOR_ADDRESS` | L1 PIR (repli Fuji) : registre, escrow, eERC | wallet neuf + faucet Fuji (≥ 2 AVAX test : 1,33 pour la L1) ; MCP Avalanche pour déployer la L1 ; lien explorer du mentor ; chaîne définie en config viem (`defineChain`) |
| `AIRWALLEX_*` (optionnel, P1)                                                                                                                                                 | sandbox PSP                                  | demande de compte dès maintenant                                                                                                                                          |

**Données à préparer** (F‑DATA‑1) : 3 factures PDF (dont la BEC avec domaine proche et IBAN d'un autre pays), logos/identités des 2 entreprises et 3 fournisseurs, 12 paiements historiques, profils FR/CN (horaires, plafonds, rails), grille de prix de référence (Wise, SWIFT) sourcée pour la comparaison affichée.

**Équipe (4 personnes, confirmé)** : (A) _core + garde_ — types, hash/signature, règles, Jev, Mistral, décision ; (B) _routeur + adaptateurs_ — graphe/horaires sur le SOR, 3 adaptateurs, vérification `intent_hash`/nonce, fallback ; (C) _front_ — 9 écrans sur la DA la base de code existante, horloge de démo, téléphone simulé, KPI ; (D) _données, évaluation, chaîne_ — fixtures, générateur de scénarios, classifieur, métriques, L1 PIR + `IntentRegistry` + eERC (repli Fuji), pitch et vidéo. À 3 : D est réparti entre A (évaluation) et B (chaîne), et la coupe §12.2 s'applique d'emblée.

**Conventions** : une branche par personne, merge dans `main` toutes les 3 h via PR courte ; tout ce qui est simulé porte un badge « simulé » dans l'UI et un préfixe `Mock` dans le code ; aucun chiffre dans le pitch sans ligne dans `services/eval` ou source dans `projet.md` ; démo répétée à H+20, H+28, H+34.

**Checklist H+0 (30 min)** : copie + `pnpm install` + `supabase start` OK sur 4 machines · clés dans `.env.local` · appel Jev de test (1 question) et appel Mistral de test OK · wallet Fuji financé (≥ 2 AVAX test) · liens MCP Avalanche + explorer mentor récupérés · VM pour le nœud L1 réservée · `packages/core` créé avec `intentHash()` et un test · tableau des P0 affiché avec propriétaires · horloge de démo sur « vendredi 19:00 Europe/Paris ».

### 12.5 Verdict

**Complet** après cette passe : chaque parcours a ses exigences, chaque exigence P0 un critère testable, chaque dépendance une parade. **Faisable** à 4 personnes avec la base existante et la coupe prévue ; **tendu** à 3 ; **non faisable** de zéro. Le point qui conditionne tout est le quota Jev : si la clé Codiv n'est pas confirmée avant H+0, la garde doit être conçue dès le départ pour tourner en mode dégradé (règles + classifieur + humain) et Jev branché ensuite — ce que le principe directeur impose de toute façon.
