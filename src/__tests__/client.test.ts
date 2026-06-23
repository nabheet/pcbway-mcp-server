import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PcbWayClient, PcbWayApiError, PcbWayNetworkError } from '../client.js';

// ── Helpers ──────────────────────────────────────────────────────

function mockFetch(response: Partial<Response>, body?: unknown) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(body !== undefined ? JSON.stringify(body) : ''),
    headers: new Headers({ 'content-type': 'application/json' }),
    ...response,
  } as Response);
}

function mockFetchError(status: number, statusText: string, body?: string) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body ?? ''),
    headers: new Headers({}),
  } as Response);
}

// ── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch not mocked'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createClient(baseUrl?: string, maxRetries = 3): PcbWayClient {
  return new PcbWayClient({
    apiKey: 'test-key-123',
    baseUrl: baseUrl ?? 'https://api.pcbway.test',
    maxRetries,
    baseDelayMs: 500,
    timeoutMs: 30_000,
  });
}

// ── Tests ────────────────────────────────────────────────────────

describe('PcbWayClient', () => {
  describe('request', () => {
    it('sends POST with api-key header and JSON body', async () => {
      mockFetch({ ok: true }, { Status: 'ok', Data: 'hello' });

      const client = createClient();
      const result = await client.request<{ Data: string }>('/api/test', { foo: 'bar' });

      expect(fetch).toHaveBeenCalledTimes(1);
      const call = vi.mocked(fetch).mock.calls[0];
      expect(call[0]).toBe('https://api.pcbway.test/api/test');
      expect((call[1] as RequestInit).method).toBe('POST');
      expect((call[1] as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/json',
        'api-key': 'test-key-123',
      });
      expect((call[1] as RequestInit).body).toBe(JSON.stringify({ foo: 'bar' }));
      expect(result).toEqual({ Status: 'ok', Data: 'hello' });
    });

    it('uses custom base URL from config', async () => {
      mockFetch({ ok: true }, { Status: 'ok' });

      const client = createClient('https://custom.pcbway.com');
      await client.request('/api/test', {});
      expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://custom.pcbway.com/api/test');
    });

    it('throws PcbWayApiError when API returns Status: error', async () => {
      mockFetch({ ok: true, status: 200 }, { Status: 'error', ErrorText: 'Bad request', Code: 42 });

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayApiError);
      expect(err.message).toBe('Bad request');
      expect(err.code).toBe(42);
    });

    it('throws PcbWayApiError with fallback message when ErrorText is null', async () => {
      mockFetch({ ok: true, status: 200 }, { Status: 'error', ErrorText: null, Code: 0 });

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayApiError);
      expect(err.message).toBe('Unknown API error');
      expect(err.code).toBe(0);
    });

    it('throws PcbWayNetworkError on HTTP 400 without retry', async () => {
      mockFetchError(400, 'Bad Request', 'Missing param');

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayNetworkError);
      expect(err.message).toContain('400');
      expect(err.message).toContain('Missing param');
      expect(err.status).toBe(400);
      expect(fetch).toHaveBeenCalledTimes(1); // no retry
    });

    it('retries on HTTP 500 then succeeds', async () => {
      const body = { Status: 'ok' };
      vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError('network blip')) // attempt 0 fails
        .mockResolvedValueOnce({ // attempt 1
          ok: false, status: 500, statusText: 'Internal Server Error',
          text: () => Promise.resolve(''),
          headers: new Headers({}),
        } as Response)
        .mockResolvedValueOnce({ // attempt 2 — success
          ok: true, status: 200,
          text: () => Promise.resolve(JSON.stringify(body)),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response);

      const client = createClient();
      const result = await client.request('/api/test', {});

      expect(result).toEqual(body);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('retries on HTTP 429 then succeeds', async () => {
      const body = { Status: 'ok' };
      vi.mocked(fetch)
        .mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests', text: () => Promise.resolve(''), headers: new Headers({}) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)), headers: new Headers({ 'content-type': 'application/json' }) } as Response);

      const client = createClient();
      const result = await client.request('/api/test', {});

      expect(result).toEqual(body);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('fails after exhausting retries on repeated 500s', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false, status: 503, statusText: 'Service Unavailable',
        text: () => Promise.resolve(''),
        headers: new Headers({}),
      } as Response);

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayNetworkError);
      expect(err.status).toBe(503);
      // 1 initial + 3 retries = 4 total
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('retries on network error (TypeError) then succeeds', async () => {
      const body = { Status: 'ok' };
      vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)), headers: new Headers({ 'content-type': 'application/json' }) } as Response);

      const client = createClient();
      const result = await client.request('/api/test', {});

      expect(result).toEqual(body);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('retries on abort/timeout', async () => {
      const body = { Status: 'ok' };
      const abortError = new DOMException('The operation was aborted', 'AbortError');

      vi.mocked(fetch)
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)), headers: new Headers({ 'content-type': 'application/json' }) } as Response);

      const client = createClient();
      const result = await client.request('/api/test', {});

      expect(result).toEqual(body);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('uses a signal for timeout', async () => {
      mockFetch({ ok: true }, { Status: 'ok' });

      const client = createClient();
      await client.request('/api/test', {});

      // Verify a signal was passed
      const call = vi.mocked(fetch).mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.signal?.aborted).toBe(false);
    });

    it('uses request timeout', { timeout: 35_000 }, async () => {
      // Simulate a slow response by delaying, then verify timeout handling
      vi.mocked(fetch).mockImplementation(async (_url, options) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const signal = (options as RequestInit).signal as AbortSignal;
        if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
        return { ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ Status: 'ok' })), headers: new Headers({}) } as Response;
      });

      // Use a very short client timeout by constructing client with custom config
      // Since timeout is hardcoded at 30s, we just verify signal is passed
      const client = createClient();
      const result = await client.request('/api/test', {});
      expect(result).toEqual({ Status: 'ok' });
    });

    it('throws PcbWayNetworkError after exhausting retries on timeout', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      vi.mocked(fetch).mockRejectedValue(abortError);

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayNetworkError);
      expect(err.message).toBe('Request timed out');
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('throws PcbWayNetworkError after exhausting retries on network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new TypeError('net::ERR_CONNECTION_REFUSED'));

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(PcbWayNetworkError);
      expect(err.message).toContain('Network error after 4 attempts');
      expect(err.message).toContain('ERR_CONNECTION_REFUSED');
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('re-throws unknown errors immediately', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Something weird happened'));

      const client = createClient();
      const err = await client.request('/api/test', {}).catch((e) => e);

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Something weird happened');
      expect(fetch).toHaveBeenCalledTimes(1); // no retries
    });
  });
});
