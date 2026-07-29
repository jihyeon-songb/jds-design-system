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
