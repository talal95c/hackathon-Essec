# Interopérabilité des systèmes d'information : problèmes, solutions, limites, pistes

> Synthèse documentaire, octobre 2026. Périmètre : les systèmes d'information en général, avec des exemples tirés de la santé, de la finance, de l'IoT et des agents IA. Ces exemples sont choisis en fonction du contexte du hackathon (Track 1 Fintech Security). Les sources sont numérotées [n] et listées à la fin. Les passages marqués *(analyse)* sont des déductions de l'auteur, pas des faits tirés d'une source.

---

## 1. Problématiques actuelles de l'interopérabilité

### 1.1 Définition et niveaux

La définition de référence vient de l'IEEE : l'interopérabilité est *« la capacité de deux ou plusieurs systèmes ou composants à échanger des informations et à utiliser les informations échangées »* [1]. La seconde moitié de la phrase compte autant que la première. Transporter des octets ne suffit pas : le système qui les reçoit doit pouvoir s'en servir.

On distingue en général quatre niveaux, qui s'empilent :

| Niveau | Question posée | Exemples de briques |
|---|---|---|
| **Technique** | Les systèmes peuvent-ils se connecter et transporter des données ? | Réseau, TCP/IP, HTTP, MQTT, files de messages, authentification de transport (TLS, mTLS) |
| **Syntaxique** | Les messages ont-ils une structure et un format communs ? | JSON, XML, schémas (JSON Schema, XSD), OpenAPI, AsyncAPI, ISO 20022 (XML) |
| **Sémantique** | Les deux parties donnent-elles le même sens aux données ? | Terminologies (SNOMED CT, LOINC), ontologies, vocabulaires communs (SEMIC Core Vocabularies), JSON-LD/RDF |
| **Organisationnelle** | Les processus, responsabilités, contrats et règles sont-ils alignés ? | Accords d'échange (TEFCA), gouvernance des données, SLA, cadres de confiance |

Le **Cadre européen d'interopérabilité (EIF)** ajoute un niveau **juridique** (des lois compatibles entre elles) et une **gouvernance intégrée** transverse. Il formule 47 recommandations pour les administrations [2]. Le règlement *Interoperable Europe Act* reprend explicitement ces niveaux et impose d'identifier les barrières *« juridiques, organisationnelles, sémantiques et techniques »* [3]. En France, le cadre d'interopérabilité des SI de santé (CI-SIS) de l'ANS sépare de la même façon les volets **syntaxiques** (structure et format) et **sémantiques** (jeux de valeurs, terminologies) [4].

### 1.2 Problèmes concrets rencontrés aujourd'hui

**a) Silos de données.** Les applications d'une même organisation communiquent encore mal entre elles. Dans la santé américaine, pourtant poussée par des incitations fédérales depuis plus de quinze ans, seuls **70 % des hôpitaux** pratiquaient en 2023 les quatre volets de l'échange interopérable (envoyer, recevoir, trouver, intégrer), et **43 %** seulement le faisaient *en routine*. Surtout, **71 %** déclaraient avoir accès en routine aux informations cliniques externes, mais **42 %** seulement indiquaient que les cliniciens s'en servaient vraiment pour soigner [5]. L'accès existe ; l'intégration dans le flux de travail ne suit pas.

**b) Formats hétérogènes.** Un même objet métier (un patient, un paiement, une adresse) est représenté de dizaines de façons. En finance, le réseau Swift a fait coexister pendant des années ses messages historiques MT et ISO 20022. La période de coexistence pour les instructions de paiement transfrontalières s'est terminée en **novembre 2025** [6]. Le chantier suivant est déjà lancé : la suppression des **adresses non structurées** [7]. *(analyse)* Toute migration de format fait cohabiter plusieurs « vérités » pendant des années, et les traductions MT↔MX perdent de l'information.

**c) Absence ou multiplicité de standards communs.** Quand le standard manque, chacun crée le sien. Quand plusieurs standards concurrents existent, on obtient le même résultat. En open banking européen, la DSP2 a imposé des API sans fixer de format unique. Il a fallu des standards de marché (Berlin Group NextGenPSD2, STET en France, etc.), et la proposition de règlement FiDA (*open finance*) prévoit justement une *« standardisation des données clients et des interfaces techniques »* [8].

**d) Verrouillage propriétaire (*vendor lock-in*).** Les fournisseurs dominants contrôlent les interfaces. Les régulateurs interviennent désormais directement :
- le **Digital Markets Act**, article 6(7), oblige les contrôleurs d'accès à ouvrir aux tiers les mêmes fonctions matérielles et logicielles du système d'exploitation que celles dont profitent leurs propres services. La Commission a rendu des décisions de spécification pour iOS/iPadOS (appareils connectés, **mars 2025**) puis pour Android et les services d'IA (**juillet 2026**) [9] ;
- le **Data Act** (applicable depuis le **12 septembre 2025**) impose aux fournisseurs de cloud et d'edge des exigences minimales d'interopérabilité pour permettre de changer de prestataire [10]. Les frais de changement sont supprimés **à partir du 12 janvier 2027** (art. 29) [11].

**e) Sécurité et confidentialité des échanges.** Chaque nouvelle interface agrandit la surface d'attaque. Les protocoles récents conçus pour faire parler les agents IA avec des outils en sont l'illustration. La spécification MCP (*Model Context Protocol*) reconnaît elle-même qu'elle *« ne peut pas imposer ces principes de sécurité au niveau du protocole »* et les délègue aux implémentations [12]. Dès avril 2025, des chercheurs ont décrit les **attaques par empoisonnement d'outils** (*tool poisoning*) : des instructions malveillantes sont cachées dans la description d'un outil, invisibles pour l'utilisateur mais lues par le modèle, qui exfiltre alors des données ou détourne le comportement de l'agent [13]. Interopérer, c'est aussi faire confiance au contenu reçu. *(analyse)* Plus l'interopérabilité progresse, plus ce besoin de confiance devient un problème de sécurité central.

**f) Gouvernance des données.** Qui a le droit d'accéder à quoi, pour quelle finalité, avec quel consentement, et qui répond en cas d'erreur ? Ces questions relèvent du niveau organisationnel et juridique ; un protocole ne les résout pas. La qualité des données en fait partie : Gartner chiffre le coût de la mauvaise qualité des données à **au moins 12,9 M$ par an** en moyenne par organisation (étude 2020) [14]. *(analyse)* L'interopérabilité diffuse ces erreurs plus loin et plus vite.

---

## 2. Solutions proposées

### 2.1 Interfaces et contrats d'API

- **REST + OpenAPI** : c'est le standard de fait pour décrire des API synchrones. La version **OpenAPI 3.2.0** a été publiée le **19 septembre 2025** [15].
- **GraphQL** : ici, c'est le client qui choisit les champs dont il a besoin, à partir d'un schéma typé unique. La spécification est publiée et versionnée par la GraphQL Foundation [16].
- **gRPC / Protocol Buffers** pour les échanges internes à faible latence *(standard de fait, cité pour mémoire)*.

### 2.2 Architectures orientées événements et middlewares

- **AsyncAPI** joue pour les API asynchrones le rôle d'OpenAPI. La spécification ne dépend d'aucun protocole de transport (AMQP, MQTT, Kafka, WebSockets…) [17].
- **CloudEvents** (projet *graduated* de la CNCF depuis janvier 2024) normalise les métadonnées d'un événement pour rendre les événements interopérables entre services, plateformes et systèmes [18].
- **Middlewares d'intégration** : ESB, iPaaS, bus de messages et passerelles d'API, qui traduisent et routent les messages entre systèmes hétérogènes.

### 2.3 Normes sectorielles

| Secteur | Standard / cadre | État (octobre 2026) |
|---|---|---|
| Santé | **HL7 FHIR** (ressources REST/JSON) | R5 publiée en mars 2023. **R6** : deux scrutins complets (déc. 2025, juil. 2026) et première *snapshot* 6.0.0, publication stable annoncée pour **septembre 2026** [19] |
| Santé (US) | **USCDI v3** via la règle HTI-1 ; réseau **TEFCA** (QHIN) | USCDI v3 devient le socle de certification au **1er janv. 2026** [20]. Premiers QHIN désignés en **déc. 2023** [21] |
| Santé (UE) | **Espace européen des données de santé (EHDS)**, règlement (UE) 2025/327 | En vigueur depuis mars 2025. Résumés patients et e-prescriptions échangés dans toute l'UE en **mars 2029**, imagerie, biologie et comptes rendus de sortie en **mars 2031** [22] |
| Santé (FR) | **CI-SIS** (ANS) : couches métier, service, transport | Construit sur des standards internationaux, avec espace de tests d'interopérabilité [4] |
| Finance | **ISO 20022** (paiements, titres) | Fin de la coexistence MT/MX transfrontalière en nov. 2025. Suppression des adresses non structurées en cours [6][7] |
| Finance (UE) | DSP2 → DSP3/RSP ; **FiDA** (open finance) | FiDA proposé le 28 juin 2023, toujours en cours de négociation [8] |
| Industrie / IoT | **OPC UA** (IEC 62541), architecture orientée services, indépendante de la plateforme [23] ; **Matter** (CSA) pour la maison connectée [24] | Matter 1.4 (nov. 2024), plus de 40 types d'appareils [25] |
| Identité | **Portefeuille européen d'identité numérique (EUDI Wallet)**, eIDAS 2 | Chaque État membre doit proposer au moins un portefeuille, sur des spécifications communes, **d'ici 2026** [26] |
| Agents IA | **MCP** (agent ↔ outils) ; **A2A** (agent ↔ agent) | MCP : version de spécification 2025-11-25, transféré à l'Agentic AI Foundation (Linux Foundation) en déc. 2025, plus de 10 000 serveurs publiés [12][27]. A2A : créé par Google, confié à la Linux Foundation en juin 2025 avec le soutien de plus de 100 entreprises [28][29] |

### 2.4 Formats ouverts, sémantique et ontologies

- **Linked Data / JSON-LD 1.1** (recommandation W3C du 16 juillet 2020) : sérialisation JSON qui rattache chaque champ à un vocabulaire partagé [30].
- **SEMIC Core Vocabularies** (Commission européenne) : modèles de données simples, réutilisables et extensibles pour décrire des entités de base (personne, organisation, lieu…), indépendamment du contexte [31].
- Terminologies sectorielles (SNOMED CT, LOINC en santé ; codes ISO 20022 en finance) et ontologies de domaine.

### 2.5 Espaces de données et cadres de confiance

- **Dataspace Protocol (DSP)** et **Decentralized Claims Protocol (DCP)** de l'Eclipse Dataspace Working Group, en cours de normalisation à l'ISO/IEC (DIS 26450 et 26451, série 20151 « Dataspaces ») [32].
- Le **Data Act** (chapitre VIII, art. 33 à 36) fixe des exigences essentielles d'interopérabilité pour les participants aux espaces de données, pour les services cloud et pour les *smart contracts* qui exécutent des accords de partage de données [11].

### 2.6 Leviers réglementaires et de gouvernance

- **Interoperable Europe Act** (règlement (UE) 2024/903) : en vigueur depuis le 11 avril 2024, applicable depuis le 12 juillet 2024. L'**évaluation d'interopérabilité** est obligatoire depuis le **12 janvier 2025** avant toute nouvelle exigence contraignante touchant les services publics transeuropéens. Le texte organise aussi le partage et la réutilisation des solutions entre administrations [3][33].
- **EIF** : cadre de référence de ces évaluations [2][3].

---

## 3. Limites de ces solutions

**a) Coûts d'adoption.** Chaque migration (MT → ISO 20022, CDA → FHIR, API propriétaires → standard) demande de développer, tester, former les équipes et faire tourner deux systèmes en parallèle. Les écarts de moyens se voient dans les chiffres : aux États-Unis, les hôpitaux petits, ruraux ou indépendants pratiquent nettement moins l'échange interopérable que les grands [5]. *(analyse)* Le coût fixe d'une intégration pèse proportionnellement plus lourd sur les petits acteurs, ce qui creuse l'écart.

**b) Complexité d'implémentation.** Les standards modernes sont des *frameworks* plus que des formats. FHIR ne s'utilise en pratique qu'au travers de **guides d'implémentation** et de **profils** nationaux ou métier. Deux implémentations « conformes FHIR » peuvent donc ne pas se comprendre *(analyse)*. Côté agents, MCP laisse aux implémenteurs le consentement, l'autorisation et le contrôle d'accès [12]. La sécurité dépend donc de la qualité de chaque client et de chaque serveur.

**c) Adoption partielle et optionnalité.** Un standard n'apporte rien si son implémentation est facultative ou incomplète :
- Matter n'oblige pas chaque plateforme à prendre en charge tous les types d'appareils. Un purificateur d'air peut fonctionner via Matter avec Amazon Alexa et pas avec Google Home [25] ;
- en santé, 71 % des hôpitaux ont accès aux données externes, mais seulement 42 % des cliniciens s'en servent [5]. On peut être interopérable sur le papier et peu interopérable dans les faits ;
- en open banking, plusieurs standards d'API coexistent en Europe (Berlin Group, STET…), d'où la volonté d'harmoniser dans FiDA [8].

**d) Incompatibilités de versions.** Les standards évoluent plus vite que les systèmes installés. FHIR a publié R4 (2019) et R5 (2023), et R6 arrive [19]. Les versions qui ne sont pas rétrocompatibles obligent à maintenir des passerelles. MCP a publié plusieurs versions datées en 2025 (2025-06-18, 2025-11-25) [12]. *(analyse)* Les écosystèmes jeunes cassent souvent la compatibilité ; l'interopérabilité promise doit alors être renégociée à chaque version.

**e) Manque de maturité et calendrier long.** Beaucoup de solutions sont encore en construction :
- les normes ISO/IEC sur les espaces de données sont au stade AWI/DIS/FDIS [32] ;
- l'EHDS ne produira ses premiers échanges obligatoires qu'en **2029**, et les catégories suivantes en **2031** [22] ;
- FiDA est en négociation depuis 2023 [8] ;
- les protocoles d'agents (MCP, A2A) n'ont que 1 à 2 ans d'existence et leurs modèles de sécurité sont encore attaqués [13].

**f) Interopérabilité contre sécurité.** Ouvrir des interfaces (DMA, Data Act, open banking, MCP) agrandit la surface d'attaque et multiplie les intermédiaires de confiance. L'empoisonnement d'outils MCP le montre : un serveur malveillant peut écraser les instructions de serveurs de confiance branchés sur le même agent [13].

**g) Le niveau sémantique reste le plus dur.** *(analyse)* Les briques techniques et syntaxiques sont largement disponibles : HTTP, JSON, OpenAPI, AsyncAPI, CloudEvents. Les échecs se produisent surtout au niveau sémantique (même champ, sens différent) et organisationnel (qui est responsable de quoi). Aucun protocole ne règle ces deux niveaux à lui seul.

---

## 4. Manques et pistes d'amélioration

### 4.1 Ce qui reste non résolu

1. **Sémantique de bout en bout.** Il manque des vocabulaires partagés et maintenus entre secteurs (santé ↔ assurance ↔ finance, par exemple), et des correspondances automatiques et vérifiables entre eux.
2. **Mesure de l'interopérabilité réelle.** La plupart des indicateurs comptent la *capacité* d'échange, pas l'*usage* : on voit l'écart entre accès et usage dans [5]. Il faudrait des indicateurs d'intégration effective dans les processus métier.
3. **Confiance et provenance des données échangées.** Les protocoles transportent les données mais ne garantissent ni leur provenance ni leur intégrité sémantique. Le problème devient critique quand des **agents IA** consomment ces données et agissent à partir d'elles [12][13].
4. **Sécurité des protocoles d'agents.** Il n'existe pas encore de modèle standard d'autorisation *déléguée* et *bornée à une tâche* entre un humain, un agent et des outils. MCP renvoie explicitement ces garanties aux implémentations [12].
5. **Gouvernance et responsabilité.** Quand un échange interopérable produit une erreur ou un préjudice, qui en répond : l'émetteur, l'intermédiaire ou le récepteur ? Les cadres contractuels (type TEFCA) existent par secteur, pas de manière transverse.
6. **Inclusion des petits acteurs.** Le coût d'entrée reste trop élevé pour les petites structures [5].

### 4.2 Orientations futures

- **« Interoperability by design » obligatoire.** Généraliser l'évaluation d'interopérabilité *avant* toute décision, sur le modèle de l'Interoperable Europe Act [3], aux projets privés soumis à régulation (cloud, finance, santé).
- **Standards ouverts, gouvernance neutre.** Confier les protocoles à des fondations neutres (Linux Foundation pour A2A et MCP, CNCF pour CloudEvents, ISO/IEC pour les espaces de données), avec des versions planifiées et des garanties de rétrocompatibilité [18][27][28][32].
- **Contrats d'interface lisibles par machine et testés en continu.** Faire d'OpenAPI, d'AsyncAPI et des profils FHIR des artefacts testés en intégration continue, avec des bancs de conformité publics, comme l'espace de tests du CI-SIS [4].
- **Couche sémantique partagée.** Réutiliser les vocabulaires communs (SEMIC, JSON-LD) plutôt que créer des schémas *ad hoc*, et publier les correspondances entre standards [30][31].
- **Sécurité native des échanges.** Authentification forte des parties, signature et provenance des données et des descriptions d'outils, autorisations courtes et révocables limitées à une tâche, humain dans la boucle pour les actions sensibles *(analyse)*. Ces pistes répondent directement aux attaques décrites dans [13].
- **Identité portable.** S'appuyer sur l'EUDI Wallet et les attestations vérifiables pour éviter que chaque organisation gère sa propre identité [26].
- **Réversibilité garantie.** Le Data Act fournit le modèle : droit de changer de fournisseur, export des données et métadonnées, fin des frais de changement en 2027 [10][11].

### 4.3 Éclairage pour le hackathon (Track 1, finance et agents IA) *(analyse)*

L'axe 3 de la Track 1 (« supervision et confinement des agents IA financiers ») se situe exactement là où l'interopérabilité et la sécurité entrent en tension. MCP et A2A rendent les agents interopérables avec les outils et entre eux [12][28]. En revanche, la **chaîne d'autorité** (qui a demandé quoi), la **provenance des paramètres** et la **révocation** ne sont pas standardisées. Un projet qui ajoute ces garanties *sans casser l'interopérabilité* (proxy compatible MCP, jetons de mandat standard, journaux exploitables pour DORA) répond aux points 4.1-3, 4.1-4 et 4.1-5.

---

## Sources

1. IEEE, *IEEE Standard Computer Dictionary: A Compilation of IEEE Standard Computer Glossaries*, 1990 (définition reprise dans ISO/IEC/IEEE 24765).
2. Commission européenne, *The New European Interoperability Framework* (COM(2017)134). https://ec.europa.eu/isa2/eif_en/
3. Règlement (UE) 2024/903 (*Interoperable Europe Act*), EUR-Lex. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R0903
4. Agence du Numérique en Santé, *Cadre d'interopérabilité des systèmes d'information de santé (CI-SIS)*. https://esante.gouv.fr/produits-services/ci-sis
5. ONC (ASTP), *Interoperable Exchange of Patient Health Information Among U.S. Hospitals: 2023*, data brief. https://www.healthit.gov/data/data-briefs/interoperable-exchange-patient-health-information-among-us-hospitals-2023
6. Swift, *ISO 20022: frequently asked questions*. https://www.swift.com/standards/iso-20022/iso-20022-faqs
7. Swift, *About ISO 20022* (prochaine étape : suppression des adresses non structurées). https://www.swift.com/standards/iso-20022
8. Commission européenne, *Framework for financial data access* (proposition du 28 juin 2023). https://finance.ec.europa.eu/digital-finance/framework-financial-data-access_en
9. Commission européenne, *Digital Markets Act — Interoperability*. https://digital-markets-act.ec.europa.eu/questions-and-answers/interoperability_en
10. Commission européenne, *Data Act* et *Data Act explained*. https://digital-strategy.ec.europa.eu/en/policies/data-act — https://digital-strategy.ec.europa.eu/en/factpages/data-act-explained
11. Règlement (UE) 2023/2854 (*Data Act*), art. 29, 33 à 36, 50, EUR-Lex. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R2854
12. *Model Context Protocol — Specification* (versions 2025-06-18 et 2025-11-25, section « Security and Trust & Safety »). https://modelcontextprotocol.io/specification/2025-11-25
13. Invariant Labs, *MCP Security Notification: Tool Poisoning Attacks*, 1er avril 2025. https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks
14. Gartner, *Data Quality: Why It Matters and How to Achieve It*. https://www.gartner.com/en/data-analytics/topics/data-quality
15. OpenAPI Initiative, *OpenAPI Specification v3.2.0*, 19 septembre 2025. https://spec.openapis.org/oas/v3.2.0.html
16. GraphQL Foundation, *GraphQL Specification Versions*. https://spec.graphql.org/
17. AsyncAPI Initiative, *AsyncAPI Specification 3.0.0*. https://www.asyncapi.com/docs/reference/specification/v3.0.0
18. CNCF, *Cloud Native Computing Foundation Announces the Graduation of CloudEvents*, 25 janvier 2024. https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/
19. HL7, *FHIR Specification — Publication (Version) History*. https://hl7.org/fhir/directory.html
20. ONC, *HTI-1 Final Rule*. https://www.healthit.gov/topic/laws-regulation-and-policy/health-data-technology-and-interoperability-certification-program
21. ONC, *Trusted Exchange Framework and Common Agreement (TEFCA)*. https://www.healthit.gov/topic/interoperability/policy/trusted-exchange-framework-and-common-agreement-tefca
22. Commission européenne (DG SANTE), *European Health Data Space Regulation (EHDS)*. https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en
23. OPC Foundation, *OPC Unified Architecture*. https://opcfoundation.org/about/opc-technologies/opc-ua/
24. Connectivity Standards Alliance, *Matter*. https://csa-iot.org/all-solutions/matter/
25. The Verge, *Every device that works with Matter* (mis à jour en décembre 2024). https://www.theverge.com/23568091/matter-smart-home-standard-explained-questions-answers
26. Commission européenne, *EU Digital Identity Wallet*. https://ec.europa.eu/digital-building-blocks/sites/display/EUDIGITALIDENTITYWALLET/EU+Digital+Identity+Wallet+Home
27. Linux Foundation, *Formation of the Agentic AI Foundation (AAIF)… Model Context Protocol (MCP), goose and AGENTS.md*, 9 décembre 2025. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
28. Linux Foundation, *Linux Foundation Launches the Agent2Agent Protocol Project*, 23 juin 2025. https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents
29. *A2A Protocol* (documentation officielle). https://a2a-protocol.org/latest/
30. W3C, *JSON-LD 1.1*, Recommendation, 16 juillet 2020. https://www.w3.org/TR/json-ld11/
31. Interoperable Europe / SEMIC, *Core Vocabularies*. https://interoperable-europe.ec.europa.eu/collection/semic-support-centre/core-vocabularies
32. IDSA Knowledge Base, *Standards and specifications* (Dataspace Protocol, DCP, ISO/IEC 20151, 26450, 26451). https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol
33. Interoperable Europe Portal, *Interoperable Europe Act*. https://interoperable-europe.ec.europa.eu/interoperable-europe/interoperable-europe-act

*Sources consultées le 10 octobre 2026.*
