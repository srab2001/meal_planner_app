/**
 * Mock Prisma Client for Tests
 */

const mockPrismaInstance = {
  workout_share_tokens: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  },
  sms_log: {
    create: jest.fn(),
    count: jest.fn()
  },
  user_phones: {
    findUnique: jest.fn(),
    upsert: jest.fn()
  },
  workout_items: {
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn()
  },
  fitness_workouts: {
    findFirst: jest.fn(),
    findUnique: jest.fn()
  },
  $executeRaw: jest.fn()
};

const PrismaClient = jest.fn(() => mockPrismaInstance);

module.exports = { PrismaClient };
