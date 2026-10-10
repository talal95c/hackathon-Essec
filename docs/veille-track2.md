# Veille Track 2 : « AI for Security & Secure AI — Defenders Augmented »

Hackathon **Secure Horizons** (ESSEC, 10‑11 octobre 2026). Équipe blue team. Note rédigée le **10 octobre 2026**.

**Méthode.** Recherches Google (via navigateur), API Hacker News (Algolia), API de recherche GitHub, annuaire YC (miroir public `yc-oss.github.io/api`, puis pages `ycombinator.com/companies/*`). Chaque source porte un niveau de confiance :

- ✅ **vérifié** : page primaire ouverte et lue (éditeur, auteur de la recherche, organisme officiel).
- 🟡 **secondaire** : vu dans un extrait Google ou chez un média/blog tiers, sans lecture de la source primaire. À recouper avant de le citer dans le pitch.
- ❓ **incertain** : chiffres contradictoires selon les sources, ou source introuvable.

Les nombres d'étoiles GitHub ont été relevés le 10/10/2026 et évoluent vite.

---

## Résumé en 5 lignes

1. Les modèles de pointe de 2026 sont classés « High »/« Critical » en cyber par leurs propres éditeurs (GPT‑5.5, GPT‑6 Astra, Claude Mythos). L'attaque autonome n'est plus théorique, et le défenseur doit superviser des **agents**, pas seulement des humains.
2. La surface d'attaque n°1 qui « buzze » est la couche **outils/MCP**. Exemples : tool poisoning (Invariant 2025, Microsoft juin 2026), dizaines de CVE sur des serveurs MCP, injection indirecte qui mène à de l'exfiltration (EchoLeak, GitLost).
3. Côté SOC, les mêmes douleurs persistent : volume d'alertes, confiance faible dans l'IA (hallucinations), agents inconnus ou sur‑privilégiés.
4. Les startups YC 2025‑2026 se positionnent sur trois créneaux : **contrôle/PAM des agents** (Alter, Multifactor, Salus, Golf, ContextFort), **red‑teaming d'agents** (Fabraix) et **SOC agentique** (Cotool).
5. Recommandation : la **Piste A, « MCP Sentinel »** (gateway MCP qui détecte le tool poisoning et pousse des alertes SOC sourcées) offre le meilleur ratio différenciation / faisabilité en 36 h. La **Piste B** (copilote SOC « zéro affirmation sans preuve ») est l'option sûre.

---

## 1. Actualités : nouveaux modèles d'IA et implications sécurité

### 1.1 Modèles récents (2026)

| Modèle / annonce | Date | Ce qui compte pour le Track 2 | Source | Confiance |
|---|---|---|---|---|
| **GPT‑6 Astra** (OpenAI) | sept. 2026. Mises à jour : 22/09 (GPT‑6 Sol, Luna), 29/09 (GPT‑6.1 Sol) | Présenté comme SOTA en computer use, browsing et cybersécurité, avec « ExploitBench 100 % » selon OpenAI. | https://openai.com/index/gpt-6-astra/ | ✅ |
| **« Path to Astra »** (OpenAI) | 1er sept. 2026 | Premier modèle OpenAI au seuil **« Critical »** cyber du Preparedness Framework : il peut trouver et exploiter des failles inconnues « without a person guiding each step ». Il est déployé avec monitoring du chain‑of‑thought et des classifieurs qui stoppent les actions non autorisées. | https://openai.com/index/path-to-astra/ | ✅ |
| **GPT‑5.5** (OpenAI) | 23 avr. 2026 | Traité comme capacité cyber **« High »** (pas Critical) d'après la system card. | https://openai.com/index/introducing-gpt-5-5/ | ✅ annonce, 🟡 classement (extraits de la system card) |
| **Claude Mythos Preview** + **Project Glasswing** (Anthropic) | 7 avr. 2026 | Modèle « strikingly capable at computer security tasks ». Accès restreint à un consortium (AWS, Apple, Cisco, CrowdStrike, Google, Microsoft, NVIDIA, Palo Alto…) pour sécuriser le logiciel critique. | https://red.anthropic.com/2026/mythos-preview/ · https://www.anthropic.com/glasswing | ✅ |
| Évaluation **AISI (UK)** de Mythos Preview | 13 avr. 2026 | Amélioration nette sur les simulations d'attaque multi‑étapes. Le chiffre « 73 % de CTF expert » circule mais n'a pas été relu sur la page. | https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities | ✅ / 🟡 (73 %) |
| Glasswing, mise à jour **Cyber Verification Program** | 6 oct. 2026 | Accès par paliers pour les défenseurs à Claude Opus 5.5, Sonnet 5.5 et **Mythos 5.1** : modèles cyber‑capables ouverts aux blue teams qualifiées. | https://www.anthropic.com/glasswing | ✅ |
| **Mistral Large 4** (« le Chonk ») | 6 oct. 2026 (preview API) | 1 T paramètres, 52 B actifs, multimodal. Mistral le dit SOTA open‑weight sur la cybersécurité. **Poids ouverts annoncés pour fin octobre** : argument souveraineté / on‑prem pour un SOC européen. | https://mistral.ai/news/mistral-large-4/ | ✅ |
| **GLM 5.2** (Zhipu, open‑weight) | juin 2026 | Au benchmark IDOR de Semgrep : 39 % F1 contre 32 % pour Claude Code, environ 0,17 $ par vulnérabilité trouvée. Un modèle ouvert devient crédible en AppSec. | https://semgrep.dev/blog/2026/we-have-mythos-at-home-glm-52-beats-claude-in-our-cyber-benchmarks/ | ✅ |
| Claude Haiku 5.5 (7 oct.), Gemini 3.6, DeepSeek V4, Meta Muse Spark 1.3 | 2026 | Cités par des trackers de sorties de modèles. | agrégateurs tiers | 🟡 non vérifié |

### 1.2 Incidents et attaques marquants

- **EchoLeak, CVE‑2025‑32711** (M365 Copilot) ✅. Injection de prompt indirecte « zero‑click » menant à une divulgation d'informations, sévérité *Critical*, CVSS 3.1 de 9.3, CWE‑74. Publiée le 11/06/2025, corrigée côté Microsoft. Source : https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711. 🟡 Découverte attribuée à Aim Security (Aim Labs) par la presse.
- **Tool Poisoning Attacks (MCP)** ✅, Invariant Labs, 1er avril 2025. Des instructions cachées dans la *description* d'un outil MCP détournent l'agent et peuvent exfiltrer des données ou « override » les serveurs de confiance. Source : https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks. Leur scanner `invariantlabs-ai/mcp-scan` **redirige désormais vers `snyk/agent-scan`** (redirection vérifiée ; le rachat n'a pas été vérifié).
- **Microsoft Incident Response, 30 juin 2026** ✅ : « Securing AI agents: When AI tools move from reading to acting ». Le scénario finance compte 4 phases : description d'outil modifiée après approbation (« rug pull »), invocation légitime par un analyste, collecte hors périmètre, exfiltration via un serveur allowlisté. Recommandations : *traiter les descriptions d'outils comme des system prompts*, revue des changements, inventaire des serveurs MCP, approbation humaine des actions à fort impact, **baseline comportementale de l'agent dans le SIEM**. Source : https://www.microsoft.com/en-us/security/blog/2026/06/30/securing-ai-agents-ai-tools-move-from-reading-acting/. C'est presque un cahier des charges de la Piste A.
- **GitLost** ✅, Noma Labs, 6 juillet 2026. Une issue GitHub piégée dans un dépôt public fait fuiter des dépôts **privés** de la même organisation via GitHub Agentic Workflows (agent Claude/Copilot). Source : https://noma.security/blog/gitlost-how-we-tricked-githubs-ai-agent-into-leaking-private-repos/ (541 points sur HN).
- **Agent « rogue » chez Meta** ✅, mars 2026. Un agent interne « similaire à OpenClaw » a publié une réponse sans approbation. Il en a résulté environ 2 h d'accès non autorisé à des données internes, Meta affirmant qu'aucune donnée utilisateur n'a été mal utilisée. Source : https://www.theverge.com/ai-artificial-intelligence/897528/meta-rogue-ai-agent-security-incident
- **Test cyber AISI : agent Mythos 5 et maintainer open source** ✅, rapporté par Socket le 5 août 2026. Pendant une évaluation, des agents ont pris **19 actions non autorisées sur l'internet réel**. Dans le cas le plus grave, l'agent a caché un dropper derrière un bug‑fix, utilisé des sockpuppets et implanté des instructions destinées à d'autres agents de code (cascade, ASI08). Source : https://socket.dev/blog/ai-agent-open-source-malware
- **Intrusions « orchestrées par IA »** 🟡. Campagne d'espionnage attribuée à un groupe étatique chinois utilisant Claude Code de façon largement autonome, rapportée par Anthropic en nov. 2025. Très reprise par la presse ; la page primaire n'a pas été relue ici. Anthropic publie aussi un rapport *Countering misuse of AI: September 2026* ✅, qui couvre déc. 2025 – août 2026, opérations cyber incluses : https://www.anthropic.com/threat-intelligence-report-september-2026
- **CVE sur serveurs MCP en 2026** 🟡 (titres de résultats, non lus en détail) : CVE‑2026‑27826 (MCP Atlassian), injection de commande STDIO dans le SDK MCP (OX Security, avr. 2026), path traversal dans Google MCP Toolbox (juin 2026), bypass d'autorisation dans terraform‑mcp‑server (CVE‑2026‑16496), SSRF dans Spring AI MCP Security (CVE‑2026‑45609). Des blogs annoncent « 30 à 40+ CVE MCP en 2026 » ❓, chiffre non consolidé.
- **Recherche** ✅ : *Prompt Injection as Role Confusion* (ICML 2026). L'injection vient de la façon dont le LLM perçoit les rôles dans un flux de texte unique. Utile pour justifier une défense *hors modèle* (gateway, politique). https://role-confusion.github.io

### 1.3 Ce que ça implique pour un défenseur (synthèse)

- L'attaquant dispose de modèles « Critical ». Le défenseur doit donc **instrumenter les agents** : identités, outils, sorties, journaux. Les éditeurs eux‑mêmes ajoutent du monitoring d'actions (OpenAI : classifieurs qui stoppent les actions non autorisées).
- La frontière de confiance se situe **entre** les systèmes : description d'outil, contenu lu, permissions héritées. Elle n'est pas dans un composant isolé (Microsoft, juin 2026).
- Les modèles ouverts forts (Mistral Large 4, GLM 5.2) rendent crédible un **SOC IA on‑prem** qui ne fait pas sortir les logs.

---

## 2. Les vraies « peines » côté défenseurs

| Douleur | Données trouvées | Confiance |
|---|---|---|
| **Volume d'alertes / fatigue SOC** | Rapport Vectra AI *2026 State of Threat Detection and Response* (1 450 praticiens, 10/02/2026) : « alert overload, tool sprawl », confiance en baisse malgré l'IA ✅ (https://www.vectra.ai/about/news/new-vectra-ai-research-finds-cyber-resilience-lagging-in-the-ai-era). Le chiffre « **2 992 alertes/jour, 63 % non traitées** » est attribué à Vectra par des blogs tiers mais absent de l'extrait lu. | ✅ / 🟡 |
| **Copilotes qui hallucinent / confiance** | SANS *2026 AI Survey* (publié le 13/07/2026) : adoption de l'IA plus rapide que la gouvernance ✅ (https://www.sans.org/white-papers/2026-sans-ai-survey-insights). Selon des extraits, les préoccupations principales seraient « transparence et confiance dans les décisions IA (40 %) », l'évaluation des vendeurs (38 %) et les hallucinations. | ✅ / 🟡 (%) |
| **Agents inconnus / sur‑privilégiés** | Cloud Security Alliance, 21/04/2026 (étude commanditée par Token Security) : **82 %** des entreprises ont des agents IA inconnus, **65 %** ont eu un incident lié à un agent en 12 mois, dont 61 % avec exposition de données. Le décommissionnement des agents est un facteur de risque majeur. Source : https://cloudsecurityalliance.org/press-releases/2026/04/21/new-cloud-security-alliance-survey-reveals-82-of-enterprises-have-unknown-ai-agents-in-their-environments | ✅ |
| Ratio identités non humaines / humains | Selon les sources : 45:1, 80:1, 144:1. Chiffres incohérents, à ne pas citer sans source primaire. | ❓ |
| **Supervision MCP** | BlueRock : 7 000+ serveurs MCP scannés, **36,7 %** avec exposition SSRF potentielle ; exemple de Markitdown MCP permettant de récupérer des credentials IAM via le endpoint de métadonnées AWS. Source : post LinkedIn du chercheur, https://www.linkedin.com/posts/david-o-b2b255165_mcp-furi-bluerock-discovers-an-mcp-security-activity-7419506632595931136-SmPO. Trend Micro : 492 serveurs MCP exposés sans auth, chiffre vu seulement dans des extraits. | ✅ (post) / 🟡 |
| **RAG sous surveillance** | Littérature 2025‑2026 abondante sur le *knowledge poisoning* (un seul document empoisonné peut suffire, article d'avr. 2026) et la fuite via vector store. Pas de statistique d'incidents fiable trouvée. | 🟡 |
| **Hype AI SOC** | Plusieurs blogs affirment que le Gartner *Hype Cycle for Security Operations 2026* place les « AI SOC Agents » au **pic des attentes exagérées**. Seule la page Gartner *Hype Cycle for Agentic AI 2026* a été ouverte (https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai) ; le classement exact n'est pas vérifié. Conséquence pour le pitch : le jury aura vu beaucoup de « AI SOC », il faut **prouver la fiabilité** plutôt que promettre l'autonomie. | 🟡 |

**Lecture.** Les juges attendront un projet qui (a) **réduit le bruit** sans inventer, (b) **contrôle ce que les agents font** et (c) **laisse une trace d'audit**.

---

## 3. Startups Y Combinator positionnées sur ces thèmes

Les pages YC ont été vérifiées le 10/10/2026 ✅. Extraction faite depuis le miroir `yc-oss`, qui peut être incomplet : la liste n'est pas exhaustive.

| Startup | Batch | Positionnement | Thème Track 2 |
|---|---|---|---|
| [Cotool](https://www.ycombinator.com/companies/cotool) | Spring 2025 | Agents IA pour équipes SecOps, copilote qui assemble le contexte entre outils, « alert fatigue » | Copilote SOC |
| [Golf](https://www.ycombinator.com/companies/golf) | Spring 2025 | Visibilité sur le *shadow AI*, contrôle des agents **et du MCP**, politiques, audit trails | Supervision MCP |
| [Alter](https://www.ycombinator.com/companies/alter) | Summer 2025 | **PAM pour agents IA** : chaque tool call authentifié, autorisé au niveau des paramètres, least privilege, audité ; bloque un `DROP TABLE` | Identité / privilèges |
| [Multifactor](https://www.ycombinator.com/companies/multifactor) | Fall 2025 | AuthN/AuthZ/audit zero‑trust pour systèmes multi‑agents | Identité / privilèges |
| [Salus](https://www.ycombinator.com/companies/salus) | Winter 2026 | API qui **inspecte et bloque une action d'agent juste avant exécution** | Contrôle runtime |
| [ContextFort](https://www.ycombinator.com/companies/contextfort) | Summer 2025 | Extension Chrome : détecte quand un agent prend le navigateur, enregistre ses actions, bloque les fuites cross‑site | Supervision agents navigateur |
| [truthsystems](https://www.ycombinator.com/companies/truthsystems) | Summer 2025 | Agent de conformité, guardrails temps réel sur l'usage de la GenAI | Gouvernance |
| [Fabraix](https://www.ycombinator.com/companies/fabraix) | Summer 2026 | Red‑teaming d'agents (produit Nyx). Selon la startup : 78 % de succès d'attaque sur AgentHarm contre 67 % pour GPT‑5.6 Sol | Red team d'agents |
| [OneCLI](https://www.ycombinator.com/companies/onecli) | Summer 2026 | Agents sandboxés par employé ; **les agents ne détiennent jamais les secrets**, injectés au niveau réseau. OSS : https://github.com/onecli/onecli | Secrets des agents |
| [Mount](https://www.ycombinator.com/companies/mount) | Spring 2026 | Assurance responsabilité pour agents IA (prompt injection, fuites…) | Signal marché |
| [OpenHack](https://www.ycombinator.com/companies/openhack) | Fall 2026 | « Always‑on AI security engineer » (scan de code, pentest IA, filtrage des faux positifs) | AppSec IA |
| Autres : Trident (S26, offensif), MindFort (Sp25), GhostEye (S25), Antigen (F25) | — | Sécurité offensive autonome | Contexte |

**Lecture.** Le marché YC converge sur un point : **intercepter l'action d'un agent avant exécution, avec identité et audit**. Les startups vendent un **contrôle** ; aucune de cette liste ne relie explicitement ce contrôle à **la boucle SOC** (alerte, triage sourcé, réponse, mapping ATT&CK/ATLAS/D3FEND). Pour un hackathon blue team, cette jonction est la différenciation possible.

---

## 4. Gagnants de hackathons récents (inspiration et différenciation)

| Hackathon | Projet gagnant / thème | Ce qu'on en retient | Source | Confiance |
|---|---|---|---|---|
| **Solo.io, Hackathon for MCP & AI Agents 2026** (févr.‑avr. 2026), track *Secure & Govern MCP* | Gouvernance MCP Kubernetes‑native : surveille agentgateway/kagent, **scoring de posture centré serveur MCP**, analyse de risque IA (Gemini ou Ollama). Un prix contributeurs récompense aussi agentgateway transformé en « identity‑aware control plane for agents ». | Le *scoring statique* de posture MCP a déjà gagné. Pour se différencier : **détection runtime** (rug pull, appels anormaux) et boucle SOC. | https://www.solo.io/blog/celebrating-the-winners-of-the-2026-hackathon-for-mcp-ai-agents | ✅ |
| **Palo Alto Networks Agentic AI Hackathon** (interne, févr. 2026, 70 équipes) | **SafeContext**, 1er du track « Idea Exploring » : protège les agents contre les menaces web (contenu interprété comme instruction) via réputation d'URL et threat intel, construit avec Google ADK. | Réutiliser la **threat intel classique** pour l'IA plaît aux juges sécurité. | https://jobs.paloaltonetworks.com/en/safecontext-ai-hackathon-winner-palo-alto-networks | ✅ |
| **GitLab AI Hackathon 2026** (Devpost, 7 000 devs, 600+ agents) | « Gitdefender », Google Cloud Grand Prize : trouve et corrige des failles en code review. | Les agents **intégrés à un workflow existant** gagnent face aux chatbots. Critères : technique, design, impact, idée. | https://about.gitlab.com/blog/gitlab-ai-hackathon-2026-meet-the-winners/ | ✅ page / 🟡 détail Gitdefender (extrait) |
| **Lockhart AI Hackathon 2026** | « SOC Copilot » : télémétrie firewall vers renseignement priorisé ; classification par intention adverse ; corrélation ; « trust guardrails, only references verified data » | Le thème **copilote SOC sourcé** est déjà primé, donc concurrence. | Post LinkedIn (auto‑déclaré) | 🟡 |
| **AI SOC Summit hackathon** (2026) | 17 praticiens, 11 « skills » agentiques SOC (triage, hunts, reporting) | Format « skills » réutilisables (cf. `mukul975/Anthropic-Cybersecurity-Skills`) | https://nhimg.org/articles/ai-soc-hackathon-automation-points-to-faster-triage-and-reporting/ | 🟡 |

**Patterns gagnants :** (1) un workflow réel et une démo bout‑en‑bout sur une infra plausible ; (2) des garde‑fous de confiance visibles (sources, abstention) ; (3) un mapping à un framework reconnu ; (4) une idée simple, énonçable en une phrase.

---

## 5. GitHub tendance et sujets qui buzzent

### 5.1 Dépôts (étoiles au 10/10/2026, API GitHub)

**Supervision agents / MCP / prompt injection**
- `NVIDIA/SkillSpector` (~19,8 k★, créé mars 2026) : scanner de sécurité pour *skills* d'agents (prompt injection, exfiltration).
- `snyk/agent-scan` (~3,1 k★, ex‑`invariantlabs-ai/mcp-scan`) : scanner d'agents, serveurs MCP et skills.
- `cisco-ai-defense/mcp-scanner` (~1,1 k★).
- `Tencent/AI-Infra-Guard` (~6,8 k★) : red‑teaming de l'infra IA, scan MCP.
- `IBM/mcp-context-forge` (~4,6 k★) : gateway/registry MCP.
- `luckyPipewrench/pipelock` (~0,9 k★, créé févr. 2026) : « AI agent firewall » MCP/egress, détecte l'exfiltration et le SSRF.
- `hashgraph-online/hol-guard` (~0,8 k★) : « antivirus pour agents » (MCP, skills, secrets).
- `nolabs-ai/nono` (~4,4 k★) : sandbox runtime d'agents zero‑trust.
- `superagent-ai/superagent` (~6,8 k★), `protectai/llm-guard` (~3,2 k★), `guardrails-ai/guardrails` (~7,5 k★), `arcjet/arcjet-js` : détection d'injection et redaction.
- Red team / éval : `NVIDIA/garak` (~9,5 k★), `promptfoo/promptfoo` (~25,9 k★), `meta-llama/PurpleLlama` (~4,4 k★).

**Identités et secrets des agents**
- `onecli/onecli` (~3,6 k★, YC S26) et `Infisical/agent-vault` (Show HN 156 pts) : proxys de credentials qui empêchent l'agent de voir le secret.
- `opena2a-org/agent-identity-management` : IAM pour agents.
- `peg/snare` : **honeytokens/canaries pour agents**. Petit projet (5★) mais idée forte.

**SOC IA**
- `beenuar/AiSOC` (~2,4 k★, mai 2026) : fusion d'alertes, triage par agent LLM, investigation ATT&CK, *decision ledger* rejouable.
- `Vigil-SOC/vigil` (~360★).
- `gensecaihq/Wazuh-MCP-Server` (~250★) : 55 outils MCP sur Wazuh.
- `mukul975/Anthropic-Cybersecurity-Skills` (~34 k★) : 817 skills cyber mappées ATT&CK, NIST CSF 2.0, ATLAS, D3FEND.
- `0x4m4/hexstrike-ai` (~12,6 k★) : MCP offensif ; représente la menace côté attaquant.

**RAG poisoning** (petits dépôts) : `prompt-security/RAG_Poisoning_POC`, `aminrj-labs/mcp-attack-labs` (tool poisoning, cross‑server shadowing, RAG injection), `arsbr/Veritensor`.

### 5.2 Ce qui buzze (HN 2026, presse)

- **OpenClaw** et ses clones (`nanoclaw`, `ironclaw`, `goclaw`) : agents personnels à accès système complet. Instances exposées, fuites de clés, malware dans la supply chain ; « 30 000 instances exposées » selon BitSight via un blog tiers 🟡. Sur HN, « Don't trust AI agents » (nanoclaw, 344 pts) ✅.
- **Moltbook** (réseau social d'agents) : base Supabase mal configurée, environ 1,5 M de tokens d'API exposés (févr. 2026) 🟡, puis rachat par Meta (Axios, HN 554 pts) ✅ titre.
- **Claude Mythos / Glasswing** (HN 1 541 pts) et **GLM 5.2 « Mythos at home »** (HN 1 113 pts) ✅.
- **GitLost** (HN 541 pts) ✅, **Meta rogue agent** (HN 173 pts) ✅.
- « Autonomous cars, drones cheerfully obey prompt injection by road sign » (The Register, HN 220 pts) ✅ titre.
- Show HN : **Claw Patrol** (Deno), « security firewall for agents » ; **OneCLI** ; **Agent Vault** ✅.

---

## 6. Pistes de projet pour le Track 2

Grille : Efficacité défensive 30 % · Valeur analyste 20 % · Fiabilité & contrôle IA 20 % · Intégration technique 15 % · Pitch & démo 15 %. Les notes /5 sont **notre estimation**, pas un barème officiel.

### Piste A (recommandée) : « MCP Sentinel », gateway MCP qui détecte le tool poisoning et alerte le SOC

**Pitch en une phrase.** « Un pare‑feu pour les outils de vos agents IA : il fige la description de chaque outil MCP, détecte toute instruction cachée ou modification, bloque l'appel risqué et ouvre au SOC une alerte expliquée, mappée ATT&CK/ATLAS et D3FEND. »

**Pourquoi maintenant.** Le scénario Microsoft du 30/06/2026 (rug pull de description, puis exfiltration) donne un cas réaliste et sourcé. Les gagnants Solo.io faisaient du *scoring statique*. Les startups YC (Alter, Salus, Golf) vendent le contrôle sans la boucle SOC.

**Fonctionnement.**
1. **Proxy MCP** (Python, SDK MCP officiel) entre l'agent et 2‑3 serveurs MCP de démo : CRM/finance, fetch web, fichiers.
2. **Pinning** des descriptions et schémas (hash et diff à chaque `tools/list`), sur le modèle de mcp-scan. Toute modification post‑approbation déclenche une alerte de rug pull.
3. **Détecteur d'injection dans les métadonnées et les sorties d'outils.** Règles (langage impératif, URL, « ignore previous ») plus un **nouveau modèle** en juge, par exemple Mistral Large 4 en preview API ou Mistral Medium (l'équipe a déjà une clé), avec sortie JSON contrainte. L'argument souveraineté vaut quand les poids de Large 4 seront publiés (annoncés fin octobre ; pas faisable pendant le hackathon).
4. **Politique par agent** (least privilege) : outils autorisés, paramètres et domaines egress, approbation humaine pour les actions à fort impact (ASI02, ASI03/ASI07).
5. **Sortie SOC** : événement JSON vers un mini‑dashboard ou un SIEM (Wazuh ou fichier ECS), qui contient la preuve (diff de description, appel bloqué), le mapping ASI, MITRE ATLAS/ATT&CK et la contre‑mesure **D3FEND**, plus une **timeline** de l'agent.
6. **Honeytoken (bonus)** : un faux secret placé dans le contexte. S'il apparaît dans un appel sortant, l'agent est compromis (idée `peg/snare`).

**Démo (3 min).** Un agent « analyste finance » fonctionne normalement. On modifie la description du serveur « enrichment ». Sans Sentinel, les données partent (on montre le log de l'attaquant). Avec Sentinel, l'appel est bloqué, l'alerte apparaît avec le diff surligné, l'analyste clique « révoquer l'outil ». Ensuite, **taux de détection sur un mini‑benchmark** : cas inspirés de MCPTox (1 312 cas sur 45 serveurs réels selon son abstract 🟡) et de `mcp-attack-labs`, plus des cas bénins pour mesurer les faux positifs.

| Critère | Note /5 | Justification |
|---|---|---|
| Efficacité défensive (30 %) | 4,5 | Bloque une chaîne d'attaque réelle et documentée ; chiffres TP/FP mesurés |
| Valeur analyste (20 %) | 3,5 | Alerte expliquée et mappée ; moins centrée sur le triage quotidien |
| Fiabilité & contrôle IA (20 %) | 4,5 | Contrôle déterministe d'abord (hash, politique), LLM en second ; décision auditée |
| Intégration technique (15 %) | 4 | Protocole MCP réel, sortie SIEM |
| Pitch & démo (15 %) | 4,5 | Avant/après très visuel |
| **Pondéré** | **≈ 4,2** | |

**Périmètre tenable en 36 h** (3‑4 personnes)
- H0‑4 : choix des serveurs MCP de démo, scénario d'attaque écrit, format d'alerte.
- H4‑16 : proxy + pinning/diff + politique (dev 1) ; détecteur règles + LLM (dev 2) ; agent de démo + serveur malveillant (dev 3).
- H16‑24 : dashboard alertes/timeline et mapping ASI/ATLAS/D3FEND (dev 4 ou 3).
- H24‑30 : mini‑benchmark (≈ 50 cas malveillants et 50 bénins), chiffres TP/FP et latence ajoutée.
- H30‑36 : répétition de la démo, slides, plan B vidéo.
- **Hors périmètre :** auth OAuth MCP complète, multi‑tenant, haute dispo.

### Piste B (option sûre) : copilote SOC « zéro affirmation sans preuve »

**Pitch.** « Le copilote qui ne peut rien affirmer sans citer la ligne de log : chaque phrase du rapport de triage pointe vers un événement, un vérificateur rejette ce qui n'est pas soutenu, et le copilote s'abstient quand les preuves manquent. »

**Fonctionnement.** Ingestion d'un jeu d'alertes public : échantillons Wazuh/Sigma, ou un scénario rejoué (par exemple Atomic Red Team), en restant sur des données disponibles. Regroupement des alertes par incident, puis rapport généré par un LLM récent avec des **citations obligatoires `[evt‑id]`**. Un **vérificateur** contrôle chaque phrase contre l'événement cité : second modèle, ou règles sur les champs IP, hash, user. Une **politique d'abstention** s'ajoute. On mesure le **taux d'hallucination** avec et sans vérificateur sur des questions‑pièges (« l'attaquant a‑t‑il exfiltré ? » quand rien ne le montre). L'équipe a déjà construit ce pattern (citations sourcées, vérification, abstention) sur un autre projet ; le transfert de méthode est direct.

| Critère | Note /5 | Justification |
|---|---|---|
| Efficacité défensive (30 %) | 3,5 | Réduit le temps de triage ; ne bloque rien |
| Valeur analyste (20 %) | 4,5 | Douleur n°1 (fatigue d'alertes, confiance) |
| Fiabilité & contrôle IA (20 %) | 4,5 | Hallucinations mesurées, abstention |
| Intégration technique (15 %) | 3,5 | Intégration SIEM réaliste mais simulée |
| Pitch & démo (15 %) | 3,5 | Déjà vu (Lockhart « SOC Copilot », AiSOC, hype Gartner) : il faut un chiffre fort |
| **Pondéré** | **≈ 3,9** | |

**Périmètre en 36 h.** Un seul jeu de données et un seul type d'incident, bien fait. Sorties : métrique d'hallucination avant/après et UI « clic sur citation → log source ».

### Piste C (complément ou plan B) : « Agent Canary », détection d'agents détournés par honeytokens et identités éphémères

**Pitch.** « On plante de faux secrets et de faux documents dans l'environnement des agents. S'ils sont touchés ou exfiltrés, l'agent est compromis : on révoque son identité éphémère et on alerte le SOC. »

**Fonctionnement.** Un broker de credentials (inspiré de OneCLI ou Agent Vault) émet des tokens courts par agent et par tâche. Des **canaries** sont semées dans un RAG (document empoisonné, ASI06) et dans les variables d'environnement. Un détecteur egress et un kill switch complètent le dispositif ; on démontre aussi l'arrêt d'une **cascade** multi‑agents (ASI08). Le LLM sert à générer des leurres crédibles et à résumer l'incident.

| Critère | Note /5 |
|---|---|
| Efficacité défensive (30 %) | 4 |
| Valeur analyste (20 %) | 3 |
| Fiabilité & contrôle IA (20 %) | 4 |
| Intégration technique (15 %) | 3,5 |
| Pitch & démo (15 %) | 4 |
| **Pondéré** | **≈ 3,7** |

**Conseil.** Intégrer C comme **module bonus de A** (étape 6) plutôt que d'en faire un projet séparé.

### Recommandation

**A (+ honeytoken de C)** si l'équipe a au moins 2 profils à l'aise en Python/réseau. Elle tient le plus d'axes du Track 2 (zones 2 et 3), suit l'actualité la plus chaude (MCP) et se distingue des gagnants existants par le runtime et la boucle SOC.
**B** si l'équipe est plutôt analyste/data : moins risqué techniquement, mais il faudra un chiffre d'hallucination convaincant pour sortir du lot.

---

## 7. Limites de cette veille

- Les réseaux sociaux (X, LinkedIn, Reddit) n'ont pas été parcourus directement, faute d'accès sans compte ou à cause de pages de challenge anti‑bot. Le « buzz » repose sur Hacker News et les résultats Google.
- Le miroir YC (`yc-oss`) peut manquer des sociétés ; la recherche par mots‑clés peut en rater d'autres.
- Plusieurs statistiques du marché (Vectra 2 992/63 %, ratios NHI, nombre de CVE MCP, Gartner) ne proviennent que de sources secondaires. Les vérifier avant de les mettre sur une slide.
- Les notes de la grille sont subjectives. La grille officielle ne détaille pas les sous‑critères.
