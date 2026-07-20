module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest runs browser-facing annotator tests in jsdom. Avoid Konva's Node
    // entry, which requires the optional native `canvas` package.
    '^konva$': '<rootDir>/node_modules/konva/lib/index.js',
    '\\.(css|scss)$': '<rootDir>/test/style-mock.cjs',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
};
