import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("form control typography", () => {
  it("overrides the 14px body size with the 16px control token so iOS Safari does not zoom on focus", () => {
    const styles = readFileSync(resolve(process.cwd(), "packages/components/src/index.css"), "utf8")
    const body = styles.indexOf("var(--jdsb-typography-body-font-size)")
    const control = styles.indexOf("var(--jdsb-typography-control-font-size)")
    const rule = styles.slice(styles.lastIndexOf("}", control), control)

    expect(body).toBeGreaterThan(-1)
    expect(control).toBeGreaterThan(body)
    for (const selector of [".jdsb-input", '.jdsb-textarea [data-slot="control"]', ".jdsb-select-trigger", ".jdsb-combobox-input"]) {
      expect(rule).toContain(selector)
    }
  })
})
