module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: ['app.js', 'src/**/*.js', '!server.js'],
  clearMocks: true,
};