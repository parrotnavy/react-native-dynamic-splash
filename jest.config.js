/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/__mocks__/**",
  ],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^react-native$": "<rootDir>/src/__mocks__/react-native.ts",
    "^react-native-fs$": "<rootDir>/src/__mocks__/react-native-fs.ts",
  },
  clearMocks: true,
  resetMocks: true,
};
