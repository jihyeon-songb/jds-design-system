# Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** controlled·uncontrolled page selection과 접근 가능한 navigation 의미를 제공하는 `Pagination`을 `@jdsb/components`에 추가한다.

**Architecture:** `Pagination.tsx` 하나가 numeric prop 검증, uncontrolled state, page window 계산, native `nav`/`ul`/`button` 렌더링을 맡는다. URL과 데이터 계층은 결합하지 않으며 `onPageChange`로만 선택 요청을 전달한다. CSS는 기존 semantic token만 사용하고 public export와 CSS import를 기존 navigation 패턴에 연결한다.

**Tech Stack:** React 19, TypeScript, native HTML/ARIA, Vitest, Testing Library, Storybook 10, CSS custom-property tokens

## Global Constraints

- `pnpm`만 사용하고 새 의존성·외부 UI 라이브러리를 추가하지 않는다.
- 모든 공개 API에는 명시적 TypeScript 타입을 제공한다.
- URL 변경, 데이터 요청, 페이지 크기 선택, 처음·마지막 바로가기, link 렌더링, animation은 추가하지 않는다.
- 스타일의 색상·크기·간격·반경은 기존 semantic token만 사용하고 새 token을 만들지 않는다.
- `Pagination`의 `aria-label`은 필수이며, native button의 Tab, Shift+Tab, Space, Enter 동작을 보존한다.
- 구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm --filter @jdsb/storybook build`를 실행한다.

---

## File Structure

- Create: `packages/components/src/navigation/Pagination.tsx` — props 검증, 상태, page window, semantic HTML.
- Create: `packages/components/src/navigation/Pagination.test.tsx` — API, state, range, ARIA, keyboard 회귀 테스트.
- Create: `packages/components/src/navigation/Pagination.css` — 기존 token만 사용하는 visual state.
- Create: `apps/storybook/src/navigation/Pagination.stories.tsx` — interactive·boundary·ellipsis·locale 문서와 axe play 검사.
- Modify: `packages/components/src/index.ts` — `Pagination`, `PaginationProps` 공개 export.
- Modify: `packages/components/src/index.css` — Pagination CSS import.
- Modify: `packages/components/package.json` — 배포 CSS files 목록.

### Task 1: 페이지 상태·window·접근성 API

**Files:**
- Create: `packages/components/src/navigation/Pagination.tsx`
- Create: `packages/components/src/navigation/Pagination.test.tsx`

**Interfaces:**
- Produces: `PaginationProps`와 `Pagination`, `ref: HTMLNavElement`.
- `PaginationProps`:

```ts
type PaginationValueProps =
  | { page: number; defaultPage?: never }
  | { defaultPage: number; page?: never }

export type PaginationProps = Omit<
  ComponentPropsWithoutRef<"nav">,
  "aria-label" | "children"
> & PaginationValueProps & {
  "aria-label": string
  totalPages: number
  getPageLabel?: (page: number, current: boolean) => string
  nextLabel?: string
  onPageChange?: (page: number) => void
  previousLabel?: string
}
```

- The component renders `nav.jdsb-pagination > ul`, page `button.jdsb-pagination-page`, and previous/next `button.jdsb-pagination-control`.

- [ ] **Step 1: Write the failing public API and state tests**

Create `Pagination.test.tsx` using the repository's `Tabs.test.tsx` imports and cleanup pattern. Add these executable cases before importing the non-existent implementation:

```tsx
it("renders a named native navigation landmark and forwards its ref", () => {
  const ref = createRef<HTMLElement>()
  render(<Pagination ref={ref} aria-label="검색 결과" defaultPage={2} totalPages={3} className="custom" />)
  expect(ref.current).toHaveClass("jdsb-pagination", "custom")
  expect(screen.getByRole("navigation", { name: "검색 결과" })).toBe(ref.current)
  expect(screen.getByRole("button", { name: "2 페이지, 현재 페이지" })).toHaveAttribute("aria-current", "page")
})

it("updates an uncontrolled page once and only notifies controlled selection", async () => {
  const user = userEvent.setup()
  const changed = vi.fn()
  const { rerender } = render(<Pagination aria-label="검색 결과" defaultPage={1} totalPages={3} onPageChange={changed} />)
  await user.click(screen.getByRole("button", { name: "2 페이지" }))
  await user.click(screen.getByRole("button", { name: "2 페이지, 현재 페이지" }))
  expect(changed).toHaveBeenCalledTimes(1)
  expect(changed).toHaveBeenLastCalledWith(2)
  rerender(<Pagination aria-label="검색 결과" page={1} totalPages={3} onPageChange={changed} />)
  await user.click(screen.getByRole("button", { name: "다음 페이지" }))
  expect(changed).toHaveBeenLastCalledWith(2)
  expect(screen.getByRole("button", { name: "1 페이지, 현재 페이지" })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test packages/components/src/navigation/Pagination.test.tsx`

Expected: FAIL because `Pagination.tsx` and the public export do not exist.

- [ ] **Step 3: Add the minimal component implementation**

Create `Pagination.tsx`. Keep helper functions in this file: `assertPage`, `getVisiblePages`, and `getDefaultPageLabel`. Do not create a generic pagination utility.

```tsx
function assertPage(value: number, name: string, totalPages?: number): void {
  if (!Number.isInteger(value) || value < 1 || (totalPages !== undefined && value > totalPages)) {
    throw new RangeError(`${name} must be an integer between 1 and ${totalPages ?? "Infinity"}`)
  }
}

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages]
  if (page >= totalPages - 3) return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
}
```

Validate `totalPages`, then the active controlled or default page before `useState`. Render buttons with `type="button"`; call a local `requestPage(nextPage)` only when `nextPage !== selectedPage`. `requestPage` updates local state only in uncontrolled mode and calls `onPageChange?.(nextPage)`. Render `…` as `<span aria-hidden="true">…</span>` with a stable position-based key, not a duplicate string key.

- [ ] **Step 4: Run the targeted test to verify it passes**

Run: `pnpm test packages/components/src/navigation/Pagination.test.tsx`

Expected: PASS for landmark/ref, current-page meaning, uncontrolled change, duplicate suppression, and controlled notification.

- [ ] **Step 5: Commit the component API**

```bash
git add packages/components/src/navigation/Pagination.tsx packages/components/src/navigation/Pagination.test.tsx
git commit -m "feat: Pagination 페이지 상태 추가"
```

### Task 2: 경계·표시 범위·native keyboard 회귀 검증

**Files:**
- Modify: `packages/components/src/navigation/Pagination.test.tsx`

**Interfaces:**
- Consumes: Task 1 `PaginationProps`, page buttons' accessible labels, `getVisiblePages` behavior.
- Produces: validated boundary, numeric validation, window and keyboard behavior before styling/export work.

- [ ] **Step 1: Add failing boundary and window tests**

Add these cases to `Pagination.test.tsx`:

```tsx
it("disables previous and next only at the boundaries", async () => {
  const user = userEvent.setup()
  const changed = vi.fn()
  const { rerender } = render(<Pagination aria-label="목록" defaultPage={1} totalPages={8} onPageChange={changed} />)
  expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled()
  await user.click(screen.getByRole("button", { name: "이전 페이지" }))
  expect(changed).not.toHaveBeenCalled()
  rerender(<Pagination aria-label="목록" defaultPage={8} totalPages={8} onPageChange={changed} />)
  expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled()
})

it("renders the documented compact page windows and inert ellipses", () => {
  const { rerender } = render(<Pagination aria-label="목록" defaultPage={4} totalPages={7} />)
  expect(screen.getAllByRole("button")).toHaveLength(9)
  rerender(<Pagination aria-label="목록" defaultPage={4} totalPages={8} />)
  expect(screen.getAllByText("…")).toHaveLength(1)
  rerender(<Pagination aria-label="목록" defaultPage={5} totalPages={10} />)
  expect(screen.getAllByText("…")).toHaveLength(2)
  expect(screen.queryByRole("button", { name: "…" })).not.toBeInTheDocument()
})

it("rejects invalid numeric props and preserves native button keyboard activation", async () => {
  expect(() => render(<Pagination aria-label="목록" defaultPage={0} totalPages={2} />)).toThrow(RangeError)
  expect(() => render(<Pagination aria-label="목록" defaultPage={1} totalPages={1.5} />)).toThrow(RangeError)
  const user = userEvent.setup()
  const changed = vi.fn()
  render(<Pagination aria-label="목록" defaultPage={1} totalPages={2} onPageChange={changed} />)
  screen.getByRole("button", { name: "다음 페이지" }).focus()
  await user.keyboard("{Enter}")
  expect(changed).toHaveBeenCalledWith(2)
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test packages/components/src/navigation/Pagination.test.tsx`

Expected: FAIL until Task 1's implementation has exact disabled controls, window sequence, ellipsis semantics, and `RangeError` validation.

- [ ] **Step 3: Complete the smallest missing behavior in `Pagination.tsx`**

Render previous/next controls around the pages and set `disabled={selectedPage === 1}` and `disabled={selectedPage === totalPages}`. Add `data-direction="previous" | "next"`, `data-state="enabled" | "disabled"`, `data-state="current" | "idle"` to pages, and `aria-current="page"` only to the current page. Use `previousLabel`, `nextLabel`, and `getPageLabel` defaults exactly as specified:

```tsx
const defaultPageLabel = (page: number, current: boolean) =>
  current ? `${page} 페이지, 현재 페이지` : `${page} 페이지`
```

Do not add keyboard handlers; `type="button"` provides the tested Enter and Space behavior.

- [ ] **Step 4: Run the targeted test to verify it passes**

Run: `pnpm test packages/components/src/navigation/Pagination.test.tsx`

Expected: PASS for boundaries, all three page-window shapes, inert ellipses, invalid values, and native keyboard activation.

- [ ] **Step 5: Commit behavior coverage**

```bash
git add packages/components/src/navigation/Pagination.tsx packages/components/src/navigation/Pagination.test.tsx
git commit -m "test: Pagination 경계와 탐색 검증 추가"
```

### Task 3: token CSS, public package surface, and Storybook

**Files:**
- Create: `packages/components/src/navigation/Pagination.css`
- Create: `apps/storybook/src/navigation/Pagination.stories.tsx`
- Modify: `packages/components/src/index.ts`
- Modify: `packages/components/src/index.css`
- Modify: `packages/components/package.json`
- Modify: `packages/components/src/navigation/Pagination.test.tsx`

**Interfaces:**
- Consumes: Task 1 `Pagination`, `PaginationProps`, CSS classes and data attributes.
- Produces: `import { Pagination } from "@jdsb/components"` and `@jdsb/components/css` support with documented, axe-tested stories.

- [ ] **Step 1: Add failing package-surface and localized-label tests**

Add public imports from `../index.js` and test identity/type equality, plus localization:

```tsx
it("exports the public component and permits localized control names", () => {
  expect(PublicPagination).toBe(Pagination)
  expectTypeOf<PublicPaginationProps>().toEqualTypeOf<PaginationProps>()
  render(<Pagination aria-label="Results" defaultPage={1} totalPages={2} previousLabel="Previous" nextLabel="Next" getPageLabel={(page) => `Page ${page}`} />)
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page")
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test packages/components/src/navigation/Pagination.test.tsx`

Expected: FAIL because `Pagination` and `PaginationProps` are not exported from `../index.js`.

- [ ] **Step 3: Add styles, exports, and stories**

Create `Pagination.css` using only the specified existing variables. Match the existing CSS naming pattern:

```css
.jdsb-pagination-list { display: flex; gap: var(--jdsb-space-button-gap); list-style: none; margin: 0; padding: 0; }
.jdsb-pagination-page, .jdsb-pagination-control { background: var(--jdsb-color-action-ghost-background); border: var(--jdsb-size-border) solid var(--jdsb-color-action-ghost-background); border-radius: var(--jdsb-radius-control); color: var(--jdsb-color-action-ghost-foreground); cursor: pointer; min-block-size: var(--jdsb-size-control-button-md-height); padding-inline: var(--jdsb-space-button-inline); }
.jdsb-pagination-page[data-state="current"] { background: var(--jdsb-color-action-primary-background); border-color: var(--jdsb-color-action-primary-background); color: var(--jdsb-color-action-primary-foreground); }
.jdsb-pagination-page:focus-visible, .jdsb-pagination-control:focus-visible { outline: var(--jdsb-size-focus) solid var(--jdsb-color-focus-ring); outline-offset: var(--jdsb-size-focus); }
.jdsb-pagination-control:disabled { cursor: not-allowed; opacity: var(--jdsb-opacity-disabled); }
@media (forced-colors: active) { .jdsb-pagination-page, .jdsb-pagination-control { forced-color-adjust: auto; } }
```

Add the CSS import, package `files` entry, and public export. Create Storybook stories named `Default`, `Controlled`, `FirstPage`, `LastPage`, `Ellipsis`, and `LocalizedLabels`. `Default.play` must click the next button and assert that page 2 gets `aria-current="page"`; all stories inherit the existing preview axe configuration.

- [ ] **Step 4: Run component, type, package, and documentation checks**

Run:

```bash
pnpm test packages/components/src/navigation/Pagination.test.tsx
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm --filter @jdsb/storybook build
```

Expected: every command exits 0.

- [ ] **Step 5: Manually verify required browser behavior**

In Storybook, verify: Tab/Shift+Tab reaches every enabled native button in DOM order; Space and Enter select the focused page; first and last page controls disable correctly; at 200% zoom controls remain distinguishable; forced-colors keeps current-page and focus-visible indication. Test one Story with a screen reader to confirm the navigation landmark name, current-page announcement, and disabled control announcement.

- [ ] **Step 6: Commit the public component**

```bash
git add packages/components/src/navigation/Pagination.css packages/components/src/navigation/Pagination.test.tsx packages/components/src/index.ts packages/components/src/index.css packages/components/package.json apps/storybook/src/navigation/Pagination.stories.tsx
git commit -m "feat: Pagination 스타일과 문서 추가"
```

## Plan Self-Review

- Spec coverage: Task 1 implements the public API, controlled/uncontrolled state, landmark and selection semantics. Task 2 covers numeric validation, boundary controls, compact-window rules, ellipsis, and native keyboard behavior. Task 3 supplies token-only CSS, package exports, Storybook, axe coverage, and full verification.
- Placeholder scan: no incomplete or unspecified behavior remains; all test, implementation, and verification commands are concrete.
- Type consistency: every task uses the same `PaginationProps`, `Pagination`, `page`, `defaultPage`, `totalPages`, `onPageChange`, `getPageLabel`, `previousLabel`, and `nextLabel` names defined in Task 1.
