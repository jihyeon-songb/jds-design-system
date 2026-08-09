# IconButton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 접근 가능한 이름과 44 × 44 CSS px 조작 영역을 보장하는 native `IconButton`을 `@jdsb/components`에 추가한다.

**Architecture:** `IconButton`은 Button과 분리된 `forwardRef` native `<button>`이다. 기존 semantic token과 native disabled 동작만 재사용하며 공통 base component, 새 token, 새 의존성은 만들지 않는다.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest, Testing Library, Storybook 10.

## Global Constraints

- 외부 UI 라이브러리와 새 의존성을 추가하지 않는다.
- `aria-label: string`과 `children: ReactNode`는 필수다. children은 `aria-hidden` wrapper로 감싼다.
- `variant`는 `"primary" | "secondary" | "outline" | "ghost" | "destructive"`이며 기본값은 `"primary"`다.
- `loading` 기본값은 `false`다. loading이면 native `disabled`, `aria-busy="true"`, `data-state="loading"`을 적용한다.
- loading이 아니면 disabled일 때 `data-state="disabled"`, 나머지는 `"idle"`이다.
- 가로·세로 모두 `size.control.button.xl.height` token을 사용해 44 × 44 CSS px을 유지한다.
- Button의 API·파일·token을 변경하거나 두 컴포넌트용 새 추상화를 만들지 않는다.

---

## 파일 구조

- Create: `packages/components/src/actions/IconButton.tsx` — public props와 native button 렌더링
- Create: `packages/components/src/actions/IconButton.test.tsx` — API·상태·접근성 회귀 검사
- Create: `packages/components/src/actions/IconButton.css` — token-only visual states
- Modify: `packages/components/src/index.ts` — public export
- Modify: `packages/components/src/index.css` — CSS import
- Modify: `packages/components/package.json` — published CSS 목록
- Create: `apps/storybook/src/actions/IconButton.stories.tsx` — Storybook/axe 대상

### Task 1: Native API와 상태

**Files:**

- Create: `packages/components/src/actions/IconButton.tsx`
- Create: `packages/components/src/actions/IconButton.test.tsx`

**Interfaces:**

- Produces: `IconButtonVariant`, `IconButtonProps`, `IconButton`.
- `IconButtonProps` is `Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & { "aria-label": string; variant?: IconButtonVariant; loading?: boolean; children: ReactNode }`.

- [ ] **Step 1: 실패 테스트를 작성한다**

```tsx
import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { IconButton } from "./IconButton.js"

afterEach(cleanup)

describe("IconButton", () => {
  it("forwards its ref and native props while exposing its accessible name", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<IconButton ref={ref} aria-label="알림 닫기" name="dismiss" type="submit"><svg data-testid="icon" /></IconButton>)
    expect(screen.getByRole("button", { name: "알림 닫기" })).toBe(ref.current)
    expect(ref.current).toHaveAttribute("name", "dismiss")
    expect(ref.current).toHaveAttribute("type", "submit")
    expect(ref.current).toHaveAttribute("data-variant", "primary")
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true")
  })

  it("disables and preserves its accessible name while loading", () => {
    const onClick = vi.fn()
    render(<IconButton aria-label="저장" loading onClick={onClick}><svg /></IconButton>)
    const button = screen.getByRole("button", { name: "저장" })
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("data-state", "loading")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("uses native keyboard activation", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton aria-label="메뉴 열기" onClick={onClick}><svg /></IconButton>)
    const button = screen.getByRole("button", { name: "메뉴 열기" })
    button.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: test가 구현 부재로 실패하는지 확인한다**

Run: `pnpm test packages/components/src/actions/IconButton.test.tsx`

Expected: FAIL — `./IconButton.js`를 해석할 수 없다.

- [ ] **Step 3: 최소 구현을 작성한다**

```tsx
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type IconButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive"
export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & {
  "aria-label": string
  variant?: IconButtonVariant
  loading?: boolean
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { "aria-label": ariaLabel, children, className, disabled, loading = false, variant = "primary", ...props }, ref
) {
  const state = loading ? "loading" : disabled ? "disabled" : "idle"
  return <button {...props} ref={ref} aria-busy={loading || undefined} aria-label={ariaLabel} className={["jdsb-icon-button", className].filter(Boolean).join(" ")} data-state={state} data-variant={variant} disabled={disabled || loading}><span aria-hidden="true" data-slot="icon">{children}</span>{loading ? <span aria-hidden="true" data-slot="spinner" /> : null}</button>
})
```

- [ ] **Step 4: 상태 회귀 테스트를 추가한다**

```tsx
it.each(["primary", "secondary", "outline", "ghost", "destructive"] as const)("exposes the %s variant", (variant) => {
  render(<IconButton aria-label={`${variant} 작업`} variant={variant}><svg /></IconButton>)
  expect(screen.getByRole("button", { name: `${variant} 작업` })).toHaveAttribute("data-variant", variant)
})

it("exposes disabled without setting busy", () => {
  render(<IconButton aria-label="삭제" disabled><svg /></IconButton>)
  const button = screen.getByRole("button", { name: "삭제" })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute("data-state", "disabled")
  expect(button).not.toHaveAttribute("aria-busy")
})
```

- [ ] **Step 5: 검사하고 커밋한다**

Run: `pnpm test packages/components/src/actions/IconButton.test.tsx && pnpm --filter @jdsb/components typecheck`

Expected: PASS.

```bash
git add packages/components/src/actions/IconButton.tsx packages/components/src/actions/IconButton.test.tsx
git commit -m "feat: IconButton native API 추가"
```

### Task 2: CSS와 package public surface

**Files:**

- Create: `packages/components/src/actions/IconButton.css`
- Modify: `packages/components/src/index.ts`
- Modify: `packages/components/src/index.css`
- Modify: `packages/components/package.json`
- Modify: `packages/components/src/actions/IconButton.test.tsx`

**Interfaces:**

- Consumes: Task 1의 `.jdsb-icon-button`, `data-state`, `data-variant`, `IconButton`.
- Produces: root import와 `@jdsb/components/css`에서 사용 가능한 public API와 CSS.

- [ ] **Step 1: 실패하는 public export test를 추가한다**

```tsx
import { IconButton as PublicIconButton } from "../index.js"

it("exports the public IconButton", () => {
  render(<PublicIconButton aria-label="메뉴 열기"><svg /></PublicIconButton>)
  expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveClass("jdsb-icon-button")
})
```

- [ ] **Step 2: export test가 실패하는지 확인한다**

Run: `pnpm test packages/components/src/actions/IconButton.test.tsx`

Expected: FAIL — `../index.js`가 `IconButton`을 export하지 않는다.

- [ ] **Step 3: token-only CSS와 exports를 작성한다**

`IconButton.css`는 `.jdsb-icon-button`에 `align-items`, `display: inline-flex`, `justify-content`, `position: relative`, `font: inherit`, `cursor`, primary background/border/color와 `height`·`width: var(--jdsb-size-control-button-xl-height)`를 적용한다. Button CSS와 같은 variant, hover, active, disabled, focus-visible selector를 `.jdsb-icon-button`으로 반복한다. spinner와 icon은 각각 `data-slot="spinner"`, `data-slot="icon"`을 사용한다. spinner는 `size.control.icon`, `size.border`, `color.action.primary.foreground/background`, `radius.control`, `duration.spinner`, `angle.turn` token으로 만들고 loading에서는 icon opacity를 `opacity.hidden`으로 바꾼다. motion reduction과 forced-colors media query도 Button과 동등하게 추가한다.

Add exactly to `index.ts`:

```ts
export { IconButton, type IconButtonProps, type IconButtonVariant } from "./actions/IconButton.js"
```

Add exactly to `index.css`:

```css
@import "./actions/IconButton.css";
```

Add `"src/actions/IconButton.css"` to `packages/components/package.json` `files` array.

- [ ] **Step 4: export·package 검사를 통과시키고 커밋한다**

Run: `pnpm test packages/components/src/actions/IconButton.test.tsx && pnpm typecheck && pnpm build && pnpm lint`

Expected: PASS.

```bash
git add packages/components/src/actions/IconButton.css packages/components/src/actions/IconButton.test.tsx packages/components/src/index.ts packages/components/src/index.css packages/components/package.json
git commit -m "feat: IconButton 스타일과 export 추가"
```

### Task 3: Storybook 문서와 전체 검증

**Files:**

- Create: `apps/storybook/src/actions/IconButton.stories.tsx`

**Interfaces:**

- Consumes: public `IconButton` export.
- Produces: `Actions/IconButton` 문서와 axe 대상 stories.

- [ ] **Step 1: Story와 interaction play test를 작성한다**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { IconButton } from "@jdsb/components"

function CloseIcon() { return <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3 3 10 10M13 3 3 13" /></svg> }

const meta = { title: "Actions/IconButton", component: IconButton, args: { "aria-label": "닫기", children: <CloseIcon />, type: "button" } } satisfies Meta<typeof IconButton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
}
export const Variants: Story = { render: () => <div><IconButton aria-label="저장"><CloseIcon /></IconButton><IconButton aria-label="미리 보기" variant="secondary"><CloseIcon /></IconButton><IconButton aria-label="취소" variant="outline"><CloseIcon /></IconButton><IconButton aria-label="메뉴" variant="ghost"><CloseIcon /></IconButton><IconButton aria-label="삭제" variant="destructive"><CloseIcon /></IconButton></div> }
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { "aria-label": "저장 중", loading: true } }
export const LongLabel: Story = { args: { "aria-label": "현재 편집 중인 문서를 닫고 변경 사항을 저장하지 않습니다" } }
```

- [ ] **Step 2: 전체 자동 검사를 통과시킨다**

Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint && pnpm --filter @jdsb/storybook build`

Expected: all commands exit 0; Storybook preview의 axe error mode가 모든 IconButton Story를 통과한다.

- [ ] **Step 3: 수동 접근성을 확인하고 커밋한다**

Storybook에서 Tab/Shift+Tab, Enter, Space, disabled, loading, 200% zoom, forced-colors를 확인한다. 스크린리더에서 `aria-label` 이름과 busy·disabled 상태 안내를 확인한다.

```bash
git add apps/storybook/src/actions/IconButton.stories.tsx
git commit -m "feat: IconButton Storybook 문서 추가"
```

## 자체 점검

- Task 1은 public API, native semantics, accessible name, loading/disabled 상태를 검증한다.
- Task 2는 token-only 44 × 44 CSS와 public package export를 연결한다.
- Task 3은 Storybook, axe, 전체 검사와 수동 접근성 검증을 다룬다.
- `IconButton`, `IconButtonProps`, `IconButtonVariant`, `data-state`, `data-variant`가 모든 task에서 같은 이름과 값으로 사용된다.
