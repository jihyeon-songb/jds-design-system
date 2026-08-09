# Outline Neutral Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use muted gray borders and near-black text for every consumer of the shared outline action token.

**Architecture:** Update the two aliases in the DTCG source token; Button and IconButton already consume those semantic tokens. Regenerate the published token artifacts with the existing build script, without CSS or React changes.

**Tech Stack:** DTCG JSON tokens, Node.js build script, Vitest, CSS custom properties.

## Global Constraints

- Use pnpm only; add no dependencies.
- Keep `color.action.outline` as the shared semantic token for Button and IconButton.
- Set outline foreground to `color.neutral.900` and border to `color.neutral.300`.
- Do not change primary, secondary, ghost, destructive, component CSS, or React APIs.

---

### Task 1: Update and publish the shared outline token

**Files:**
- Modify: `packages/tokens/tests/build.test.ts:4`
- Modify: `packages/tokens/src/jdsb.tokens.json:13`
- Modify: `packages/tokens/dist/tokens.css`
- Modify: `packages/tokens/dist/index.js`
- Modify: `packages/tokens/dist/index.d.ts`

**Interfaces:**
- Consumes: `color.action.outline.foreground` and `color.action.outline.border` aliases in the token source.
- Produces: `--jdsb-color-action-outline-foreground: #17212b;` and `--jdsb-color-action-outline-border: #c9ced3;` in the CSS token export.

- [ ] **Step 1: Write the failing token-alias test**

  Add `readFileSync` from `node:fs` and this test to
  `packages/tokens/tests/build.test.ts`:

  ```ts
  import { readFileSync } from "node:fs"

  it("resolves neutral outline foreground and border", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-color-action-outline-foreground: #17212b;")
    expect(result.css).toContain("--jdsb-color-action-outline-border: #c9ced3;")
  })
  ```

- [ ] **Step 2: Run the focused test and verify failure**

  Run: `pnpm vitest run packages/tokens/tests/build.test.ts`

  Expected: FAIL only if the intended alias output is not produced.

- [ ] **Step 3: Change the DTCG aliases and regenerate outputs**

  Replace the two outline aliases in `packages/tokens/src/jdsb.tokens.json`:

  ```json
  "foreground": { "$value": "{color.neutral.900}", "$type": "color" },
  "border": { "$value": "{color.neutral.300}", "$type": "color" }
  ```

  Then run: `pnpm --filter @jdsb/tokens build`

- [ ] **Step 4: Run the focused test and inspect generated CSS**

  Run: `pnpm vitest run packages/tokens/tests/build.test.ts && rg -n -- '--jdsb-color-action-outline-(foreground|border)' packages/tokens/dist/tokens.css`

  Expected: PASS; foreground is `#17212b` and border is `#c9ced3`.

- [ ] **Step 5: Run repository validation**

  Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint`

  Expected: all commands exit with status 0.

- [ ] **Step 6: Commit the token change**

  ```bash
  git add packages/tokens/src/jdsb.tokens.json packages/tokens/tests/build.test.ts packages/tokens/dist/index.d.ts packages/tokens/dist/index.js packages/tokens/dist/tokens.css
  git commit -m "fix: outline 기본 색상을 중립으로 변경"
  ```
