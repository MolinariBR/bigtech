// Setup file for Jest tests
import { jest } from '@jest/globals';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.APPWRITE_ENDPOINT = 'http://localhost:8080/v1';
process.env.APPWRITE_PROJECT = 'test-project';
process.env.APPWRITE_API_KEY = 'test-key';

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';