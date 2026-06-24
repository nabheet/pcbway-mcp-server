import { loadConfig, type Config } from './config.js';

// ── Typed error ──────────────────────────────────────────────────

/**
 * Thrown when the PCBWay API returns `Status: "error"`.
 * Preserves the API's error message and code.
 */
export class PcbWayApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
  ) {
    super(message);
    this.name = 'PcbWayApiError';
  }
}

/**
 * Thrown on network failures, timeouts, or non-200 HTTP responses.
 */
export class PcbWayNetworkError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'PcbWayNetworkError';
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Calculate delay with jitter for retry `attempt` (0-indexed). */
function backoffDelay(baseDelayMs: number, attempt: number): number {
  const delay = baseDelayMs * 2 ** attempt; // 500, 1000, 2000, …
  const jitter = Math.random() * delay * 0.3; // ±30%
  return Math.round(delay + jitter);
}

/** Returns true for status codes that are safe to retry. */
function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

// ── Client ───────────────────────────────────────────────────────

/**
 * PCBWay Partner API client.
 * Auth is a single `api-key` header (no HMAC, no appid, no timestamp).
 * All endpoints are POST with JSON body.
 */
export class PcbWayClient {
  private config: Config;

  constructor(config?: Config) {
    this.config = config ?? loadConfig();
  }

  /**
   * Perform an authenticated POST request with timeout and retry.
   *
   * Retries on:
   *  - Network errors (fetch throws)
   *  - HTTP 5xx and 429 (rate limit)
   *  Does NOT retry on 4xx except 429 — those are client errors.
   */
  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.config.apiKey,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        // Read body once (text, so we can include it in errors)
        const text = await response.text();

        if (!response.ok) {
          // Retry on 5xx / 429, bail on 4xx
          if (isRetryable(response.status) && attempt < this.config.maxRetries) {
            const delay = backoffDelay(this.config.baseDelayMs, attempt);
            await sleep(delay);
            continue;
          }

          throw new PcbWayNetworkError(
            `HTTP ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
            response.status,
          );
        }

        // Parse JSON
        const data = JSON.parse(text) as T;

        // Check API-level error status if the response type has it
        // We do a safe check on the envelope fields
        const envelope = data as Record<string, unknown>;
        if (envelope.Status === 'error') {
          const errText = typeof envelope.ErrorText === 'string' ? envelope.ErrorText : null;
          const code = typeof envelope.Code === 'number' ? envelope.Code : 0;
          throw new PcbWayApiError(errText ?? 'Unknown API error', code);
        }

        return data;
      } catch (err) {
        // If it's already our typed error, re-throw immediately (no retry for API errors)
        if (err instanceof PcbWayApiError) {
          throw err;
        }

        // AbortError (timeout) — retry
        if (err instanceof Error && err.name === 'AbortError') {
          if (attempt < this.config.maxRetries) {
            const delay = backoffDelay(this.config.baseDelayMs, attempt);
            await sleep(delay);
            continue;
          }
          throw new PcbWayNetworkError('Request timed out');
        }

        // Fetch network error — retry
        if (err instanceof TypeError || (err instanceof Error && 'code' in err)) {
          lastError = err as Error;
          if (attempt < this.config.maxRetries) {
            const delay = backoffDelay(this.config.baseDelayMs, attempt);
            await sleep(delay);
            continue;
          }
          throw new PcbWayNetworkError(
            `Network error after ${this.config.maxRetries + 1} attempts: ${(err as Error).message}`,
          );
        }

        // Unknown — re-throw immediately
        throw err;
      }
    }

    // Should not reach here, but satisfy types
    throw lastError ?? new PcbWayNetworkError('Request failed');
  }
}
