# Consigne globale — Hackathon Secure Horizons (ESSEC, 10–11 octobre 2026)

## Track 2 — AI for Security & Secure AI: Defenders Augmented (résumé)

Axes : (1) copilote SOC fiable, sans hallucinations ; (2) supervision MCP ; (3) identité, secrets et privilèges des agents ; (4) RAG sous surveillance (anti‑leak, anti‑poisoning).

Grille : Efficacité défensive 30 % · Valeur analyste 20 % · Fiabilité & contrôle IA 20 % · Intégration technique 15 % · Pitch & démo 15 %.

---

# Track 1 — Fintech Security: Guardians of Value

<aside>
💡

**Every second, millions of transactions flow through the system. A few of them are fraudulent, and it's up to you to spot them before it's too late.** Voice deepfakes, AI-industrialized scams, DeFi exploits, agents handling money: build the monitoring and response tools that protect value, from traditional banking to DeFi.

</aside>

# Problem & stakes

Finance is attackers' favorite playground, because that's where the money is. On the defense side, three tensions dominate in 2026:

- **Drowning analysts.** Generative AI industrializes phishing, fake documents and cloned voices. Fixed-rule engines can no longer keep up and flood fraud and compliance teams with false positives.
- **AI agents handling money.** Agents able to initiate payments or orders are emerging. The risk: a low-privilege research agent, manipulated by a booby-trapped document, instructs a financial agent to execute a transaction. Without verification of the chain of authority or supervision, the action goes through (OWASP ASI03 and ASI07).
- **Incidents to report fast.** DORA requires financial players, including MiCA-licensed crypto service providers, to quickly detect, classify and report their major ICT incidents. In DeFi, an exploit plays out in minutes: without real-time monitoring or a response plan, the treasury is lost.

On top of that comes pressure from insurers, who increasingly exclude incidents linked to uncontrolled AI. Winning solutions must be effective **and** explainable to a regulator, an auditor or an insurer.

# Suggested innovation areas

## 1. The AML/CFT analyst's workstation

Detect money-laundering patterns and money-mule networks, then help the analyst decide quickly and justify the decision.

- *Leads*: graph machine learning on transaction flows, anomaly detection, explainable risk scoring, alert prioritization and case management, measured reduction of false positives.
- *NIST CSF functions*: Detect, Respond.

## 2. Anti-fraud SOC in the age of generative AI

Spot account takeovers, payment scams and CEO fraud using cloned voices, and trigger a proportionate response.

- *Leads*: behavioral signals (device, geolocation, browsing patterns), detection of falsified KYC documents, contextual analysis of an unusual transfer, graduated automated response (step-up authentication, hold, freeze, customer alert).
- *NIST CSF functions*: Detect, Respond.

## 3. Supervision and containment of financial AI agents

Give the security team full visibility into what money-handling agents are doing, and the ability to stop them.

- *Leads*: logging of every agent action with its chain of authority (which human or agent requested it), detection of transactions outside the usual scope, very short-lived and revocable authorization tokens, automatic kill switch above a risk threshold, human validation for sensitive actions.
- *NIST CSF functions*: Identify, Detect, Respond.

## 4. Detection and incident response: DeFi and DORA

Monitor protocols and infrastructure in real time, and turn an incident into a coordinated response and a compliant report.

- *Leads*: on-chain monitoring of a deployed contract (for example on the Avalanche Fuji testnet) to spot an exploit in progress, response playbook (contract pause, alerts, fund tracing), automatic incident classification against DORA criteria and pre-filled reporting, mapping of dependencies on critical third-party providers.
- *NIST CSF functions*: Detect, Respond, Recover.

# Expected deliverables

In addition to the common deliverables (repo, demo video, pitch deck, defense sheet):

- **A working end-to-end PoC**: from detection to response, on a concrete fraud or incident scenario (synthetic or replayed data).
- **A response playbook**: who gets alerted, which actions are automated, which remain human, how it is documented.
- **A "compliance" slide**: how your solution fits the regulatory framework (DORA, AML/CFT, MiCA or AI Act as relevant) and how an auditor could verify its decisions.

# Evaluation grid

| Criterion | Weight | What the jury looks at |
| --- | --- | --- |
| **Detection effectiveness** | 30% | Precision, false positive rate, time to detect, measured on a realistic scenario. |
| **Response quality** | 20% | Is the response proportionate, actionable and useful to the analyst? |
| **Feasibility & technical integration** | 20% | Does the PoC work? Would it integrate with the tools of a bank, a fintech or a protocol? |
| **Compliance & explainability** | 15% | Are decisions traceable and defensible before a regulator or an auditor? |
| **Pitch & demo** | 15% | Clarity, convincing demo, time management and handling of questions. |

# Who supports you

- **Team1 Avalanche**: on-chain monitoring, DeFi incident response, Avalanche ecosystem.
- **KPMG**: fraud, AML/CFT, incident response and DORA resilience.
- **Kryptosphère France**: applied cryptography, DeFi and protocol security.
- **Utopia**: roaming AI mentors (detection ML, LLMs, agents).
- **AWS**: cloud credits available to host your PoCs.

# Tips from the organizing team

- Pick **one** fraud or incident scenario and handle it perfectly, from alert to response.
- Show numbers, even on synthetic data: detection rate, false positives, time saved for the analyst.
- A fintech jury will always ask: "What if your model is wrong, who is responsible?" Prepare your answer.