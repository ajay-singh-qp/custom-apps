import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  testMatch: ["**/tests/be/**/*.spec.ts"],
  testTimeout: 60000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "node",
        },
      },
    ],
  },
};

export default config;
