// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
});

// Increase timeout for container startup
jest.setTimeout(60000);
