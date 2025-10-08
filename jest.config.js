module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/server.js',
    '!backend/**/*.test.js',
    '!backend/**/*.spec.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/artifacts/',
    '/cache/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/artifacts/',
    '/cache/'
  ],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js']
};
