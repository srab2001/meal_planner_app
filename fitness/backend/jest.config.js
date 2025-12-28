module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'lib/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 10000,
  moduleNameMapper: {
    '^../prisma/generated/client$': '<rootDir>/__tests__/__mocks__/prismaClient.js',
    '^twilio$': '<rootDir>/__tests__/__mocks__/twilio.js'
  }
};
