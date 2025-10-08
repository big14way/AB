// Test setup and global configuration

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock any external services that shouldn't run during tests
beforeAll(() => {
  // Setup mocks
});

afterAll(() => {
  // Cleanup
});
