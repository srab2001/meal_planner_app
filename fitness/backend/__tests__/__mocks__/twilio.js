/**
 * Mock Twilio Client for Tests
 */

const mockMessages = {
  create: jest.fn().mockResolvedValue({ sid: 'SM_TEST_SID_123' })
};

const mockClient = {
  messages: mockMessages
};

// Export as a function that returns the mock client
module.exports = jest.fn(() => mockClient);
