# Button Inline Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a loading spinner before the Button label without hiding the label.

**Architecture:** Keep the existing `loading` public API and native button behavior. Move the existing spinner before the label, then make its CSS participate in the button flex layout.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest, Testing Library

## Global Constraints

- Reuse existing semantic tokens; add no visual literals, dependencies, or public props.
- Preserve native disabled, `aria-busy`, accessible-name, reduced-motion, and forced-colors behavior.

---

### Task 1: Render inline loading feedback

**Files:**
- Modify: `packages/components/src/actions/Button.tsx`
- Modify: `packages/components/src/actions/Button.css`
- Test: `packages/components/src/actions/Button.test.tsx`

**Interfaces:**
- Consumes: `ButtonProps.loading?: boolean`
- Produces: a `data-slot="spinner"` before the label while loading

- [ ] **Step 1: Write the failing test**

```tsx
render(<Button loading>Save changes</Button>)

const button = screen.getByRole("button", { name: "Save changes" })
expect(button.querySelector('[data-slot="spinner"]')?.compareDocumentPosition(screen.getByText("Save changes"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/components/src/actions/Button.test.tsx`
Expected: FAIL because the spinner follows the label.

- [ ] **Step 3: Write minimal implementation**

```tsx
{loading ? <span aria-hidden="true" data-slot="spinner" /> : null}
<span data-slot="label">{children}</span>
```

Remove the spinner's absolute positioning and label opacity rule; retain icon opacity while loading.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/components/src/actions/Button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run required verification**

Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint && pnpm --filter @jdsb/storybook build`
Expected: all commands exit 0.
