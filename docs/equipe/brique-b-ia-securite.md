# Brique B — IA sécurité : risque, Système 1 (Jev), Système 2 (Mistral), données, évaluation

**Mission** : dire _si ce paiement est suspect et pourquoi_. Score 0–100 → niveau ; Jev pose ses deux questions de signature (sémantique) ; Mistral prépare le dossier et l'explication (**il ne décide jamais**) ; un jeu à graine permet de mesurer tout ça honnêtement.

**À lire** : PRD §2 (principes 5, 6, 8), §7 (F6, F7, F9, F11, F13, F21), §9 (risque, typologies, seuils), §14 (données synthétiques), §15 (évaluation, contrainte Jev). Interfaces : [`contrats.md`](./contrats.md) §2 « B ».

**Dossiers** : `services/pir/pir/{risk,ai,sim,eval}/`, `services/pir/fixtures/{dataset,invoices}/`.

## Tâches, dans l'ordre

| #   | Tâche                                                                                                                                                                                  | Critère d'acceptation (test)                                                                   | Prio |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| 0   | Stub `risk.score` / `ai.*` renvoyant un `RiskResult` fixe (faible pour Claire, moyen pour le faux fournisseur) avant 2 h 15                                                            | Le pipeline de D passe en stub                                                                 | P0   |
| 1   | **F11** simulateur à graine : acteurs FR-GH, paiements légitimes, faux fournisseur, substitution, pannes (graines A et B)                                                              | Même graine ⇒ mêmes transactions et attaques ; fichier étiqueté                                | P0   |
| 2   | **F6** moteur de risque : règles (B1–B4 du §9 : compte récent, provenance PDF par e-mail, nom ≠ facture, urgence) + signal de normes `N-R1` de A + graphe `networkx` + IsolationForest | Faux fournisseur ⇒ au moins `medium` ; signaux restitués avec leur contribution ; seuils du §9 | P0   |
| 3   | **F7** Jev : 2 questions de signature sur facture + contexte via Codiv (`openjev-latest`), **cache disque** obligatoire                                                                | Réponses en cache ou en direct, aucune action ; désaccord modèle/Jev > 0,4 ⇒ au moins `high`   | P0   |
| 4   | **F9 (back)** Mistral : `case_file` (≤ 60 s) et `explain` (≤ 120 mots), textes de facture traités comme données                                                                        | Test : aucune sortie Mistral ne modifie le niveau ou l'action                                  | P0   |
| 5   | **F13** évaluation : entraînement/seuils graine A, mesure graine B ; ablations règles → + graphe → + modèle → + normes → + Jev                                                         | Script reproductible ; tableau rappel / faux positifs / taux de détournement pour le pitch     | P0   |
| 6   | F21 mode dégradé : sans Jev/Mistral ⇒ règles + modèle + humain, jamais plus laxiste                                                                                                    | Test avec clés absentes                                                                        | P1   |
| 7   | Modèle GBM supervisé, scène 3 (mules, coupe-circuit régional)                                                                                                                          | Si avance seulement                                                                            | P1   |

## Contraintes

- **Jev** : quota partagé ≈ 60 req/min → évaluation séquentielle ≤ 25 req/min, la nuit (lancer vers 4 h 30), jamais pendant la démo ; la démo lit le cache.
- Les modèles ne peuvent que **durcir** la décision (principe 5). Clés dans `services/pir/.env` (gitignoré).
- Aucun chiffre au pitch sans mesure sur la graine B.

## Prompt de démarrage pour l'orchestrateur

> Tu es l'orchestrateur de la **brique B (IA sécurité)** du projet PIR. Lis `docs/equipe/README.md`, `docs/equipe/contrats.md`, `docs/equipe/brique-b-ia-securite.md` et les sections §2, §7, §9, §14, §15 de `docs/prd-final.md`. Le PRD final prime sur `AGENTS.md` (pas de Claude : Système 1 = Jev via Codiv, Système 2 = Mistral). Tu ne modifies que `services/pir/pir/{risk,ai,sim,eval}/` et `services/pir/fixtures/{dataset,invoices}/`. Commence par la tâche 0 (stubs conformes à `contrats.md`), puis 1→5 : un sous-agent par tâche, une branche `brique-b/<tâche>` et une petite PR chacune, test d'acceptation avant le code. Respecte le quota Jev (cache, ≤ 25 req/min). Ne change aucune signature sans me le demander.
