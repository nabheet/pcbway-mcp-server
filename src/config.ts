/**
 * Configuration loaded from environment variables.
 * PCBWay Partner API uses a single api-key header — no app ID, no HMAC.
 *
 * Loads .env file automatically via dotenv (if present).
 */
import 'dotenv/config';

export interface Config {
  apiKey: string;
  baseUrl: string;
  /** Max retries for transient failures (network blips, 5xx). Default 3. */
  maxRetries: number;
  /** Base delay in ms for exponential backoff. Default 500. */
  baseDelayMs: number;
  /** Request timeout in ms. Default 30_000. */
  timeoutMs: number;
}

/**
 * Load config from process.env.
 * Throws clearly if PCBWAY_API_KEY is missing.
 */
export function loadConfig(): Config {
  const apiKey = process.env.PCBWAY_API_KEY;
  const baseUrl =
    process.env.PCBWAY_BASE_URL ?? 'https://api-partner.pcbway.com';
  const maxRetries = parseInt(process.env.PCBWAY_MAX_RETRIES ?? '', 10) || 3;
  const baseDelayMs = parseInt(process.env.PCBWAY_BASE_DELAY_MS ?? '', 10) || 500;
  const timeoutMs = parseInt(process.env.PCBWAY_TIMEOUT_MS ?? '', 10) || 30_000;

  if (!apiKey) {
    throw new Error(
      'Missing PCBWAY_API_KEY environment variable. ' +
        'Set it to your PCBWay Partner API Key.',
    );
  }

  return { apiKey, baseUrl, maxRetries, baseDelayMs, timeoutMs };
}
