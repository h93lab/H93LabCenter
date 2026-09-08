# Source of Truth

## 1. Product Identity

The product is a **personal-use AI-powered Mobile Opportunity Intelligence & Project Blueprint Platform** for a solo mobile developer.

It continuously discovers mobile product opportunities, validates them using evidence and competitor/user research, ranks them with deterministic scoring, and converts approved ideas into detailed, versioned, implementation-ready specifications and prototypes.

## 2. Primary User

There is one primary owner/operator. V1 does not implement organizations, teams, invitations, shared workspaces, subscriptions, SaaS billing, tenant switching, or role matrices beyond owner authentication and service-side automation.

## 3. Target Build Output

Downstream mobile projects are assumed to be Flutter applications for Android and iOS. The generated Blueprint must be compatible with any capable AI coding agent. Claude Code is the default downstream profile, but the documents may also be used by Kimi, Codex, Gemini CLI, or other agents.

The platform itself does **not** generate the complete production Flutter application.

## 4. Technology

### Frontend

- React 19.
- Vite.
- TypeScript.
- Tailwind CSS v4.
- shadcn/ui-compatible components.
- Visual reference: `https://github.com/shadcndashboard/shadcndashboard`.
- Cairo font.
- Light and dark mode.
- English-only UI.
- Deployed to Vercel.

### Backend

Supabase owns:

- PostgreSQL database;
- Auth;
- Storage;
- Edge Functions;
- Queues;
- Cron scheduling;
- Vault/server secrets where appropriate;
- pgvector for semantic similarity and clustering support.

### AI

- OpenRouter is the gateway used by application AI workloads.
- Models are selected by AI role, not hardcoded globally.
- Provider fallback and structured output are used where supported.
- Every invocation is measured for tokens, cost, latency, model, provider, prompt version, schema version, and outcome.

## 5. Research Pipeline

The canonical pipeline is:

```text
Source -> Raw Evidence -> Normalized Evidence -> Claim -> Signal -> Signal Cluster
-> Market Opportunity -> Product Concept -> Deep Research -> Score + Confidence
-> Recommendation -> User Decision
```

No step may treat LLM prose as verified market evidence without provenance.

## 6. Discovery Mix

Default discovery allocation:

- Apps: 80%.
- Games: 20%.

These values are settings, not hardcoded constants.

The system is global and must support per-country market scoring. Local opportunities can outrank global opportunities when evidence is strong.

## 7. Opportunity Types

Supported opportunity types include:

- Original Innovation.
- Competitor Improvement.
- Niche Specialization.
- Localization Arbitrage.
- Business Model Innovation.
- Platform Expansion.
- Feature Unbundling.
- Feature Bundling.
- Trend Exploitation.
- Workflow Replacement.

A pure clone with no defensible/evidence-backed wedge is not a valid opportunity.

## 8. Competitor Model

Every deep analysis considers:

- direct competitors;
- indirect competitors;
- substitutes.

Large incumbents create an `incumbent pressure` penalty, but they do not automatically kill an opportunity if a credible niche or wedge exists.

## 9. Evidence & Confidence

Evidence-backed claims use these verification labels:

- `verified` — directly supported by a highly authoritative source or directly observed first-party data.
- `supported` — supported by credible evidence, potentially across multiple sources.
- `inferred` — reasoned from supported evidence but not directly observed.
- `estimated` — a model/provider estimate, visibly labeled.
- `unknown` — insufficient evidence.

Research Confidence is 0–100 and is separate from Opportunity Score.

## 10. Opportunity Recommendations

Allowed recommendation states:

- `STRONG_BUILD`
- `BUILD`
- `VALIDATE_FIRST`
- `WATCH`
- `PASS`
- `KILLED`

A hard kill criterion sets `KILLED` regardless of numeric score.

The daily run is allowed to produce no Idea of the Day. Every local research date receives a `daily_promotions` history record that either references the promoted concept or records why no concept qualified.

## 11. Scoring

Opportunity scores are calculated in deterministic application/database code using a versioned scoring model. The LLM may supply structured factor assessments and evidence references, but it may not directly define the final numeric score.

Apps and games use separate scoring models.

## 12. Historical Behavior

Re-discovery of a semantically equivalent opportunity updates the existing opportunity timeline. Semantic similarity, stable concept attributes, target audience, job-to-be-done, category, and value proposition are used for deduplication.

Score history and evidence history are preserved.

## 13. Blueprint Boundary

Pressing `GO` converts an approved product concept into a `Project` and starts Blueprint generation.

Blueprint includes product, UX, architecture, database/integration guidance, research traceability, business rules, monetization, ASO/launch guidance, tasks, testing, and AI-agent instructions.

Blueprint also includes:

- internal clickable prototype preview based on a structured prototype specification;
- Figma handoff/integration path that can produce/edit design nodes through a supported integration path such as a plugin, without making Figma the canonical source of truth;
- immutable versions and diffs;
- AI-assisted change requests with impact analysis;
- quality gates.

The terminal state is `READY_FOR_DEVELOPMENT`.

## 14. Figma Rule

The canonical source is the Blueprint data/document model. Figma is a generated/handoff representation. If the Blueprint changes, affected prototype artifacts are marked stale until regenerated or reconciled.

Do not assume the standard Figma REST file API can arbitrarily create an editable design from the server. Keep a `FigmaAdapter` boundary so implementation can use supported capabilities such as a user-run Figma Plugin API flow.

## 15. Scope Exclusions

V1 excludes:

- public signup;
- multi-user collaboration;
- SaaS billing for this platform;
- generated production Flutter source code;
- repository management for generated apps;
- CI/CD for generated apps;
- app-store submission automation;
- post-launch analytics for generated apps;
- bug/project-management after Ready for Development;
- unsupervised automated actions that spend beyond configured research/AI budgets.
