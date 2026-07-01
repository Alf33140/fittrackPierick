module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'middleware/**/*.js',
        'routes/**/*.js',
    ],
    testMatch: [
        '**/tests/**/*.test.js'],
    verbose: true,
};