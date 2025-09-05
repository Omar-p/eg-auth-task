// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
});

// Global cleanup after all tests
afterAll(async () => {
  // Force close any remaining mongoose connections
  const mongoose = require('mongoose');
  try {
    await mongoose.disconnect();
    
    // Close any remaining connections
    if (mongoose.connections) {
      for (const connection of mongoose.connections) {
        if (connection.readyState !== 0) {
          await connection.close(true); // Force close
        }
      }
    }
  } catch (error) {
    console.warn('Global cleanup warning:', error.message);
  }
});

// Increase timeout for container startup
jest.setTimeout(60000);
