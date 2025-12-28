/**
 * Jest Test Setup
 *
 * Mock external dependencies for unit tests.
 */

// Prisma client and Twilio are mocked via moduleNameMapper in jest.config.js
// The mocks are in __tests__/__mocks__/

// Set test environment variables
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';

// Silence console during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
