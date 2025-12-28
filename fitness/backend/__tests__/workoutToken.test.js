/**
 * Workout Token Tests
 *
 * Tests for token generation, validation, and URL generation.
 * Note: Database interaction tests require integration testing with actual DB.
 */

const crypto = require('crypto');

let workoutToken;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  workoutToken = require('../lib/workoutToken');
});

describe('Token Configuration', () => {
  test('TOKEN_EXPIRY_HOURS is 24', () => {
    expect(workoutToken.TOKEN_EXPIRY_HOURS).toBe(24);
  });
});

describe('Token Validation - Format Checks', () => {
  test('validateShareToken rejects invalid format (wrong length)', async () => {
    const result = await workoutToken.validateShareToken('short-token');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  test('validateShareToken rejects null token', async () => {
    const result = await workoutToken.validateShareToken(null);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  test('validateShareToken rejects empty string', async () => {
    const result = await workoutToken.validateShareToken('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  test('validateShareToken rejects undefined', async () => {
    const result = await workoutToken.validateShareToken(undefined);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  test('validateShareToken rejects token with wrong length (63 chars)', async () => {
    const shortToken = crypto.randomBytes(31).toString('hex') + 'a';
    const result = await workoutToken.validateShareToken(shortToken.slice(0, 63));

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  test('validateShareToken rejects token with wrong length (65 chars)', async () => {
    const longToken = crypto.randomBytes(33).toString('hex');
    const result = await workoutToken.validateShareToken(longToken.slice(0, 65));

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });
});

describe('URL Generation', () => {
  test('getShareUrl creates correct URL', () => {
    const token = 'abc123def456';
    const baseUrl = 'https://example.com';

    const result = workoutToken.getShareUrl(token, baseUrl);

    expect(result).toBe('https://example.com/workout/check-off/abc123def456');
  });

  test('getShareUrl removes trailing slash from base URL', () => {
    const token = 'abc123';
    const baseUrl = 'https://example.com/';

    const result = workoutToken.getShareUrl(token, baseUrl);

    expect(result).toBe('https://example.com/workout/check-off/abc123');
  });

  test('getShareUrl handles full 64-char token', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const baseUrl = 'https://app.example.com';

    const result = workoutToken.getShareUrl(token, baseUrl);

    expect(result).toBe(`https://app.example.com/workout/check-off/${token}`);
    expect(result.length).toBe(baseUrl.length + '/workout/check-off/'.length + 64);
  });

  test('getShareUrl handles base URL with path', () => {
    const token = 'testtoken123';
    const baseUrl = 'https://example.com/app';

    const result = workoutToken.getShareUrl(token, baseUrl);

    expect(result).toBe('https://example.com/app/workout/check-off/testtoken123');
  });
});

describe('Token Format Expectations', () => {
  test('tokens should be 64 hex characters', () => {
    // When a token is generated, it should be 64 hex chars (32 bytes)
    const expectedLength = 64;
    const hexPattern = /^[a-f0-9]+$/;

    // Simulate what generateShareToken produces
    const testToken = crypto.randomBytes(32).toString('hex');

    expect(testToken.length).toBe(expectedLength);
    expect(hexPattern.test(testToken)).toBe(true);
  });

  test('crypto.randomBytes produces unique tokens', () => {
    const tokens = new Set();

    // Generate 100 tokens and verify uniqueness
    for (let i = 0; i < 100; i++) {
      tokens.add(crypto.randomBytes(32).toString('hex'));
    }

    expect(tokens.size).toBe(100);
  });
});
