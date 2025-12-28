/**
 * SMS Utility Tests
 *
 * Tests for phone number validation and formatting.
 * Note: Database interaction tests require integration testing with actual DB.
 */

let smsLib;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  smsLib = require('../lib/sms');
});

describe('Phone Number Validation', () => {
  test('isValidPhoneNumber accepts E.164 US number', () => {
    expect(smsLib.isValidPhoneNumber('+15551234567')).toBe(true);
  });

  test('isValidPhoneNumber accepts E.164 international number', () => {
    expect(smsLib.isValidPhoneNumber('+447911123456')).toBe(true);
  });

  test('isValidPhoneNumber accepts minimum length number', () => {
    expect(smsLib.isValidPhoneNumber('+12')).toBe(true);
  });

  test('isValidPhoneNumber accepts maximum length E.164 (15 digits)', () => {
    expect(smsLib.isValidPhoneNumber('+123456789012345')).toBe(true);
  });

  test('isValidPhoneNumber rejects number without plus', () => {
    expect(smsLib.isValidPhoneNumber('15551234567')).toBe(false);
  });

  test('isValidPhoneNumber rejects too short number (just +)', () => {
    expect(smsLib.isValidPhoneNumber('+')).toBe(false);
  });

  test('isValidPhoneNumber rejects number with just +1', () => {
    expect(smsLib.isValidPhoneNumber('+1')).toBe(false);
  });

  test('isValidPhoneNumber rejects too long number (16+ digits)', () => {
    expect(smsLib.isValidPhoneNumber('+1234567890123456')).toBe(false);
  });

  test('isValidPhoneNumber rejects number with letters', () => {
    expect(smsLib.isValidPhoneNumber('+1555CALL')).toBe(false);
  });

  test('isValidPhoneNumber rejects number starting with +0', () => {
    expect(smsLib.isValidPhoneNumber('+0551234567')).toBe(false);
  });

  test('isValidPhoneNumber rejects empty string', () => {
    expect(smsLib.isValidPhoneNumber('')).toBe(false);
  });

  test('isValidPhoneNumber rejects null', () => {
    expect(smsLib.isValidPhoneNumber(null)).toBe(false);
  });

  test('isValidPhoneNumber rejects undefined', () => {
    expect(smsLib.isValidPhoneNumber(undefined)).toBe(false);
  });
});

describe('Phone Number Formatting', () => {
  test('formatPhoneNumber handles 10-digit US number', () => {
    expect(smsLib.formatPhoneNumber('5551234567')).toBe('+15551234567');
  });

  test('formatPhoneNumber handles 11-digit US number', () => {
    expect(smsLib.formatPhoneNumber('15551234567')).toBe('+15551234567');
  });

  test('formatPhoneNumber handles already E.164 format', () => {
    expect(smsLib.formatPhoneNumber('+15551234567')).toBe('+15551234567');
  });

  test('formatPhoneNumber strips dashes and spaces', () => {
    expect(smsLib.formatPhoneNumber('555-123-4567')).toBe('+15551234567');
  });

  test('formatPhoneNumber strips parentheses', () => {
    expect(smsLib.formatPhoneNumber('(555) 123-4567')).toBe('+15551234567');
  });

  test('formatPhoneNumber strips dots', () => {
    expect(smsLib.formatPhoneNumber('555.123.4567')).toBe('+15551234567');
  });

  test('formatPhoneNumber strips mixed separators', () => {
    expect(smsLib.formatPhoneNumber('(555)-123.4567')).toBe('+15551234567');
  });

  test('formatPhoneNumber returns null for invalid number', () => {
    expect(smsLib.formatPhoneNumber('invalid')).toBeNull();
  });

  test('formatPhoneNumber returns null for too short number', () => {
    expect(smsLib.formatPhoneNumber('555')).toBeNull();
  });

  test('formatPhoneNumber returns null for empty string', () => {
    expect(smsLib.formatPhoneNumber('')).toBeNull();
  });

  test('formatPhoneNumber handles international with plus', () => {
    expect(smsLib.formatPhoneNumber('+447911123456')).toBe('+447911123456');
  });

  test('formatPhoneNumber handles number with country code prefix', () => {
    expect(smsLib.formatPhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
  });
});

describe('Rate Limit Constants', () => {
  test('RATE_LIMIT_MAX is 5', () => {
    expect(smsLib.RATE_LIMIT_MAX).toBe(5);
  });

  test('RATE_LIMIT_WINDOW_HOURS is 1', () => {
    expect(smsLib.RATE_LIMIT_WINDOW_HOURS).toBe(1);
  });
});

describe('API Request Validation', () => {
  test('sendSms fails with invalid phone number', async () => {
    const result = await smsLib.sendSms({
      to: 'invalid-phone',
      body: 'Test message',
      userId: 'user-123',
      messageType: 'test'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid phone number format');
  });

  test('sendSms returns error object for bad phone', async () => {
    const result = await smsLib.sendSms({
      to: 'not-a-number',
      body: 'Test',
      userId: 'user-123',
      messageType: 'test'
    });

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(typeof result.error).toBe('string');
  });
});
