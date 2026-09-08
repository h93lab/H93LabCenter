# Architecture and Product Decisions

This file records decisions that constrain implementation. Do not silently reverse them.

| ID | Decision | Rationale |
|---|---|---|
| ADR-001 | Personal-use only in V1. | Avoid premature SaaS tenancy, billing, and collaboration complexity. |
| ADR-002 | React 19 + Vite + TypeScript frontend. | Matches the chosen shadcndashboard reference and Vercel deployment. |
| ADR-003 | `shadcndashboard/shadcndashboard` is the primary UI reference. | User requires the same design language, controls, colors, and overall style. |
| ADR-004 | Cairo is the UI font, English is the product language, light/dark are mandatory. | Explicit product requirement. |
| ADR-005 | Supabase is the full backend system of record. | Centralizes DB, auth, jobs, functions, storage, security, and scheduling. |
| ADR-006 | OpenRouter is the AI gateway. | Enables model portability, provider routing, fallbacks, and role-specific model selection. |
| ADR-007 | Research is evidence-first. | LLM outputs alone are not reliable market facts. |
| ADR-008 | Opportunity Score is deterministic and versioned. | Prevent opaque “AI score” behavior and preserve comparability. |
| ADR-009 | Research Confidence is independent of Opportunity Score. | A promising idea can have weak evidence, and a mediocre idea can be known with high confidence. |
| ADR-010 | Apps and games have separate scoring models. | Their economics, retention, distribution, and production factors differ materially. |
| ADR-011 | Daily discovery may return no promoted idea. | Prevent forced low-quality recommendations. |
| ADR-012 | Re-discovered opportunities are deduplicated and tracked historically. | Preserve trend evolution and avoid noisy duplicate ideas. |
| ADR-013 | Competitors include direct, indirect, and substitutes. | Users choose among solution approaches, not only app-category peers. |
| ADR-014 | Pure clones without a wedge are rejected. | The system is intended to find buildable commercial opportunity, not cosmetic copying. |
| ADR-015 | Local-market and localization-arbitrage opportunities are first-class. | Market gaps are often country/language/culture specific. |
| ADR-016 | AI receives no automatic opportunity bonus. | AI is a means, not evidence of market value. |
| ADR-017 | Revenue/download numbers must be sourced estimates or unknown. | Avoid false precision. |
| ADR-018 | Hard kill criteria override scores. | Safety, legality, platform dependence, economics, or feasibility can make a high-scoring concept inappropriate. |
| ADR-019 | Consumer-first research allocation with selective mobile B2B. | Best fit for app-store distribution and solo development. |
| ADR-020 | Hardware-dependent ideas are allowed but penalized for testing/maintenance burden. | Avoid unnecessarily excluding strong opportunities while modeling execution cost. |
| ADR-021 | GO creates a Project; Blueprint ends at Ready for Development. | Keeps the platform focused on discovery, decision, and specification. |
| ADR-022 | Blueprint generates documentation and prototypes, not production Flutter code. | Explicit scope decision. |
| ADR-023 | Flutter is the default mobile implementation profile. | All downstream mobile projects are expected to use Flutter. |
| ADR-024 | Blueprint is AI-agent agnostic; Claude Code is the default downstream adapter. | Prevent vendor lock-in while preserving a strong default workflow. |
| ADR-025 | Blueprint edits are transactional change requests with impact analysis. | Prevent document drift and contradictions. |
| ADR-026 | Published Blueprint versions are immutable snapshots. | Enables reliable diffing and reproducibility. |
| ADR-027 | Internal prototype is lightweight; Figma handles high-fidelity editable design. | Avoid building a Figma clone inside the platform. |
| ADR-028 | Figma integration uses an adapter; Figma is not canonical. | Figma write capabilities may require a plugin/user-context path rather than server REST writes. |
| ADR-029 | Cron triggers orchestration; durable Queues process research jobs. | Avoid long monolithic scheduled functions and improve retries/resilience. |
| ADR-030 | Research jobs are idempotent. | Required for safe retries and queue semantics. |
| ADR-031 | AI processing escalates cheap -> expensive. | Optimize cost while reserving strong reasoning for high-value work. |
| ADR-032 | Every AI call records cost and execution metadata. | Budget control and debugging are product requirements. |
| ADR-033 | External source collection must respect access controls and terms. | The system must not bypass CAPTCHAs, authentication, robots restrictions, or prohibited automation. |
| ADR-034 | Provider/source adapters isolate vendor-specific formats. | Allows free-first MVP sources and later paid intelligence providers without redesigning the domain model. |

## H93Lab Center implementation decisions

| ID | Decision | Rationale |
|---|---|---|
| ADR-035 | Build the new application in H93LabCenter, reusing the reconciled Supabase foundation schema. | The owner explicitly requested a fresh implementation while retaining the existing tables. The old application is not modified. |
| ADR-036 | Use an independent local Supabase project, API port 55321. | Protect existing development data and make destructive test isolation explicit. |
| ADR-037 | Use strict runtime contracts in `schemas/runtime/`, generated from shared Zod definitions. | Provider output drift was caught in live testing. Fixed fields, canonical taxonomies and explicit evidence enums prevent invalid outputs from being persisted. Existing supplied schemas remain product reference contracts; runtime field aliases map explicitly in pipeline persistence. |
| ADR-038 | Missing factor evidence remains an explicitly unverified assessment capped at 50. | Do not force invented references for technical or localization judgments. Factual competitor identity still requires evidence. |
| ADR-039 | Document edits enter the same impact-preview change workflow as chat edits. | Keep structured entities, Markdown and prototypes coherent; edits do not silently mutate published artifacts. |
| ADR-040 | Each Figma version imports into a new dedicated page. | Preserve manual design edits and unrelated nodes. A receipt records node mappings; it is identified as user-reported, not independent verification. |
| ADR-041 | Node local HTTP server uses the same shared handlers as Supabase Edge Functions. | Fast local debugging without introducing a separate production backend. Production jobs process one stage per worker request. |
| ADR-042 | Keep uncertain provider charges conservatively reserved in the ledger. | An interrupted network request must not create unbounded retry spend. Such entries remain distinguishable from successful measured usage. |

| ADR-043 | Separate opportunity/concept dedupe into one queued job per candidate. | Keep AI stages bounded and cache intermediate adjudications before persistence. |
| ADR-044 | Fence job completion by claim attempt and preserve cancellation. | A stale worker must not overwrite a newer attempt or resurrect cancelled work. |
| ADR-045 | Bundle Edge dependencies locally with pinned esbuild before serving/deploying. | Avoid runtime dependency downloads and provide a repeatable single-file deployment artifact. |
| ADR-046 | Publish analysis as one fenced transaction linked to its durable job; generate a Blueprint version and its review job in one transaction. | Invalid analysis and retried workers must not leave usable partial recommendations or duplicate versions. |
| ADR-047 | A zero budget permits only catalog-confirmed free calls; optional per-role daily spend and daily call limits remain atomic with workspace caps. | Distinguish zero from missing settings and bound free-model request volume. |
| ADR-048 | Evaluate the seven fixed hard kill rules exactly once; unknown evidence is explicit and prevents a build recommendation. | Omitted risk categories must not imply safety or feasibility. |
| ADR-049 | Normalized factor rubric 1.1 makes higher always more favorable; competition measures attractiveness and game content measures inverse ongoing burden. | Prevent risk from being rewarded as opportunity. Existing snapshots retain their original rubric. |
| ADR-050 | Owner-imported CSV/JSON reviews and small validation records are approved extensions of the decision workspace. | Preserve provenance and provenance limitations; no synthetic live reviews or automatic score changes. See the decision workspace addendum. |
| ADR-051 | Requested market and observed source coverage are distinct; retain support, contradiction, context and estimate relationships. | A GLOBAL request does not turn a US storefront sample into global evidence. |
| ADR-052 | Headless features explicitly start `data.notes` with `Headless:`; all visible features need typed requirement/UX links and executable, reachable navigation. | Validate the graph deterministically before relying on an AI consistency review. |
| ADR-053 | Publishing requires a scanned, generated ZIP for the exact version in private storage. | Ready for Development requires a usable handoff. Historical published versions remain immutable. |
