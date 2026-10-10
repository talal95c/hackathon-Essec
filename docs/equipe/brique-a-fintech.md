# Brique A — Fintech : normes, bénéficiaires, routage, connecteurs

**Mission** : décider _quelles routes sont permises_ (normes des deux pays, la plus stricte gagne), _laquelle est la moins chère_ (score S, sans risque de fraude), et faire en sorte que **les connecteurs simulés refusent toute jambe qui ne correspond pas à l'intention signée**.

**À lire** : PRD §2 (principes 1–3), §7 (F1, F3, F4, F5), §8 (routage, moteur de normes, paramètres FR-GH), §13 (format pivot pacs.008). Interfaces : [`contrats.md`](./contrats.md) §2 « A ».

**Dossiers** : `services/pir/pir/{norms,routing,connectors,payees}/`, `services/pir/fixtures/packs/`.

## Tâches, dans l'ordre

| #   | Tâche                                                                                                                         | Critère d'acceptation (test)                                                                                                | Prio |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---- |
| 0   | Stub de toutes les fonctions A renvoyant les fixtures FR-GH (avant 2 h 15)                                                    | Le pipeline de D passe en stub                                                                                              | P0   |
| 1   | `fixtures/packs/fr-gh.yaml` : profils France + Ghana, routes R1–R4 (coûts/délais simulés du §8), coordonnées des institutions | Chargé par un loader Pydantic ; chaque route `sim: true`                                                                    | P0   |
| 2   | **F1** moteur de normes déclaratif (règles dans le pack, pas dans le code)                                                    | Test FR-GH : R4 exclue pour des biens, raison et `rule_id` renvoyés ; signal `N-R1` pour B                                  | P0   |
| 3   | **F4** routage : filtres (normes → niveau de risque) puis S ; Yen `networkx.shortest_simple_paths`, devis 600 s               | Test : niveau `medium` ⇒ seules routes `conditional` ; la fraude n'entre pas dans S                                         | P0   |
| 4   | **F5** connecteurs simulés (pacs.008 minimal, `intent_hash` + nonce en `SplmtryData`) émettant `hop.*`                        | Tests substitution (compte/montant changé) et rejeu (nonce consommé) refusés **avant** `initiate`, événement `leg.rejected` | P0   |
| 5   | **F3** bénéficiaires : `name_check`, `sim_swap` (mock CAMARA), demande/réponse hors bande vers le contact connu               | Nouveau compte issu d'un PDF par e-mail ⇒ hors bande requis ; refus ⇒ `chain.record_verification(False)`                    | P0   |
| 6   | Pannes de rail (`rail.down/up`) et reroutage                                                                                  | `POST /v1/sim/events` coupe R3 ⇒ devis suivant sur la route conforme suivante                                               | P1   |
| 7   | F20 pack 2 Lagos → Accra depuis un seul fichier                                                                               | Chargé sans modifier le moteur                                                                                              | P1   |

## Ne pas faire

- Mettre le score de fraude dans S (principe 2) ; laisser un modèle réactiver une route exclue par une norme.
- Écrire sur la chaîne directement : passer par `pir.chain.*` (brique C).

## Prompt de démarrage pour l'orchestrateur

> Tu es l'orchestrateur de la **brique A (fintech)** du projet PIR. Lis `docs/equipe/README.md`, `docs/equipe/contrats.md`, `docs/equipe/brique-a-fintech.md` et les sections §2, §7, §8, §13 de `docs/prd-final.md`. Le PRD final prime sur `AGENTS.md`. Tu ne modifies que `services/pir/pir/{norms,routing,connectors,payees}/` et `services/pir/fixtures/packs/`. Commence par la tâche 0 (stubs conformes aux signatures de `contrats.md`), puis enchaîne les tâches 1→5 : un sous-agent par tâche, une branche `brique-a/<tâche>` et une petite PR chacune, test d'acceptation écrit avant le code, `pytest` vert avant PR. Ne change aucune signature sans me le demander.
