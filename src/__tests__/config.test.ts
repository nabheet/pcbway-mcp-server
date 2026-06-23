import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../config.js';

const OLD_ENV = { ...process.env };

beforeEach(() => {
  // Clear relevant env vars before each test
  delete process.env.PCBWAY_API_KEY;
  delete process.env.PCBWAY_BASE_URL;
  delete process.env.PCBWAY_MAX_RETRIES;
  delete process.env.PCBWAY_BASE_DELAY_MS;
  delete process.env.PCBWAY_TIMEOUT_MS;
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe('loadConfig', () => {
  it('loads apiKey from PCBWAY_API_KEY', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    const config = loadConfig();
    expect(config.apiKey).toBe('test-key-abc');
  });

  it('uses default base URL when PCBWAY_BASE_URL is not set', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    const config = loadConfig();
    expect(config.baseUrl).toBe('https://api-partner.pcbway.com');
  });

  it('uses custom base URL when PCBWAY_BASE_URL is set', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    process.env.PCBWAY_BASE_URL = 'https://custom.pcbway.com';
    const config = loadConfig();
    expect(config.baseUrl).toBe('https://custom.pcbway.com');
  });

  it('defaults maxRetries to 3 when PCBWAY_MAX_RETRIES is not set', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    const config = loadConfig();
    expect(config.maxRetries).toBe(3);
  });

  it('uses custom maxRetries from PCBWAY_MAX_RETRIES', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    process.env.PCBWAY_MAX_RETRIES = '5';
    const config = loadConfig();
    expect(config.maxRetries).toBe(5);
  });

  it('falls back to 3 when PCBWAY_MAX_RETRIES is invalid', () => {
    process.env.PCBWAY_API_KEY = 'test-key-abc';
    process.env.PCBWAY_MAX_RETRIES = 'not-a-number';
    const config = loadConfig();
    expect(config.maxRetries).toBe(3);
  });

  it('throws when PCBWAY_API_KEY is missing', () => {
    expect(() => loadConfig()).toThrow('Missing PCBWAY_API_KEY');
  });

  it('throws when PCBWAY_API_KEY is empty string', () => {
    process.env.PCBWAY_API_KEY = '';
    expect(() => loadConfig()).toThrow('Missing PCBWAY_API_KEY');
  });

  describe('baseDelayMs', () => {
    it('defaults to 500 when PCBWAY_BASE_DELAY_MS is not set', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      const config = loadConfig();
      expect(config.baseDelayMs).toBe(500);
    });

    it('uses custom value from PCBWAY_BASE_DELAY_MS', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      process.env.PCBWAY_BASE_DELAY_MS = '1000';
      const config = loadConfig();
      expect(config.baseDelayMs).toBe(1000);
    });

    it('falls back to 500 when PCBWAY_BASE_DELAY_MS is invalid', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      process.env.PCBWAY_BASE_DELAY_MS = 'not-a-number';
      const config = loadConfig();
      expect(config.baseDelayMs).toBe(500);
    });
  });

  describe('timeoutMs', () => {
    it('defaults to 30000 when PCBWAY_TIMEOUT_MS is not set', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      const config = loadConfig();
      expect(config.timeoutMs).toBe(30_000);
    });

    it('uses custom value from PCBWAY_TIMEOUT_MS', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      process.env.PCBWAY_TIMEOUT_MS = '10000';
      const config = loadConfig();
      expect(config.timeoutMs).toBe(10_000);
    });

    it('falls back to 30000 when PCBWAY_TIMEOUT_MS is invalid', () => {
      process.env.PCBWAY_API_KEY = 'test-key-abc';
      process.env.PCBWAY_TIMEOUT_MS = 'not-a-number';
      const config = loadConfig();
      expect(config.timeoutMs).toBe(30_000);
    });
  });
});
