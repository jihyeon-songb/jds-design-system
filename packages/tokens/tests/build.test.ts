// @vitest-environment node

import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildTokens } from "../scripts/build.mjs"

describe("buildTokens", () => {
  it("resolves token aliases into CSS custom properties", () => {
    const result = buildTokens({
      color: {
        blue: { $value: "#0057ff", $type: "color" },
        action: { $value: "{color.blue}", $type: "color" }
      }
    })

    expect(result.css).toContain("--jdsb-color-action: #0057ff;")
    expect(result.declarations).toContain('"color.action"')
  })

  it("resolves neutral outline foreground and border", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-color-action-outline-foreground: #17212b;")
    expect(result.css).toContain("--jdsb-color-action-outline-border: #c9ced3;")
  })

  it("publishes the 14px component typography token", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-typography-body-font-size: 14px;")
  })

  it("publishes the Skeleton background token", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-color-skeleton-background: #f1f3f5;")
  })

  it("publishes Progress colors", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-color-progress-track: #f1f3f5;")
    expect(result.css).toContain("--jdsb-color-progress-indicator: #0057d9;")
  })

  it("rejects unknown token aliases", () => {
    expect(() => buildTokens({ color: { action: { $value: "{color.missing}", $type: "color" } } }))
      .toThrow("Unknown token reference: color.missing")
  })

  it("rejects circular token aliases", () => {
    expect(() => buildTokens({
      color: {
        a: { $value: "{color.b}", $type: "color" },
        b: { $value: "{color.a}", $type: "color" }
      }
    })).toThrow("Circular token reference: color.a")
  })
})
