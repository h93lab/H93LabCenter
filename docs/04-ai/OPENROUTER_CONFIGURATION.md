# OpenRouter Configuration

## Server-Side Only

All OpenRouter requests originate from trusted Supabase Edge Functions or server-side workers. The browser never receives `OPENROUTER_API_KEY`.

## Role Configuration Fields

Each AI role stores:

- `role_key`
- `enabled`
- `primary_model`
- `fallback_models[]`
- optional provider order/allowlist/denylist;
- `allow_fallbacks`
- `require_parameters`
- data-retention/provider privacy preference where supported;
- reasoning effort where the model supports it;
- temperature;
- max output tokens;
- timeout;
- max retries;
- per-call max USD;
- prompt version;
- response schema version.

## Provider Routing

Default behavior should prioritize reliability while allowing fallback. For roles requiring JSON Schema structured outputs, set provider preferences so only providers supporting required parameters are selected.

Do not assume one provider behaves identically across all models. Store provider actually used in invocation telemetry.

## Structured Output

Where supported, send a strict JSON Schema response format. The application must still validate returned JSON itself.

## Fallback Strategy

Fallback order is role-specific:

1. retry transient provider/network failure when safe;
2. fallback provider for the same model if configured/available;
3. fallback model with equivalent role capability;
4. fail visibly if schema/quality requirements cannot be met.

Do not downgrade a high-stakes final judgment to an unsuitable tiny model solely to avoid a failure.

## Cost Guard

Before request:
- check run/day/month remaining budget;
- estimate worst-case token cost where possible;
- reject/queue as budget-limited if spending would exceed hard cap.

After request:
- persist actual/estimated cost;
- increment run budget counters transactionally;
- surface anomalies.

## Configuration Defaults

Repository seed data should create logical role rows with no assumption that one specific model is permanently best. The owner configures current OpenRouter model IDs through Settings.

## Privacy

Provider-routing settings should support restricting data-retaining providers when available. Sensitive Blueprint data is still sent only when necessary for the role; do not include unrelated research evidence in every prompt.
