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

    expect(result.css).toContain("--jds-color-action: #0057ff;")
    expect(result.declarations).toContain('"color.action"')
  })

  it("resolves neutral outline foreground and border", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jds.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jds-color-action-outline-foreground: #17212b;")
    expect(result.css).toContain("--jds-color-action-outline-border: #c9ced3;")
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
