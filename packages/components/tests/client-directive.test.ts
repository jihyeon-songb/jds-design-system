import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(process.cwd(), "packages/components/src")
const clientOnly = /\buse(State|Effect|LayoutEffect|Ref|Context|Id|Callback|Reducer|SyncExternalStore)\b|\bdocument\.|\bcreateContext\b/

const components = readdirSync(root, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".stories.tsx"))
  .map((file) => [file, readFileSync(join(root, file), "utf8")] as const)

describe("React Server Components boundary", () => {
  it.each(components.filter(([, code]) => clientOnly.test(code)))("%s starts with \"use client\"", (_, code) => {
    expect(code.startsWith('"use client"\n')).toBe(true)
  })
})
