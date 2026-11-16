import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/dsl/**/*.ts',
    'src/challenge/challenge.ts',
    'src/audio/engine.ts',
    'src/state/**/*.ts',
    'src/components/**/*.tsx',
    '!**/__tests__/**',
  ],
  coverageReporters: ['text', 'html', 'json-summary'],
};

export default createJestConfig(config);

