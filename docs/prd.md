# PRD — Payment Integrity Router (nom de travail)

> Product Requirements Document, v1 — Secure Horizons, ESSEC, 10–11 octobre 2026, Track 1.
> Document de référence amont : [`docs/projet.md`](./projet.md) (problématique, douleur chiffrée, architecture, bibliographie). Ce PRD ne redit pas le *pourquoi* ; il fixe le *quoi* : ce que le produit doit faire, pour qui, avec quels critères d'acceptation et quelles priorités.
> Priorités : **P0** = cœur de la démo, jamais coupé · **P1** = complète la solution, coupé en dernier · **P2** = bonus / roadmap.

---

## 1. Vision et objectifs

### 1.1 Vision
Permettre à une entreprise de payer n'importe quelle autre entreprise, partout dans le monde, par le chemin le plus rapide et le moins cher, **avec la garantie qu'aucun paiement ne part vers un bénéficiaire ou un montant qu'elle n'a pas voulu** — et la preuve pour l'audit.

### 1.2 Ce que le produit est / n'est pas
- **Est** : une couche d'orchestration et d'intégrité au‑dessus de rails de paiement licenciés (banques, PSP, on/off‑ramps stablecoin, escrow on‑chain), utilisable par une PME (application) ou intégrée par une fintech/PSP (API, mode *layer++*).
- **N'est pas** : un établissement de paiement, un détenteur de fonds, un émetteur de stablecoin, un outil de détection de fraude bancaire générique, ni une messagerie d'agents IA.

### 1.3 Objectifs mesurables

| KPI produit | Définition | Cible hackathon (jeu d'évaluation) | Cible 6 mois (pilotes) |
|---|---|---|---|
| **Taux de détournement** | paiements exécutés vers un bénéficiaire/montant ≠ intention signée / total | **0** sur le jeu d'attaque | 0 confirmé sur volume réel |
| **Détection des attaques** | scénarios d'attaque retenus ou bloqués / scénarios d'attaque | > 95 % | > 98 % |
| **Faux positifs** | paiements légitimes retenus / paiements légitimes | < 3 % | < 2 %, budget d'alertes respecté |
| **Coût total** | frais + spread FX + frais de rail, en % du montant | < 1 % sur le corridor démo | < 1,5 % moyenne, aucun corridor > 3 % (cible G20) |
| **Délai de disponibilité** | signature → fonds disponibles chez le bénéficiaire | < 1 h rails ouverts ; provisionné 24/7 sinon | 75 % < 1 h |
| **Latence de la garde** | p95 par geste, sans Mistral | < 500 ms | < 300 ms |
| **STP** | paiements sans intervention humaine ni re‑routage | > 90 % des légitimes | > 95 % |
| **Extension** | ajout d'un pays | 1 fichier de profil, < 1 h | idem + sandbox réel < 1 semaine |

### 1.4 Objectif de la démo (3 min)
Une PME française paie 48 000 $ à un fournisseur chinois un vendredi 19 h ; le routeur choisit SEPA → USDC → PSP CNY, provisionne maintenant, règle lundi 9 h ; une facture BEC avec nouvel IBAN est retenue en < 500 ms, expliquée par Mistral, refusée par le donneur d'ordre ; une substitution en transit est refusée par l'adaptateur ; le tableau de bord affiche coût 0,9 %, délai 18 h, 2 fraudes bloquées, 0 faux positif ; on ajoute le Nigeria en un fichier.

---

## 2. Utilisateurs et personas

| Persona | Rôle | Besoin principal | Peur principale |
|---|---|---|---|
| **Claire, DAF d'une PME** (donneur d'ordre) | Crée et signe les demandes de paiement, confirme ou annule les retenus | Payer vite, moins cher, sans se faire piéger | Virer 48 k$ à un fraudeur et devoir l'expliquer au CEO |
| **Marc, CEO / 2ᵉ approbateur** | Co‑signe au‑dessus d'un seuil | Garder le contrôle sans tout relire | Être dérangé pour rien (approval fatigue) |
| **M. Chen, fournisseur** (bénéficiaire) | Fournit ses coordonnées, répond à la vérification hors bande, suit l'arrivée des fonds | Être payé à l'heure, savoir quand | Perdre une commande à cause d'un paiement bloqué |
| **Aïcha, intégratrice chez un PSP** (*layer++*) | Branche la couche devant ses rails via API | Conformité VoP/Travel Rule, réduction des pertes BEC, nouveaux corridors | Casser ses flux existants |
| **Auditeur / assureur** | Consulte la preuve a posteriori | Rejouer une décision, prouver qu'elle n'a pas été modifiée | Un journal réécrit par l'opérateur |
| **Ops de la plateforme** (nous) | Supervise rails, incidents, modèles | Voir ce qui dérive, couper un rail | Un adaptateur compromis qui exécute en silence |

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
3. La garde détecte la dérive → **kill switch** sur la route → fallback vers un autre rail → alerte Ops + Claire.
4. Preuve dans le journal (jambe refusée, raison, horodatage).

### 3.5 Rail défaillant (P1)
1. Le PSP CNY retourne les fonds (`returned`).
2. Re‑routage automatique dans les bornes de l'intention (coût max, date limite) ; si impossible, retenue et proposition à Claire.
3. ETA mis à jour pour Claire et M. Chen.

### 3.6 Consultation d'audit (P1)
L'auditeur ouvre un paiement, voit la chaîne complète (intention → route → gestes → décisions → preuves), vérifie la chaîne de hashs (et la racine ancrée on‑chain en P2), exporte un rapport et les fichiers ISO 20022.

### 3.7 Intégration *layer++* (P2)
Aïcha branche la garde en **mode ombre** devant ses flux existants (observe et score, ne bloque rien), puis active progressivement vérification hors bande, hold, enforcement.

---

## 4. Exigences fonctionnelles

Format : **ID** · priorité · *user story* · critères d'acceptation (CA).

### 4.1 Intake & intention

- **F‑INT‑1** · P0 · *En tant que donneur d'ordre, je dépose une facture et obtiens un formulaire pré‑rempli.* CA : PDF/PNG/JPG ≤ 10 Mo ; champs extraits (bénéficiaire, compte, montant, devise, échéance, référence) avec score de confiance ; champ < 0,8 surligné ; extraction ≤ 10 s.
- **F‑INT‑2** · P0 · *Chaque champ porte sa provenance.* CA : valeurs ∈ {`invoice_pdf_email`, `invoice_pdf_portal`, `verified_registry`, `user_input`, `psp_attestation`, `history`} ; affichée au survol ; immuable après signature.
- **F‑INT‑3** · P0 · *Je fixe mes contraintes.* CA : `max_total_cost_bps`, `latest_settlement`, `allow_crypto` ; valeurs par défaut issues du profil entreprise ; stockées dans l'intention.
- **F‑INT‑4** · P0 · *Je signe l'intention.* CA : signature de la clé du donneur d'ordre (WebAuthn/passkey ou clé gérée) sur le hash canonique de l'intention ; `intent_hash` affiché ; toute modification après signature crée une **nouvelle** intention.
- **F‑INT‑5** · P1 · *Au‑dessus d'un seuil, deux signatures.* CA : seuil configurable par entreprise (défaut 20 k€) ; 2ᵉ approbateur notifié hors bande ; aucune jambe créée avant la 2ᵉ signature.
- **F‑INT‑6** · P1 · *Je peux révoquer une intention.* CA : révocation → toutes les jambes non exécutées annulées, jambes en cours rappelées si le rail le permet ; événement journalisé.

### 4.2 Registre de bénéficiaires vérifiés

- **F‑REG‑1** · P0 · *Le système sait si un bénéficiaire/compte est connu.* CA : `first_seen`, nombre de paiements réussis, statut KYB, preuves du compte ; affiché avant signature.
- **F‑REG‑2** · P0 · *Tout nouveau compte passe par une vérification hors bande.* CA : canal ≠ canal de la facture, utilisant un contact déjà enregistré ; options micro‑dépôt / attestation PSP ; statut `verified` avec date, méthode, opérateur ; sans vérification, la signature est **bloquée** (pas seulement avertie) si la provenance est non fiable.
- **F‑REG‑3** · P0 · *Un time‑lock s'applique au premier paiement vers un nouveau compte.* CA : barème par montant (ex. < 5 k€ : 0 ; 5–50 k€ : 4 h ; > 50 k€ : 24 h), configurable ; affiché dans l'ETA ; outrepassable uniquement par dual control.
- **F‑REG‑4** · P1 · *Amorçage par sources existantes.* CA : import LEI/GLEIF, registres (INPI, CAC, Tianyancha) en fixtures/API ; VoP/CoP consultés quand disponibles.
- **F‑REG‑5** · P1 · *Les attestations sont des Verifiable Credentials.* CA : format W3C VC, émetteur, validité, divulgation sélective (« compte vérifié » sans exposer les documents).
- **F‑REG‑6** · P2 · *Un fournisseur vérifié l'est pour tous les payeurs.* CA : partage inter‑entreprises des VC avec consentement du fournisseur.

### 4.3 Profils de juridiction

- **F‑JUR‑1** · P0 · *La localisation des deux parties est détectée et charge les profils.* CA : pays/devise/entité déduits du registre et de l'IBAN/compte ; profils FR et CN complets ; profil = un fichier déclaratif.
- **F‑JUR‑2** · P0 · *Un profil décrit rails, horaires, plafonds, exigences.* CA : rails disponibles, heures d'ouverture/cut‑offs/fuseaux/week‑ends, plafonds par transaction et par jour, documents requis au‑dessus d'un seuil, exigences (VoP, Travel Rule, SAFE, Open Banking NG), score CLEAR par rail.
- **F‑JUR‑3** · P1 · *Ajouter un pays = ajouter un profil.* CA : profils NG et US ajoutés pendant la démo ; aucun changement de code.
- **F‑JUR‑4** · P1 · *Les chemins illégaux n'existent pas.* CA : un rail non autorisé pour la paire (pays, devise, montant) n'apparaît pas dans le graphe ; `allow_crypto = false` exclut toute jambe crypto.

### 4.4 Routeur

- **F‑RTR‑1** · P0 · *Le routeur propose le meilleur chemin avec justification.* CA : optimiseur convexe sous contraintes (coût max, date limite, horaires, plafonds, risque) ; sortie = liste ordonnée de jambes + coût total % + ETA + justification lisible ; ≤ 2 s.
- **F‑RTR‑2** · P0 · *Le routeur tient compte des horaires.* CA : une jambe fermée est planifiée à la prochaine ouverture ; la jambe amont (collecte/escrow/stablecoin) peut s'exécuter immédiatement ; ETA = heure locale du bénéficiaire.
- **F‑RTR‑3** · P0 · *Le routeur compare au moins 3 chemins.* CA : fiat direct (SWIFT/pain.001), stablecoin (on‑ramp → off‑ramp), PSP local ; la comparaison est affichée.
- **F‑RTR‑4** · P1 · *Les prédicteurs apprennent des paiements exécutés.* CA : par rail × heure × tranche de montant : p(succès), délai, coût effectif, p(contrôle manuel) ; mise à jour en ligne (bandit non stationnaire) après chaque résultat réel ; écran « ce que le routeur a appris » (évolution des scores).
- **F‑RTR‑5** · P1 · *Fallback automatique.* CA : jambe `failed`/`returned` → re‑route dans les bornes de l'intention sans action humaine ; sinon retenue.
- **F‑RTR‑6** · P2 · *Fractionnement multi‑chemins.* CA : un paiement peut être divisé sur ≥ 2 chemins si cela réduit coût ou risque ; chaque fraction porte le même `intent_hash` ; somme des fractions = montant de l'intention, vérifiée.

### 4.5 Adaptateurs de rails

- **F‑RAIL‑1** · P0 · *Interface commune.* CA : `quote`, `initiate`, `status`, `onWebhook`, `reconcile` (+ `recall` optionnel) ; modèle `PaymentLeg` canonique (ISO 20022 : `end_to_end_id`, débiteur, créancier, montant, devise, `remittance_info`) ; états `initiated → pending → settled | failed | returned`.
- **F‑RAIL‑2** · P0 · *Aucune jambe exécutée si elle ne correspond pas à l'intention.* CA : avant `initiate`, l'adaptateur vérifie `intent_hash` (montant, devise, bénéficiaire ⊂ intention), fenêtre `valid_from/valid_until`, nonce non consommé, intention non révoquée ; refus journalisé avec raison ; test automatisé pour chaque adaptateur.
- **F‑RAIL‑3** · P0 · *Idempotence.* CA : même `idempotency_key` → même résultat, aucune double exécution ; testé par re‑soumission.
- **F‑RAIL‑4** · P0 · *Trois adaptateurs simulés réalistes.* CA : SEPA Inst (délai 10 s, horaires 24/7), stablecoin on/off‑ramp (slippage simulé, 24/7), PSP CNY (horaires lun–ven 9–17 CST, retour aléatoire paramétrable) ; webhooks normalisés ; clairement étiquetés « simulé » dans l'UI.
- **F‑RAIL‑5** · P1 · *Export ISO 20022.* CA : `pain.001` par paiement, `camt.054` par événement de règlement, validés par schéma XSD.
- **F‑RAIL‑6** · P1 · *Un rail réel en sandbox.* CA : un adaptateur branché sur un sandbox (Airwallex ou équivalent) exécute `quote` et `initiate` ; étiqueté « sandbox ».
- **F‑RAIL‑7** · P2 · *Escrow on‑chain avec policy wrapper.* CA : contrat vérifiant montant ≤ intention, bénéficiaire ∈ intention, credentials présents, intention non révoquée ; testnet uniquement.
- **F‑RAIL‑8** · P2 · *Travel Rule sur la jambe crypto.* CA : message IVMS101 généré et attaché à la jambe.

### 4.6 Garde (Système 1 + Système 2)

- **F‑GRD‑1** · P0 · *Chaque geste passe par la garde.* CA : création/modification/exécution de jambe, changement de paramètre, re‑routage ; aucun chemin de code ne contourne la garde (test : appel direct d'adaptateur sans décision → refus).
- **F‑GRD‑2** · P0 · *Règles déterministes en premier, non contournables.* CA : plafonds, sanctions (liste simulée), allowlist, provenance non fiable sur paramètre sensible → vérification obligatoire, nouveau compte → time‑lock, seuil → dual control ; évaluées en < 5 ms ; une interdiction ne peut être levée par aucun modèle.
- **F‑GRD‑3** · P0 · *Jev répond à une banque de questions fixes.* CA : ≥ 5 questions structurées (« geste ⊂ intention ? », « changement en transit anormal ? », « facture type BEC ? », « provenance fiable ? », « cohérent avec l'historique du couple ? ») ; réponse = probabilité calibrée ; p95 < 300 ms ; la question et la réponse sont journalisées.
- **F‑GRD‑4** · P0 · *Un classifieur comportemental indépendant.* CA : features d'historique (nouveauté bénéficiaire/compte, écart au montant habituel, cadence, heure, pays, délai facture→paiement, changement récent de coordonnées) ; GBM entraîné sur le jeu synthétique ; explications SHAP top‑3 ; < 10 ms.
- **F‑GRD‑5** · P0 · *Décision graduée.* CA : score de risque cumulé (règles + classifieur + Jev) → `pass` / `hold` / `block` ; désaccord classifieur/Jev → `hold` ; seuils configurables ; décision et contributions affichées.
- **F‑GRD‑6** · P0 · *Mistral explique les retenus.* CA : déclenché uniquement sur `hold` ; entrée = intention, facture, historique, décisions ; sortie = explication ≤ 120 mots en langue de l'utilisateur + recommandation ; aucune action possible depuis Mistral ; timeout 10 s → explication par défaut issue des règles/SHAP.
- **F‑GRD‑7** · P0 · *Le donneur d'ordre tranche, hors bande.* CA : notification app/SMS (pas e‑mail) avec explication ; actions confirmer / annuler / demander vérification ; expiration → annulation ; journalisé.
- **F‑GRD‑8** · P1 · *Budget d'alertes.* CA : taux de `hold` sur légitimes suivi ; si > budget (défaut 3 %), seuils ajustés et Ops alerté ; jamais d'ajustement qui lève une règle.
- **F‑GRD‑9** · P1 · *Mode dégradé.* CA : Jev ou Mistral indisponible → règles + classifieur + humain ; bandeau « mode dégradé » ; aucun geste n'est débloqué par défaut.
- **F‑GRD‑10** · P2 · *Honeytokens.* CA : faux bénéficiaires/comptes injectés dans le contexte ; leur apparition dans une intention ou une jambe → `block` + alerte « environnement compromis ».

### 4.7 Journal, conformité portable, KPI

- **F‑LOG‑1** · P0 · *Journal hash‑chaîné.* CA : chaque événement (qui, quoi, preuve, règle/question, score, explication) porte le hash du précédent ; vérification de chaîne exposée ; test d'altération → détection.
- **F‑LOG‑2** · P0 · *Timeline par paiement.* CA : intention → route → jambes → décisions → confirmations, en temps réel pour Claire, en lecture seule pour M. Chen (sans montants intermédiaires ni raisons de sécurité).
- **F‑LOG‑3** · P0 · *Tableau de bord KPI live.* CA : coût total %, délai, STP, fraudes bloquées, faux positifs, économies cumulées vs référence (SWIFT), mis à jour à chaque événement.
- **F‑LOG‑4** · P1 · *Contrôles portables.* CA : KYB, AML, Travel Rule, documents émis comme VC attachés à la route ; un adaptateur peut exiger un VC et le vérifier sans refaire le contrôle.
- **F‑LOG‑5** · P1 · *Export d'audit.* CA : rapport PDF/JSON par paiement avec chaîne de hashs ; exports ISO 20022.
- **F‑LOG‑6** · P2 · *Ancrage on‑chain.* CA : racine de la chaîne publiée périodiquement (Avalanche Fuji) ; vérification depuis l'UI.

### 4.8 Évaluation

- **F‑EVAL‑1** · P0 · *Jeu de scénarios.* CA : ≥ 300 scénarios (cible 500) : légitimes variés, BEC, substitution en transit, montants anormaux, replay/doublon, rails défaillants ; générés à partir d'AMLworld et d'attaques type APort ; raccourcis de simulateur identifiés et neutralisés (ex. : la fraude n'est pas corrélée à un seul champ).
- **F‑EVAL‑2** · P0 · *Métriques publiées.* CA : détection, faux positifs, latence p95, coût, délai, STP, re‑routage ; un script reproduit les chiffres.
- **F‑EVAL‑3** · P1 · *Ablations.* CA : règles seules / + classifieur / + Jev / + Mistral ; tableau comparatif.

---

## 5. Exigences non fonctionnelles

| ID | Exigence | Critère |
|---|---|---|
| NF‑1 | Latence de la garde | p95 < 500 ms par geste hors Mistral ; Mistral hors chemin critique |
| NF‑2 | Disponibilité dégradée | Fonctionne sans Jev, sans Mistral, sans chaîne ; jamais l'inverse ; aucun déblocage par défaut |
| NF‑3 | Idempotence & cohérence | Toute opération externe est idempotente ; états de jambe monotones ; reprise après crash sans double exécution |
| NF‑4 | Sécurité des clés | Clés de signature des donneurs d'ordre jamais côté serveur (passkey/WebAuthn ou KMS) ; clés d'adaptateurs en coffre ; rotation documentée |
| NF‑5 | Non‑répudiation | Intention, jambes refusées, décisions et confirmations signées ou hash‑chaînées ; horodatage fiable |
| NF‑6 | Confidentialité | RGPD/PIPL : minimisation (VC à divulgation sélective), résidence des données par juridiction documentée, pas de documents bruts envoyés aux modèles sans masquage |
| NF‑7 | Observabilité | Traces par paiement et par geste ; métriques de garde (taux pass/hold/block, latences) ; alertes Ops |
| NF‑8 | Testabilité | Tests automatisés sur F‑RAIL‑2/3, F‑GRD‑1/2, F‑LOG‑1 ; jeu d'évaluation rejouable en CI |
| NF‑9 | Internationalisation | FR/EN/ZH ; devises, fuseaux, formats locaux ; ETA en heure locale de chaque partie |
| NF‑10 | Accessibilité & UX | Écran de retenue compréhensible en < 30 s par un non‑technicien ; actions à un geste ; DA minimaliste cohérente |
| NF‑11 | Honnêteté de la démo | Tout rail simulé ou sandbox est étiqueté comme tel ; aucun chiffre affiché sans source ou sans mesure |

---

## 6. Règles métier et seuils (valeurs par défaut, configurables par entreprise)

| Règle | Défaut |
|---|---|
| Time‑lock nouveau compte | < 5 k€ : 0 · 5–50 k€ : 4 h · > 50 k€ : 24 h |
| Dual control | ≥ 20 k€, ou tout nouveau bénéficiaire ≥ 5 k€ |
| Provenance non fiable (`invoice_pdf_email`) sur compte sensible | vérification hors bande obligatoire avant signature |
| Vérification hors bande | contact déjà enregistré uniquement ; validité 12 mois ; renouvelée à tout changement de compte |
| Seuils de décision | `pass` < 0,3 · `hold` 0,3–0,8 · `block` > 0,8 ; désaccord classifieur/Jev > 0,4 → `hold` |
| Budget d'alertes | 3 % des paiements légitimes sur 30 jours glissants |
| Expiration d'une retenue | 72 h → annulation |
| `allow_crypto` | hérité du profil entreprise ; forcé à `false` si une juridiction l'interdit |
| Cut‑offs | selon profil ; jambe fermée → planifiée à l'ouverture, amont exécutée immédiatement si cela ne crée pas de risque de change > `max_total_cost_bps` |
| Verrouillage FX | cotation gelée 15 min ; au‑delà, recotation et re‑validation si l'écart dépasse 20 bps |
| Révocation | possible jusqu'à la première jambe `settled` non rappelable |

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

| Intégration | Démo | Statut |
|---|---|---|
| Jev (Système 1) | API hébergée, banque de questions | réel (quota) |
| Mistral (Système 2) | API, modèle européen | réel |
| Extraction de facture | vision Claude ou Mistral | réel |
| SEPA Inst, PSP CNY, on/off‑ramp | adaptateurs **simulés** | simulé, étiqueté |
| Sandbox PSP (Airwallex ou équivalent) | `quote` + `initiate` | sandbox (P1) |
| Registres (GLEIF, INPI, CAC, Tianyancha) | fixtures + API quand gratuite | mixte (P1) |
| Base de données | Supabase/Postgres (RLS) | réel |
| Escrow / ancrage | Avalanche Fuji | testnet (P2) |
| Notifications hors bande | push app + SMS (ou simulation visible) | simulé si pas de fournisseur |

---

## 8. UX et écrans

Direction artistique : minimaliste, propre, pixel‑perfect, micro‑animations ; reprise de l'identité Silkpay (polices, couleurs, clair/sombre). Langues FR/EN/ZH.

1. **Nouvelle demande** — dépôt de facture, champs extraits avec confiance et provenance, statut du bénéficiaire (connu / nouveau), contraintes, bouton « Signer ».
2. **Vérification hors bande** — méthode, contact enregistré, statut, time‑lock résultant.
3. **Chemin proposé** — comparaison de 3 chemins (coût %, ETA, risque, pourquoi), chemin retenu, horaires et ETA en heure locale.
4. **Timeline du paiement** — jambes, états, décisions de garde (pass/hold/block avec contributions), événements rail, ETA.
5. **Retenue** — en une vue : ce qui a été demandé, ce qui a dévié, l'explication Mistral, les preuves, trois actions (confirmer / annuler / vérifier).
6. **Tableau de bord KPI** — coût %, délai, STP, fraudes bloquées, faux positifs, économies ; onglet « ce que le routeur a appris ».
7. **Audit** — chaîne d'événements, vérification de hashs, exports.
8. **Suivi bénéficiaire** (M. Chen) — statut et ETA, sans détails internes.
9. **Ops** — état des rails, incidents, kill switch, mode dégradé, budget d'alertes.

---

## 9. Évaluation et démo

- **Jeu d'évaluation** : voir F‑EVAL‑1/2/3 ; chiffres affichés dans le pitch uniquement s'ils sortent du script de mesure.
- **Script de démo (3 min)** : 0:00 problème en une phrase + 1 chiffre (BEC 3,05 Md$) · 0:20 nominal vendredi soir, chemin et ETA · 1:00 BEC en direct : retenue, explication, annulation · 1:50 substitution en transit refusée par l'adaptateur · 2:15 dashboard KPI + « ce que le routeur a appris » · 2:40 ajout du Nigeria en un fichier · 2:55 promesse.
- **Vidéo de secours** enregistrée à H+34.

---

## 10. Hors périmètre, risques, questions ouvertes

**Hors périmètre hackathon** : détention de fonds, licence, KYB réel, production sur mainnet, réconciliation comptable complète, litiges/chargebacks, paiements récurrents, multi‑entités.

**Risques**

| Risque | Mitigation |
|---|---|
| Jev indisponible / quota | mode dégradé (NF‑2), cache des réponses sur le jeu de démo |
| Jeu synthétique trop facile | neutralisation des raccourcis, ablations, honnêteté sur les limites |
| Trop de périmètre pour 36 h | priorités P0/P1/P2 et ordre de coupe de `projet.md` §8 |
| Simulations prises pour du réel | étiquetage systématique (NF‑11) |
| Approval fatigue en démo | budget d'alertes et scénarios légitimes nombreux dans le jeu |

**Questions ouvertes**
1. Base de code : repartir de Silkpay (intake, SOR, escrow, dashboard ≈ 60 % du routeur) ou de zéro dans `hackathon-Essec` ?
2. Nom du produit.
3. Fournisseur de notifications hors bande pour la démo (vrai SMS ou simulation visible) ?
4. Sandbox PSP accessible en 36 h (Airwallex demande une validation) ?
5. Clé de signature du donneur d'ordre : passkey navigateur (réaliste) ou clé gérée (plus simple) pour la démo ?

---

## 11. Rétroaction — critique du PRD et corrections apportées

Relecture du PRD contre `projet.md` et contre l'objectif « vraie solution à une vraie douleur quantifiée ». Ce qui n'allait pas, et ce qui a été corrigé dans cette version :

1. **Le PRD surchargeait les P0.** Première passe : 31 exigences P0, intenables en 36 h. Corrigé : dual control, fallback, prédicteurs en ligne, ISO 20022, VC, budget d'alertes, mode dégradé passés en P1 ; fractionnement, escrow policy wrapper, Travel Rule, honeytokens, ancrage, partage inter‑entreprises en P2. Il reste **28 P0**, ce qui est encore lourd : si le planning dérape, les premiers P0 à sacrifier sont F‑RTR‑3 (comparaison de 3 chemins → 2), F‑EVAL‑2 (métriques publiées → mesurées à la main), puis F‑GRD‑4 (classifieur → règles + Jev seulement, en le disant). Les P0 restants couvrent exactement les quatre flux de la démo et le jeu d'évaluation.
2. **« Avertir » n'est pas « empêcher ».** F‑REG‑2 disait d'abord que la signature était possible avec un avertissement si la provenance était non fiable. Incohérent avec le principe directeur et avec la leçon AP2 (protéger *avant* signature). Corrigé : la signature est bloquée tant que la vérification hors bande n'est pas faite.
3. **La notification de retenue par e‑mail aurait recréé la faille BEC.** Corrigé : F‑GRD‑7 impose un canal hors bande (app/SMS), jamais l'e‑mail.
4. **Le mode dégradé pouvait être lu comme « on laisse passer ».** Corrigé : NF‑2 et F‑GRD‑9 précisent « aucun déblocage par défaut » ; dégradé = règles + classifieur + humain, plus strict, pas plus laxiste.
5. **Le budget d'alertes pouvait contredire les règles.** Un ajustement automatique des seuils pour tenir 3 % aurait pu, mal implémenté, affaiblir la sécurité. Corrigé : F‑GRD‑8 interdit tout ajustement qui lève une règle ; l'ajustement ne porte que sur la zone grise classifieur/Jev.
6. **Le risque de change n'était pas traité.** Le routeur « provisionne maintenant, paie lundi » crée une exposition FX sur 60 h. Ajouté en §6 : cotation gelée 15 min, recotation et re‑validation au‑delà de 20 bps ; l'amont n'est exécuté immédiatement que si l'exposition reste sous `max_total_cost_bps`. Qui porte le risque résiduel reste une question de modèle économique (à documenter en roadmap).
7. **Le bénéficiaire était oublié.** M. Chen n'avait ni parcours ni écran, alors que la vérification hors bande dépend de lui et qu'un paiement « bloqué » est sa peur principale. Ajouté : persona, écran de suivi (sans détails de sécurité), rôle dans la vérification.
8. **Les KPI mélangeaient démo et promesse.** Corrigé : §1.3 distingue cible hackathon (mesurée sur le jeu d'évaluation) et cible 6 mois (pilotes) ; NF‑11 interdit tout chiffre non mesuré dans le pitch.
9. **Le classifieur et Jev risquaient de juger la même chose.** Clarifié : le classifieur juge le *comportement* (historique du couple), Jev la *sémantique* (facture, intention, contexte) ; leur indépendance est ce qui rend le désaccord informatif.
10. **Ce qui reste discutable** (assumé, pas corrigé) : (a) Jev reste un service hébergé externe sur le chemin critique — le cache de démo et le mode dégradé limitent le risque, mais une version auto‑hébergée du Système 1 serait préférable en production ; (b) les adaptateurs simulés rendent les KPI coût/délai illustratifs — seuls les KPI de sécurité (détournement, détection, faux positifs, latence) sont réellement mesurés sur le jeu ; (c) le registre de bénéficiaires a un cold start réel que les fixtures masquent ; (d) la valeur « layer++ » pour un PSP n'est pas démontrée en 36 h, seulement rendue crédible par l'interface `RailAdapter` et le mode ombre.

**Verdict** : le PRD est aligné avec `projet.md` (même principe directeur, mêmes sept composants, mêmes quatre flux, mêmes cibles), et il est honnête sur ce qui est simulé. Son point fort est que chaque exigence P0 a un critère d'acceptation testable et que les garanties annoncées au jury (§4.3 de `projet.md`) correspondent chacune à au moins une exigence : intention vérifiée dans chaque rail → F‑RAIL‑2 ; protection avant signature → F‑REG‑2 ; vérification transfrontalière → F‑REG‑2/4/5 ; routeur apprenant mais déterministe → F‑RTR‑1/4 ; deux juges + raisonneur + humain → F‑GRD‑3/4/5/6/7 ; conformité portable → F‑LOG‑4 ; journal infalsifiable → F‑LOG‑1/6.
