# Comparaison des trois PRD et arbitrages de fusion

> 10 octobre 2026 · Secure Horizons, Track 1 · Résultat de la fusion : [`docs/prd-final.md`](./prd-final.md)
> Les deux PRD reçus sont versionnés tels quels dans [`docs/prd-sources/`](./prd-sources/).

| Code  | PRD                                                                            | Auteur      | Taille                | En une ligne                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------ | ----------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | _Risk-Aware Payment Router_ ([source](./prd-sources/prd-risk-aware-router.md)) | non indiqué | ≈ 2 600 mots, anglais | Routeur africain + 3 agents IA d'investigation ; idée forte : **séparer le risque de fraude du risque de route**                             |
| **B** | _L'aiguilleur_ ([source](./prd-sources/prd-aiguilleur-oscar.md))               | Oscar Hu    | ≈ 7 000 mots          | Routeur Lagos – Accra – Abidjan, moteur de risque géographique, réponse graduée, globe 3D en direct ; **le plus complet et le mieux sourcé** |
| **C** | _Payment Integrity Router_ v1.1 ([`docs/prd.md`](./prd.md))                    | nous        | ≈ 8 200 mots          | Routeur FR → CN centré sur l'**intégrité du paiement** : intention signée, vérification hors bande, Jev/Mistral, registre Avalanche          |

---

## 1. Note par critère du jury (grille Track 1)

Notes de 1 à 5, _(analyse)_ : jugement de lecture, pas une mesure.

| Critère (poids)                    |    A    |    B    |    C    | Pourquoi                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | :-----: | :-----: | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Efficacité de détection (30 %)     |    2    |  **5**  |    3    | B : 6 typologies sourcées, signaux géographiques, protocole graine A / graine B, 3 références, gain de la géographie isolé. C : BEC + substitution en transit très solides, mais côté payeur seulement, pas de réseau de mules (zone 1 de la consigne), jeu de 300 scénarios moins rigoureux. A : aucun chiffre ni protocole.        |
| Qualité de la réponse (20 %)       |    3    |  **5**  |    4    | B : 4 niveaux, coupe-circuit régional, déclaration de soupçon avec délais par pays, qui est prévenu, interdiction de prévenir le client. C : vérification hors bande, time-lock, double contrôle, kill switch, révocation on-chain, le payeur tranche — mais pas d'analyste ni de déclaration. A : permettre / vérifier / suspendre. |
| Faisabilité et intégration (20 %)  |    3    |    3    |    3    | B : planning à l'heure près et rôles, mais repart de zéro (FastAPI) en ignorant la base de code déjà dans le dépôt, 5 rôles pour 4 personnes. C : réutilise la base, charge chiffrée en h·p, chemin critique — mais 33 P0 ≈ 134 h·p pour ≈ 120 h·p disponibles **et suppose 36 h**. A : simple mais générique.                       |
| Conformité et explicabilité (15 %) |    2    |  **5**  |    4    | B : tableau par pays (GAFI R16, NFIU, FIC, CENTIF, lois données), décisions rejouables. C : journal hash-chaîné, registre de confirmation, clé auditeur eERC ; cadre réglementaire peu détaillé dans le PRD (il est dans `projet.md`).                                                                                               |
| Pitch et démo (15 %)               |    2    |  **5**  |    4    | B : globe où l'on voit le paiement voyager et la fraude s'allumer, 7 temps. C : script minuté, preuve sur l'explorer, mais un tableau de bord plutôt qu'une scène.                                                                                                                                                                   |
| **Score pondéré**                  | **2,4** | **4,6** | **3,5** |                                                                                                                                                                                                                                                                                                                                      |

Hors grille, la **profondeur de sécurité** est l'atout de C : c'est le seul PRD qui empêche structurellement la substitution de bénéficiaire (intention signée vérifiée par chaque rail) et qui protège _avant_ la signature. B et A détectent ; C rend une classe d'attaque impossible.

---

## 2. Le meilleur de chaque PRD (repris dans le PRD final)

### A — Risk-Aware Payment Router

1. **Deux risques séparés** : le risque de fraude de la transaction décide si le paiement part ; le risque de route ne sert qu'à choisir le rail. « Changer de route ne résout jamais une fraude. » → principe directeur n° 2 du PRD final, et correction d'une faille de B (voir §4).
2. **Visibilité fragmentée** comme cœur du problème : chaque institution ne voit qu'un tronçon ; la corrélation de signaux pseudonymisés entre institutions est ce qui détecte les mules. → argument de la « vue complète ».
3. **Échec sûr** : la panne d'un agent n'autorise jamais un paiement ; un contrôle impossible fait échouer le paiement suspect. (Convergent avec C, NF-2.)
4. **Les textes du paiement sont des données, jamais des instructions** (injection dans les métadonnées). → exigence NF du PRD final.
5. **Risque d'accessibilité** (le bénéficiaire peut-il retirer l'argent ?). Convergent avec B.
6. **Accroche** : _« La route la plus intelligente pour votre argent est celle qui arrive à bon port. »_

Écarté : l'habillage « multi-agents » (trois agents LLM) — risque d'« IA de façade » devant un jury fintech ; dans le PRD final, les trois rôles sont tenus par le moteur de risque (détection), l'analyse de graphe (investigation inter-réseaux) et Mistral + moteur de règles (explication et décision).

### B — L'aiguilleur (Oscar)

1. **Problème terrain chiffré et sourcé** dans le corridor (Banque mondiale 8,46 %, Swift 25 % < 1 h, îlots PAPSS / PI-SPI, plafonds, zone franc, fraude NIBSS / BoG / PLCC). → repris intégralement.
2. **Persona analyste fraude et conformité** comme utilisateur quotidien, et la fintech émettrice comme client payant. → colle à la zone 1 de la consigne et au critère « utile à l'analyste ».
3. **KPI reliés aux critères du jury**. → repris, complétés par les KPI d'intégrité de C.
4. **Globe en direct** piloté par un flux d'événements SSE (le globe ne calcule rien) + fil texte de secours. → repris, réduit en P0 aux couches indispensables.
5. **Spécification du routage** : graphe institution × région, Yen k = 5, score unique, une seule route renvoyée avec sa raison, découpage par flot à coût minimal, devis 600 s, règles géographiques (parité FCFA, fuseaux, règlement PAPSS 11 h UTC, PAPSS fermé vers la Côte d'Ivoire).
6. **Moteur de risque** : 6 typologies sourcées, signaux géographiques (déplacement impossible > 900 km/h…), règles + graphe + anomalies + modèle supervisé, seuils 40 / 70 / 90, 3 signaux les plus forts par alerte.
7. **Plan de réponse** : 4 niveaux, coupe-circuit régional (−20 points, 24 h), déclaration de soupçon pré-remplie avec délais NFIU / FIC / CENTIF, interdiction de prévenir le client. → c'est le livrable « response playbook » exigé.
8. **Format pivot pacs.008 avec UETR**, API REST claire, paramètres de simulation des 7 rails sourcés, PaySim + AMLworld.
9. **Protocole d'évaluation** : graine A pour régler, graine B pour mesurer, 3 références dont « institution isolée », gain de la géographie à faux positifs égaux.
10. **Conformité par pays, NIST CSF, MITRE ATT&CK, questions du jury, risques techniques** (react-globe.gl sans SSR, entiers pour le flot, robinet Fuji).

Écarté ou corrigé : la pile repartant de zéro (Python seul + SQLite) ; le terme de fraude **dans** le score de route (ρ·R) ; LLM en P2 seulement ; journal sur Fuji sans intention signée ; 5 rôles pour 4.

### C — Payment Integrity Router (notre PRD)

1. **Intention signée = source de vérité** : `intent_hash` + nonce portés par chaque jambe ; chaque connecteur refuse une jambe qui ne correspond pas → la **substitution en transit est impossible**, pas seulement détectée.
2. **Protection avant signature** : registre de bénéficiaires vérifiés, vérification hors bande sur un contact déjà connu, time-lock proportionnel, double contrôle au-delà d'un seuil, signature bloquée (pas seulement avertie).
3. **Le payeur dans la boucle** par un canal hors bande (jamais l'e-mail, qui recrée la faille BEC) — téléphone simulé visible en démo.
4. **Jev (Système 1) + Mistral (Système 2)** avec les contraintes réelles apprises sur LawHack : une question par appel, appels en parallèle, 2 points d'appel, cache, quota ; Mistral explique et ne décide jamais ; désaccord classifieur / Jev → retenue.
5. **Mode dégradé plus strict, jamais plus laxiste** ; budget d'alertes qui ne lève jamais une règle.
6. **Journal hash-chaîné** et **registre de confirmation Avalanche** (`IntentRegistry` : publication, révocation, `isConfirmed`) vérifiable par un tiers ; déjà codé sur les branches `intent-registry` et `core-package`, avec la L1 locale et l'eERC (partiel).
7. **Critères d'acceptation testables**, NF chiffrées, **charge en h·p, chemin critique, kit de démarrage, autocritique**.
8. **Réutilisation de la base de code** déjà copiée dans le dépôt (Next.js, Supabase, SOR Python, contrats Foundry).

Écarté ou déplacé : le corridor FR → CN ; 33 P0 ; prédicteurs en ligne (bandit), VC, Travel Rule, honeytokens, fiscalité, sandbox Airwallex, mode ombre → P2 ; ajout d'un pays en démo → P1.

---

## 3. Contradictions et arbitrages

| Sujet                 | A                         | B                                    | C                                  | **Décision du PRD final**                                                                                                                                                        | Pourquoi                                                                                                                                                                                                                                  |
| --------------------- | ------------------------- | ------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corridor              | Afrique, 2 pays           | Lagos – Accra – Abidjan              | FR → CN                            | **Lagos – Accra – Abidjan**                                                                                                                                                      | 2 PRD sur 3, données de B sourcées pays par pays, les îlots PAPSS / PI-SPI donnent une vraie histoire de routage, la base de code vise déjà Lagos. Le faux fournisseur de C se transpose tel quel (PME de Lagos → fournisseur d'Abidjan). |
| Durée du build        | 36 h                      | sam. 17 h → gel dim. 12 h, jury 13 h | 36 h                               | **Planning de B (≈ 19 h)**                                                                                                                                                       | B est le seul à donner l'agenda à l'heure près (point d'étape 18 h 30, atelier pitch 10 h). Si l'équipe confirme 36 h, les P1 remontent. **À confirmer immédiatement.**                                                                   |
| Fraude et route       | séparés                   | fraude dans le score (ρ·R)           | garde avant rail                   | **Séparés** : le niveau de fraude décide de l'éligibilité et de l'action ; le score de route n'a qu'un terme de risque _opérationnel_ du rail                                    | Avec ρ·R, un paiement frauduleux peut « passer » par une route au score bas : faille logique de B que A nomme explicitement.                                                                                                              |
| Sécurité              | détection                 | détection + réponse                  | intégrité + détection + humain     | **Les trois couches** : intégrité (C) → risque (B) → réponse graduée (B + C)                                                                                                     | Couvre détection 30 % _et_ réponse 20 %.                                                                                                                                                                                                  |
| Humain dans la boucle | « supervision »           | analyste                             | payeur                             | **Les deux** : le payeur confirme hors bande (niveaux moyen / élevé) ; l'analyste libère, bloque, déclare                                                                        | Répond à « si votre modèle se trompe, qui est responsable ? ».                                                                                                                                                                            |
| IA générative         | 3 agents LLM              | résumé LLM en P2                     | Jev + Mistral en P0                | **Jev P0 réduit à 2 questions à la signature ; Mistral P0 pour l'explication et le résumé de dossier, avec repli**                                                               | Les clés existent ; l'IA juge la sémantique d'une facture, ce que les règles ne savent pas faire ; elle ne décide jamais.                                                                                                                 |
| Chaîne                | option, C-Chain           | Fuji : séquestre + journal           | L1 PIR dédiée, repli Fuji, eERC    | **`IntentRegistry` P0 (déjà codé) : intentions, révocations, empreintes de décisions ; L1 PIR si opérationnelle à dim. 0 h, sinon Fuji ; séquestre on-chain P1 ; eERC P2**       | Garde l'avis du mentor sans le mettre sur le chemin critique.                                                                                                                                                                             |
| Pile                  | React + FastAPI           | Next.js + FastAPI                    | Next.js + Supabase + SOR existants | **Base de code existante** : Next.js (console, globe, signature) + services Python FastAPI (routage, risque, simulateur, évaluation, à côté du SOR) + `packages/core` + Supabase | Convergence de B et C ; ne réécrit pas ce qui existe.                                                                                                                                                                                     |
| Optimiseur            | NetworkX                  | Yen + OR-Tools                       | CVXPY                              | **Yen (networkx) pour les chemins ; CVXPY existant pour le découpage**                                                                                                           | Évite une dépendance de plus ; OR-Tools reste le repli.                                                                                                                                                                                   |
| Nombre de P0          | 8 « Must »                | 9 + globe                            | 33                                 | **14 modules P0, ≈ 55 h·p grâce à la base existante**, ordre de coupe écrit                                                                                                      | Ce qui tient en ≈ 19 h à 4.                                                                                                                                                                                                               |
| Nom                   | Risk-Aware Payment Router | L'aiguilleur                         | PIR (nom de travail)               | **Ouvert** ; code et dépôt restent `PIR`                                                                                                                                         | Proposition : « L'aiguilleur » à l'oral (parlant en français), PIR dans le code.                                                                                                                                                          |

---

## 4. Ce que la fusion change par rapport à notre PRD

**On gagne** : un terrain réel chiffré par pays ; la détection de réseaux de mules et la vue complète (zone 1, la plus notée) ; un analyste et une console ; un plan de réponse qui coche le livrable exigé ; un protocole d'évaluation rigoureux ; une conformité par pays prête pour la slide ; une démo visuelle (globe) ; un planning à l'heure.

**On garde** : tout le cœur intégrité (intention signée, `intent_hash` vérifié par chaque rail, vérification hors bande, time-lock, double contrôle, payeur dans la boucle, mode dégradé strict, journal hash-chaîné, registre Avalanche, Jev / Mistral).

**On perd** : le corridor FR → CN et le chiffre d'accroche BEC américain (remplacé par les typologies régionales : faux fournisseur classé par le GIABA, fraudes NIBSS / BoG / PLCC — le chiffre FBI IC3 reste citable comme ordre de grandeur mondial) ; la scène « provisionner vendredi, régler lundi » (remplacée par le règlement PAPSS 11 h UTC et les rails instantanés) ; l'ajout d'un pays en direct passe en P1.

**Ce qu'aucun des trois ne règle** _(analyse)_ : (1) pourquoi des institutions concurrentes partageraient leurs signaux — réponse proposée : métadonnées pseudonymisées seulement, bénéfice commun, mais non démontré ; (2) la liquidité des agents par région n'a aucune donnée publique (hypothèse simulée, à dire) ; (3) la vérification d'un `intent_hash` par un rail réel suppose son intégration — seul le connecteur simulé le fait en démo.

---

## 5. Verdict

**B est la meilleure base** (4,6 / 5 sur la grille) et sert de squelette au PRD final ; **C apporte la différenciation** que ni A ni B n'ont — rendre la substitution impossible au lieu de la détecter — et la discipline d'ingénierie (critères d'acceptation, charge, chemin critique) ; **A apporte un principe** qui corrige une faille de B. Le PRD final ([`prd-final.md`](./prd-final.md)) suit le plan de B, insère la couche intégrité de C entre la demande et le routage, applique la séparation des risques de A, et ramène le périmètre P0 à ce qui tient d'ici le gel de dimanche 12 h.

**Trois décisions à valider par l'équipe maintenant** : (1) corridor Afrique de l'Ouest ; (2) durée réelle (≈ 19 h ou 36 h) ; (3) nom à l'oral.
