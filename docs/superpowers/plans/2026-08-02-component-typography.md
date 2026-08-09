# Component Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render all JDSB component text at 14px without changing consumer page typography.

**Architecture:** Add one `typography.body.font-size` semantic token and use it once after the component stylesheet imports. The scoped selector matches only JDSB namespace classes and overrides existing `font: inherit` declarations, so component and portal content inherit 14px while consumer CSS loaded later can still override it.

**Tech Stack:** DTCG JSON tokens, CSS custom properties, TypeScript, Vitest.

## Global Constraints

- Use pnpm only; add no dependencies.
- Add `typography.body.font-size` as a `14px` semantic token.
- Apply it only to `jdsb-` class namespace elements; do not style `:root`, `html`, `body`, or consumer content.
- Do not add per-component duplicate font-size declarations, React APIs, or runtime behavior.
- Preserve consumer overrides through the normal CSS cascade.

---

### Task 1: Add the scoped typography token and generated exports

**Files:**
- Modify: `packages/tokens/tests/build.test.ts:20`
- Modify: `packages/tokens/src/jdsb.tokens.json`
- Modify: `packages/tokens/dist/tokens.css`
- Modify: `packages/tokens/dist/index.js`
- Modify: `packages/tokens/dist/index.d.ts`
- Modify: `packages/components/src/index.css:1`

**Interfaces:**
- Consumes: `typography.body.font-size` from the token CSS export.
- Produces: `--jdsb-typography-body-font-size: 14px;` and a component-scoped `font-size: var(--jdsb-typography-body-font-size);` rule.

- [ ] **Step 1: Write the failing source-token regression test**

  Add this test to `packages/tokens/tests/build.test.ts`, reusing its existing
  `readFileSync` source loader pattern:

  ```ts
  it("publishes the 14px component typography token", () => {
    const source = JSON.parse(readFileSync(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
    const result = buildTokens(source)

    expect(result.css).toContain("--jdsb-typography-body-font-size: 14px;")
  })
  ```

- [ ] **Step 2: Run the focused test and verify failure**

  Run: `pnpm vitest run packages/tokens/tests/build.test.ts`

  Expected: FAIL because the source has no typography token yet.

- [ ] **Step 3: Add the token and one scoped component rule**

  Add this group to `packages/tokens/src/jdsb.tokens.json`:

  ```json
  "typography": {
    "body": {
      "font-size": { "$value": "14px", "$type": "dimension" }
    }
  }
  ```

  Append this rule to `packages/components/src/index.css` after its imports:

  ```css
  [class^="jdsb-"],
  [class*=" jdsb-"] {
    font-size: var(--jdsb-typography-body-font-size);
  }
  ```

  Then run: `pnpm --filter @jdsb/tokens build`

- [ ] **Step 4: Run focused verification**

  Run: `pnpm vitest run packages/tokens/tests/build.test.ts && rg -n -- '--jdsb-typography-body-font-size: 14px' packages/tokens/dist/tokens.css && rg -n 'font-size: var\(--jdsb-typography-body-font-size\)' packages/components/src/index.css`

  Expected: PASS; the generated CSS exports 14px and the single JDSB-scoped
  rule consumes it.

- [ ] **Step 5: Run repository validation**

  Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint`

  Expected: all commands exit with status 0.

- [ ] **Step 6: Commit the typography change**

  ```bash
  git add packages/tokens/src/jdsb.tokens.json packages/tokens/tests/build.test.ts packages/tokens/dist/index.d.ts packages/tokens/dist/index.js packages/tokens/dist/tokens.css packages/components/src/index.css
  git commit -m "feat: 컴포넌트 텍스트를 14px로 통일"
  ```
