# AI Roles and Responsibilities

## Research Roles

### signal_classifier
Input: normalized evidence fragments. Output: zero or more taxonomy signals with evidence mapping. Must not create unsupported numeric trends.

### claim_extractor
Input: evidence. Output: atomic claims, claim type, verification class candidate, source relationship.

### signal_cluster_analyst
Input: semantically retrieved related signals. Output: cluster title, summary, shared mechanism, outlier IDs, potential market implications.

### opportunity_generator
Input: signal cluster + evidence summaries. Output: market opportunities, not full product specs.

### concept_generator
Input: one market opportunity + competitor/user-gap context. Output: multiple differentiated product concepts where justified.

### competitor_analyst
Input: candidate concept + competitor evidence. Output: direct/indirect/substitute classification, feature/positioning synthesis, incumbent pressure factors.

### review_miner
Input: review/user-voice sample. Output: constrained review classifications and cluster-ready normalized themes.

### market_analyst
Input: concept + market-specific evidence. Output: structured factor assessments for demand, trend, gap, localization, competition and key unknowns.

### monetization_distribution_analyst
Input: concept + competitor pricing/channel evidence. Output: monetization candidates, unit-economics risks, distribution channels, acquisition constraints.

### risk_analyst
Input: full deep-research package. Output: risks, kill-rule assessments, critical unknowns, policy/dependency concerns.

### dedupe_adjudicator
Used only in ambiguous semantic-similarity cases. Must choose `same`, `related_but_distinct`, or `distinct` with structured reasons.

### final_judge
Input: deterministic scores/confidence, factor evidence, risk/kill results. Output: recommendation rationale and validation priorities. It does **not** calculate the numeric score.

### executive_brief_writer
Input: already completed analysis. Output: concise decision brief. Cannot introduce new claims.

## Blueprint Roles

### blueprint_product_architect
Creates product definition, requirements, features, business rules, decisions, scope, monetization assumptions.

### blueprint_ux_architect
Creates information architecture, user flows, screen inventory, screen states, interaction requirements, accessibility requirements.

### blueprint_technical_architect
Creates Flutter-aware architecture/integration/data/security/analytics guidance without writing the production app.

### blueprint_business_architect
Creates monetization detail, ASO, launch/validation guidance grounded in research.

### blueprint_task_planner
Turns stable requirements/screens/rules into ordered implementation tasks and test obligations.

### prototype_spec_generator
Creates machine-readable internal/Figma prototype spec from the accepted Blueprint entities.

### consistency_reviewer
Finds contradictions, missing references, orphan entities, missing states, undefined navigation, unsupported decisions, data mismatches, security gaps, and incomplete tests.

### change_manager
Parses a requested Blueprint change, calculates affected artifacts, proposes atomic changes, and explains impacts. It never directly mutate published versions.

## Role Isolation

Each role sees only required context. Avoid passing all raw evidence to every role. Use IDs, summaries, and targeted evidence retrieval to reduce cost and prompt injection surface.
