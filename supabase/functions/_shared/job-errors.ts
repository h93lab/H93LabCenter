export class ProviderError extends Error {
  constructor(
    public code: string,
    public retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "ProviderError";
  }
}
export function providerHttpError(
  status: number,
  retryAfter: string | null = null,
) {
  if (status === 401 || status === 402 || status === 403)
    return new ProviderError("PROVIDER_AUTH_OR_CREDIT");
  const parsed = retryAfter ? Number(retryAfter) : NaN;
  const seconds = Number.isFinite(parsed)
    ? parsed
    : retryAfter
      ? Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000)
      : 30;
  return new ProviderError(
    status === 429 ? "PROVIDER_RATE_LIMIT" : "PROVIDER_HTTP_" + status,
    status === 429 ? Math.max(1, Math.min(3600, seconds || 30)) : undefined,
  );
}
export function jobError(error: unknown): Error {
  if (error instanceof ProviderError) return error;
  if (
    error instanceof Error &&
    ["AbortError", "TimeoutError"].includes(error.name)
  )
    return new ProviderError("PROVIDER_TIMEOUT");
  if (
    error instanceof TypeError &&
    /fetch|network|connection/i.test(error.message)
  )
    return new ProviderError("PROVIDER_NETWORK");
  return error instanceof Error ? error : Error("WORKER_ERROR");
}
export function retryable(error: unknown) {
  return /TIMEOUT|NETWORK|HTTP_5|HTTP_429|RATE_LIMIT|AI_SCHEMA_INVALID|AI_JSON_INVALID|UNSUPPORTED_EVIDENCE_REFERENCE|INVALID_REVIEW_EVIDENCE|INCOMPLETE_KILL_ASSESSMENT/.test(
    jobError(error).message,
  );
}
export function retryDelay(
  attempt: number,
  error: unknown,
  random = Math.random,
) {
  const backoff = Math.min(900, 30 * 2 ** Math.max(0, attempt - 1));
  return Math.min(
    3600,
    Math.ceil(
      Math.max(
        backoff,
        error instanceof ProviderError ? error.retryAfterSeconds || 0 : 0,
      ) +
        random() * Math.min(30, backoff / 4),
    ),
  );
}
