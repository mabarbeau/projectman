module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  testMatch: ['**/*.spec.[jt]s?(x)', '**/__tests__/*.[jt]s?(x)'],
  modulePathIgnorePatterns: ['node_modules'],
  // setupFilesAfterEnv: ['./tests/unit/setup.js'],
};
