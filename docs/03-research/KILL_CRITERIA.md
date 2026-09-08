# Kill Criteria and Risk Policy

## Purpose

Kill criteria prevent a superficially high score from producing a build recommendation when a structural blocker exists.

## Hard Kill Categories

### Legal / Prohibited
- illegal product/service in intended market;
- clearly prohibited store category/use;
- product concept materially relies on infringement/counterfeit/deceptive behavior.

### Unavailable Critical Dependency
- core function depends on an unavailable API/data license;
- required platform capability cannot be accessed by third-party apps;
- dependency would require bypassing access controls/terms to work.

### Unsustainable Unit Economics
- unavoidable per-user infrastructure/AI/data cost reasonably exceeds plausible revenue under the proposed model, with no viable redesign.

### No Credible Wedge
- concept is effectively a clone and deep research finds no evidence-backed differentiation/distribution/localization/business-model advantage.

### Extreme Solo Maintenance Burden
- core product requires continuous human moderation/operations/content production at a scale incompatible with the owner model and cannot be automated safely.

### Severe Platform/Policy Risk
- core behavior is highly likely to violate App Store/Google Play rules or depends on unstable behavior that platforms actively restrict.

### Unmanageable Safety/Liability
- the product's core value requires high-stakes medical/legal/financial/safety decisions beyond the defined risk appetite and cannot be reframed safely.

## High-Risk but Not Automatic Kill

Apply penalties/extra validation to:
- medical/wellness;
- mental health;
- finance/investment;
- crypto;
- kids/minors;
- dating;
- legal information;
- security/VPN;
- precise location tracking;
- hardware/health data;
- regulated professions.

## Default Excluded Discovery Categories

Do not proactively recommend:
- gambling;
- adult sexual services/content products;
- malware/surveillance/credential theft;
- illegal drug/weapon commerce;
- deceptive or predatory financial products;
- explicitly illegal services.

## Kill Assessment Record

Each criterion evaluation stores:
- rule key/version;
- result pass/fail/unknown;
- severity;
- evidence/claim IDs;
- rationale;
- evaluated time;
- evaluator role/version.

Unknown critical kill checks prevent Strong Build until resolved.
