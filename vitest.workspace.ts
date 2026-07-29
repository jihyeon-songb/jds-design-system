import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  {
    test: {
      include: ["packages/*/tests/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"]
    }
  }
])
