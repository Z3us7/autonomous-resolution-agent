# Autonomous Customer Resolution Agent

**Agentic AI Hackathon — Tech Zephyr 4.0 | IIT Bhubaneswar**
**Track 3: Smart Automation | Problem Statement 5**

---

##  Problem & Solution Brief

### Problem Statement
Customer support in e-commerce is a high-friction, high-cost workflow. Traditional chatbots follow static scripts and fail when real-world constraints (inventory shortages, policy violations, fraudulent patterns) block the "happy path." They cannot reason, adapt, or act autonomously — they simply give up and escalate everything to humans.

### Target Users
- **E-commerce enterprises** drowning in Tier-1 support tickets (refunds, replacements, cancellations).
- **End customers** who want instant resolution without waiting in a support queue.

### Why This Requires an Agentic Solution
A standard LLM or RAG pipeline generates text — it doesn't *act*. This problem demands a system that:
1. **Retrieves** live data from multiple enterprise systems (Customer DB, Order DB, Inventory).
2. **Reasons** over that data using fraud detection and policy evaluation.
3. **Acts** by executing state-changing operations (processing refunds, issuing credits).
4. **Adapts** when a constraint blocks the original plan (e.g., policy denies refund → auto-switch to store credit).
5. **Verifies** that the executed action actually committed.
6. **Escalates** only when the system genuinely cannot resolve the issue safely.

### Proposed Solution
An **LLM-powered autonomous agent** that operates in a continuous ReAct (Reasoning + Acting) loop. The agent leverages the **OpenRouter API** with a highly resilient cascading fallback mechanism (seamlessly rotating through multiple free-tier LLMs like `google/gemma-4-31b-it:free` and `meta-llama/llama-3.1-8b-instruct` to bypass upstream provider rate limits). 

The LLM receives a free-text customer message, dynamically decides which enterprise tool to call, receives the result, reasons about it, and calls the next tool — continuing this loop until the issue is resolved or safely escalated.

### Expected Impact
- **80% reduction** in Tier-1 support ticket volume.
- **Sub-30-second resolution** for standard refund/replacement cases.
- **Zero false approvals** for flagged fraud accounts (serial refunders are auto-escalated).
- **100% Uptime** via our cascaded LLM rotation system.

---

##  System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js + React)                   │
│         (Premium Glassmorphic Product RED Aesthetic)            │
│                                                                 │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │  💬 Customer  │  │ 🧠 Agent Thought  │  │  📊 Live System  │  │
│  │    Request    │  │     Process       │  │      State       │  │
│  └──────────────┘  └───────────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ SSE (Server-Sent Events)
                             │ Real-time streaming of agent logs
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API GATEWAY (Next.js Route)                    │
│           Rate Limiter (5 req/min per IP)                       │
│           Input Validation & Sanitization                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AGENT CONTROLLER (Orchestrator)                    │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              ReAct Loop (max 10 iterations)              │  │
│   │                                                          │  │
│   │  User Message → LLM → Tool Call → Result → LLM → ...    │  │
│   │                                                          │  │
│   │  States: IDLE → GATHERING → CHECKING_FRAUD →             │  │
│   │          CHECKING_POLICY → EXECUTING → VERIFYING →       │  │
│   │          RESOLVED / ESCALATED                            │  │
│   │                                                          │  │
│   │  Adaptation: If policy blocks → try alternative actions  │  │
│   │  Failure:    If fraud CRITICAL → block & escalate        │  │
│   └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Tool Dispatch & Orchestration
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              OPENROUTER CLIENT (Resilient Backend)              │
│                                                                 │
│   Primary: google/gemma-4-31b-it:free                           │
│   Fallback 1: meta-llama/llama-3.1-8b-instruct                  │
│   Fallback 2: mistralai/mistral-nemo:free                       │
│                                                                 │
│   * Automatically rotates LLMs if upstream providers hit        │
│     rate limits (429 errors), guaranteeing 100% uptime.         │
└────────────────────────────┬────────────────────────────────────┘
                             │ Function Calls mapped to OpenAI schema
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE TOOLS (Simulated)                  │
│                                                                 │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  CustomerService │  │  OrderService  │  │  PolicyEngine    │  │
│  │  (Database)      │  │  (Database +   │  │  (Business Rules)│  │
│  │                  │  │   Inventory)   │  │  30-day window,  │  │
│  │  - getCustomer() │  │  - getOrder()  │  │  tier-based      │  │
│  │  - getByEmail()  │  │  - getByCustom │  │  eligibility     │  │
│  │                  │  │  - checkInv()  │  │                  │  │
│  └─────────────────┘  └────────────────┘  └──────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  FraudDetector   │  │ ActionExecutor │  │ VerificationSvc  │  │
│  │  (Risk Scoring)  │  │ (State Change) │  │ (Post-Execution) │  │
│  │                  │  │                │  │                  │  │
│  │  6-parameter     │  │ - refund()     │  │ - verifyAction() │  │
│  │  scoring model:  │  │ - replace()    │  │   Confirms DB    │  │
│  │  - flagged?      │  │ - storeCredit()│  │   state change   │  │
│  │  - refund ratio  │  │                │  │                  │  │
│  │  - account age   │  │                │  │                  │  │
│  │  - order value   │  │                │  │                  │  │
│  └─────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Diagram Key
| Component | Role |
|-----------|------|
| **Agent Controller** | Orchestrates the ReAct loop, dispatches tool calls, manages state transitions |
| **OpenRouter Client** | Intelligent API wrapper that intercepts rate-limit errors and automatically falls back to alternative free-tier models (Gemma, LLaMA, Mistral). |
| **Tools (6 services)** | Simulated enterprise APIs: Customer DB, Order DB, Policy Engine, Fraud Detector, Action Executor, Verification Service |
| **Memory/State** | Conversation history carries full context across loop iterations |
| **Planning & Adaptation** | LLM dynamically plans the next action based on tool results (no hardcoded order). If a refund is denied, it autonomously offers store credit. |
| **Evaluation/Verification** | VerificationService confirms that executed actions actually committed in the DB |
| **Human Interaction** | Escalation path — agent explicitly hands off to human when fraud is CRITICAL or constraints are unresolvable |
| **Failure Handling** | Rate limiter (API abuse), cascaded LLM fallbacks (Upstream 429s), max loop bound (infinite loop), fraud blocking (serial refunders) |

---

##  Deployment / Runnable Version

### Live Deployed Application
> **🌐 [https://autonomous-resolution-agent-rho.vercel.app/](https://autonomous-resolution-agent-rho.vercel.app/)**

Judges can interact with the system directly in their browser. No setup required.

### Local Setup (Alternative)
If you prefer to run locally:

```bash
# 1. Clone the repository
git clone https://github.com/Z3us7/autonomous-resolution-agent.git
cd autonomous-resolution-agent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create environment file
echo "OPENROUTER_API_KEY=your_api_key_here" > .env.local

# 4. Run the development server
npm run dev

# 5. Open http://localhost:3000
```

### Getting an OpenRouter API Key
1. Go to [OpenRouter Settings](https://openrouter.ai/settings/keys)
2. Click "Create Key"
3. Copy the key and paste it in `.env.local`

---

##  Source Code Structure

```
agentic-support-bot/
├── src/
│   ├── agent/
│   │   ├── agent-controller.ts    # Core orchestrator (ReAct loop)
│   │   └── openrouter-client.ts   # OpenRouter API client w/ Fallbacks
│   ├── tools/
│   │   ├── customer-service.ts    # Customer database (simulated)
│   │   ├── order-service.ts       # Order + Inventory database
│   │   ├── fraud-detector.ts      # 6-parameter fraud scoring
│   │   ├── policy-engine.ts       # Business rule enforcement
│   │   ├── action-executor.ts     # Executes refunds, credits
│   │   └── verification-service.ts# Post-execution verification
│   ├── types/
│   │   ├── models/
│   │   │   ├── customer.ts        # Customer domain model
│   │   │   ├── order.ts           # Order domain model
│   │   │   ├── inventory.ts       # Inventory domain model
│   │   │   ├── action.ts          # Action/Resolution types
│   │   │   └── fraud.ts           # Fraud assessment model
│   │   ├── errors.ts              # Result<T,E> error handling
│   │   └── interfaces.ts          # Tool interface contracts
│   └── app/
│       ├── page.tsx               # 3-panel dynamic dashboard UI
│       ├── globals.css            # Product RED Glassmorphism theme
│       ├── layout.tsx             # Root layout
│       └── api/agent/route.ts     # SSE streaming API (rate-limited)
├── __tests__/
│   └── tools/
│       ├── fraud-detector.test.ts # TDD tests for fraud logic
│       └── policy-engine.test.ts  # TDD tests for policy logic
├── .env.local                     # API key (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md                      # This file
```

---

##  Testing

We followed Test-Driven Development (TDD) for the core business logic:

```bash
npm run test
```

**Test Coverage:**
- `FraudDetector`: 5 test cases covering LOW, MEDIUM, HIGH, CRITICAL risk levels and flagged accounts.
- `PolicyEngine`: 4 test cases covering refund window, premium tier override, and alternative action suggestions.

---

##  Demo Video Scenarios

The demo video shows one complete workflow for each scenario:

### Scenario 1: Normal Customer (Adaptation)
**Goal** → Customer requests refund → **Decision** → Agent checks fraud (LOW risk) → checks policy (DENIED: past 30-day window) → **Adaptation** → Agent switches to Store Credit → **Action** → Executes store credit → **Verification** → Confirms state change → **Final Outcome** → Resolved.

### Scenario 2: Serial Refunder (Failure Handling)
**Goal** → Customer requests refund → **Decision** → Agent checks fraud (CRITICAL: already flagged, serial refunder) → **Failure/Unexpected Condition** → Agent blocks the action → **Final Outcome** → Escalated to human specialist.

---

##  Safety & Guardrails

| Feature | Implementation |
|---------|---------------|
| **LLM Failover** | Auto-rotates through 5 different OpenRouter models if upstream providers return 429 quota exhaustion errors. |
| **Rate Limiting** | 5 requests per minute per IP to prevent Denial of Wallet attacks. |
| **Loop Bound** | Maximum 10 LLM iterations (prevents infinite reasoning loops) |
| **Fraud Detection** | 6-parameter scoring model blocks serial refunders before any action is taken |
| **Input Validation** | API route strictly validates request bodies before processing |
| **Error Escalation** | Any LLM or tool error gracefully escapes the loop and escalates to human review |
| **Contract-First Design** | TypeScript strict mode ensuring payload integrity between AI and the business logic layer. |

---

##  Dependencies

| Package | Purpose |
|---------|---------|
| `next@16.3.5` | Full-stack React framework (frontend + API routes) |
| `react@19` | UI rendering |
| `typescript@5` | Type safety |
| `tailwindcss@4` | Utility-first CSS |
| `vitest@5` | Unit testing framework |

---

##  Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | API key from [OpenRouter](https://openrouter.ai/settings/keys) |

Create a `.env.local` file in the project root:
```
OPENROUTER_API_KEY=your_key_here
```

>  Never commit `.env.local` to version control. It is already safely isolated in `.gitignore`.
