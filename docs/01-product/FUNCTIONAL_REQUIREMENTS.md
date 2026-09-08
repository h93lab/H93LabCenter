# Functional Requirements

All requirements are mandatory for V1 unless explicitly marked later-phase.

## Authentication

- **FR-AUTH-001** The system must require owner authentication before any application data is visible.
- **FR-AUTH-002** Public self-registration must be disabled in production.
- **FR-AUTH-003** All user-facing records must be protected by owner RLS policies.
- **FR-AUTH-004** Privileged automation must use server-side credentials unavailable to the browser.

## Research Runs

- **FR-RES-001** The system must schedule a daily research run using the owner-configured timezone/time.
- **FR-RES-002** The owner may trigger a manual research run.
- **FR-RES-003** A run must store start/end time, run mode, config snapshot, budget, source set, market set, status, and aggregate counts.
- **FR-RES-004** Research work must be decomposed into durable jobs.
- **FR-RES-005** Jobs must have idempotency keys and bounded retry behavior.
- **FR-RES-006** A failed source/job must not automatically invalidate successful unrelated source work.
- **FR-RES-007** The run must expose partial/failed status and reasons.
- **FR-RES-008** Budget exhaustion must stop new expensive jobs and mark the run as budget-limited, not failed.

## Evidence

- **FR-EVD-001** Collected evidence must store source, URL/identifier, timestamps, market, language, raw payload/text, normalized payload/text, hashes, and provenance metadata.
- **FR-EVD-002** Evidence records must be immutable except for operational metadata such as parsing status.
- **FR-EVD-003** Claims must reference evidence items.
- **FR-EVD-004** Claims must have verification status and confidence.
- **FR-EVD-005** Contradictory evidence must be representable and must reduce confidence rather than being silently discarded.

## Signals

- **FR-SIG-001** The system must classify normalized evidence into the canonical signal taxonomy.
- **FR-SIG-002** Signals must include direction, magnitude/strength where measurable, observed time, market, category, confidence, and evidence references.
- **FR-SIG-003** Similar signals must be clusterable using semantic and structured features.
- **FR-SIG-004** Every signal shown in UI must drill down to evidence/claims.

## Opportunities and Concepts

- **FR-OPP-001** Signal clusters may produce one or more market opportunities.
- **FR-OPP-002** Opportunities must store problem, target audience, why-now rationale, opportunity type, markets, category, first seen, last seen, and history.
- **FR-OPP-003** Opportunities must be semantically deduplicated before insertion.
- **FR-OPP-004** A re-detected existing opportunity must update its timeline and evidence links.
- **FR-OPP-005** An opportunity may produce multiple product concepts.
- **FR-OPP-006** A product concept must include value proposition, wedge, target user, MVP thesis, monetization candidates, and major risks.
- **FR-OPP-007** A concept with no credible differentiation must not receive BUILD/STRONG_BUILD.

## Competitor Intelligence

- **FR-COMP-001** Deep research must identify direct, indirect, and substitute competitors.
- **FR-COMP-002** Persistent competitor identity must be separated from time-specific snapshots.
- **FR-COMP-003** Competitor snapshots may include ratings, review count, ranking, pricing, features, supported platforms/markets, update activity, and sourced estimates.
- **FR-COMP-004** Metrics without reliable evidence must remain unknown.
- **FR-COMP-005** The system must calculate/display incumbent pressure separately from broad competition.

## Review Mining

- **FR-REV-001** The system must analyze available review/user-voice material into complaint, request, pricing objection, UX friction, reliability issue, localization issue, praise, and other defined clusters.
- **FR-REV-002** Review clusters must store sample size/coverage and confidence.
- **FR-REV-003** The UI must never imply a percentage is representative of the whole market if it is calculated only from a sampled subset.
- **FR-REV-004** Evidence excerpts must be short and provenance-linked; do not copy large copyrighted review corpora into the application unnecessarily.

## Scoring

- **FR-SCR-001** The final Opportunity Score must be calculated by versioned deterministic code.
- **FR-SCR-002** Apps and games must use separate score models.
- **FR-SCR-003** Global and market-specific scores must be supported.
- **FR-SCR-004** Score factors, normalized values, weights, evidence/confidence contribution, and scoring-model version must be persisted.
- **FR-SCR-005** Research Confidence must be stored independently of Opportunity Score.
- **FR-SCR-006** Hard kill criteria must be evaluated before final recommendation.
- **FR-SCR-007** Score history must be retained.

## Recommendations

- **FR-REC-001** Recommendations are STRONG_BUILD, BUILD, VALIDATE_FIRST, WATCH, PASS, or KILLED.
- **FR-REC-002** Recommendation logic must consider opportunity score, research confidence, kill criteria, and unresolved critical unknowns.
- **FR-REC-003** The daily run may promote zero or one Idea of the Day.
- **FR-REC-004** Idea of the Day must satisfy configured minimum score and confidence thresholds and have no hard kill.
- **FR-REC-005** The optional Executive Brief must summarize verdict, why now, strongest evidence, biggest risk, best market, wedge, monetization, MVP, and validation priority.
- **FR-REC-006** Each local research date must create exactly one daily promotion record, either referencing the promoted concept or explaining why no concept qualified.

## Blueprint

- **FR-BP-001** GO creates a Project from a selected product concept.
- **FR-BP-002** Project creation must snapshot the exact source concept/research state used for the GO decision.
- **FR-BP-003** Blueprint generation must produce structured entities plus Markdown documents.
- **FR-BP-004** Blueprint generation must be staged across product, UX, technical, business, research traceability, tasks/tests, and consistency review.
- **FR-BP-005** Blueprint must be Flutter-aware and target Android + iOS.
- **FR-BP-006** Blueprint must not generate the final production Flutter codebase.
- **FR-BP-007** Every published Blueprint version must be immutable.
- **FR-BP-008** The current working draft may be edited before publication.
- **FR-BP-009** AI chat changes must produce impact analysis before application.
- **FR-BP-010** Applying a change must update affected structured entities/documents in one version transaction.
- **FR-BP-011** A change must run consistency checks before a new version becomes published.
- **FR-BP-012** The system must produce human-readable diffs between Blueprint versions.

## Prototype/Figma

- **FR-PROTO-001** Blueprint must produce a structured prototype specification containing screens, states, components, navigation/actions, and flows.
- **FR-PROTO-002** The platform must render a lightweight clickable internal preview from the prototype spec.
- **FR-PROTO-003** High-fidelity editable Figma output must be implemented behind a `FigmaAdapter` boundary.
- **FR-PROTO-004** A Figma artifact must reference its source Blueprint version.
- **FR-PROTO-005** Blueprint changes that affect screens/flows must mark the relevant prototype artifact stale until reconciled.
- **FR-PROTO-006** Figma data must never override canonical Blueprint data automatically.

## Quality and Export

- **FR-QLT-001** Blueprint quality gates must evaluate product coverage, UX/state coverage, traceability, technical consistency, security, analytics, tests, and prototype consistency.
- **FR-QLT-002** A project cannot become Ready for Development until mandatory gates pass.
- **FR-EXP-001** The owner must be able to export the latest approved Blueprint as a structured folder/ZIP.
- **FR-EXP-002** Export must include agent-agnostic instructions and a Claude-oriented adapter without duplicating canonical requirements.
- **FR-EXP-003** Export must include checksums/manifest and Blueprint version metadata.

## AI Administration

- **FR-AI-001** Each AI role must be configurable with model, provider preferences, fallbacks, temperature/reasoning configuration where applicable, token limits, budget, prompt version, and output schema.
- **FR-AI-002** Every invocation must store token usage, cost, latency, status, role, model, provider, prompt version, and schema version.
- **FR-AI-003** Structured outputs must be schema-validated before persistence.
- **FR-AI-004** Invalid AI output must use bounded retries and visible failure handling.
- **FR-AI-005** Budget checks must run before expensive calls.
