# Separator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@jdsb/components`에 접근 가능한 가로·세로 `Separator`를 추가한다.

**Architecture:** `Separator`는 기본 가로 방향에서 native `<hr>`를 사용하고, 세로 방향에서만 `role="separator"`인 `<div>`를 렌더링한다. 상태와 상호작용은 추가하지 않으며, 기존 `color.field.border`와 `size.border` token으로 CSS를 구성한다. 패키지 배럴과 CSS 진입점에 등록해 JavaScript와 스타일을 함께 배포한다.

**Tech Stack:** TypeScript, React 19, `@jdsb/tokens` CSS custom properties, Vitest + Testing Library, Storybook + axe.

## Global Constraints

- 새 런타임·개발 의존성을 추가하지 않는다.
- 공개 API는 `SeparatorOrientation`, `SeparatorProps`, `Separator`를 명시적으로 export한다.
- `orientation`은 `"horizontal" | "vertical"`만 허용하며 기본값은 `"horizontal"`이다.
- 가로는 native `<hr>`로, 세로는 `<div role="separator" aria-orientation="vertical">`로 렌더링한다.
- keyboard handler, `tabIndex`, focus style, label·children·decorative·variant·size API를 추가하지 않는다.
- 선의 색과 두께는 `--jdsb-color-field-border`와 `--jdsb-size-border`를 사용한다. browser 기본 스타일을 제거하는 `border: 0`과 `margin: 0`만 리터럴 reset으로 허용한다.
- 소비자의 `className`, native 속성, 이벤트와 해당 native ref를 보존한다.
- 모든 Storybook Story는 axe 검사 대상에 남긴다.

---

## 파일 구성

- `packages/components/src/layout/Separator.tsx`: 방향별 native markup, prop 타입, ref forwarding.
- `packages/components/src/layout/Separator.css`: 가로·세로 선의 token 기반 스타일과 forced-colors 처리.
- `packages/components/src/layout/Separator.test.tsx`: package export, native 의미, prop·이벤트·ref 전달 검사.
- `packages/components/src/index.ts`: 공개 컴포넌트와 타입 배럴 export.
- `packages/components/src/index.css`: Separator stylesheet import.
- `packages/components/package.json`: npm 배포 CSS allowlist 등록.
- `apps/storybook/src/layout/Separator.stories.tsx`: 가로와 세로 사용 예 및 play 접근성 의미 검사.

## Task 1: Separator 구현, 문서, 배포 표면 추가

**Files:**

- Create: `packages/components/src/layout/Separator.tsx`
- Create: `packages/components/src/layout/Separator.css`
- Create: `packages/components/src/layout/Separator.test.tsx`
- Create: `apps/storybook/src/layout/Separator.stories.tsx`
- Modify: `packages/components/src/index.ts`
- Modify: `packages/components/src/index.css`
- Modify: `packages/components/package.json`

**Interfaces:**

- Consumes: `ComponentPropsWithoutRef`, `ComponentPropsWithRef`, `forwardRef`, `ReactElement` from React; `--jdsb-color-field-border` and `--jdsb-size-border` from `@jdsb/tokens` CSS.
- Produces: `SeparatorOrientation = "horizontal" | "vertical"`, `SeparatorProps`, `Separator` from `@jdsb/components`.

- [ ] **Step 1: Write the failing component tests**

Create `packages/components/src/layout/Separator.test.tsx` with package-entry identity, native semantics, horizontal ref/attribute forwarding, and vertical ref/event forwarding coverage.

```tsx
import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Separator as PublicSeparator,
  type SeparatorOrientation as PublicSeparatorOrientation,
  type SeparatorProps as PublicSeparatorProps,
} from "../index.js"
import { Separator } from "./Separator.js"

afterEach(cleanup)

describe("Separator", () => {
  it("exports Separator and its public types from the package entry", () => {
    const horizontalProps: PublicSeparatorProps = { "aria-label": "구획" }
    const verticalProps: PublicSeparatorProps = { orientation: "vertical", "aria-label": "도구 모음 구획" }
    const orientation: PublicSeparatorOrientation = "vertical"
    render(<PublicSeparator {...horizontalProps} />)

    expect(PublicSeparator).toBe(Separator)
    expect(verticalProps.orientation).toBe(orientation)
    expect(screen.getByRole("separator", { name: "구획" }).tagName).toBe("HR")
  })

  it("renders a horizontal hr by default and forwards its props and ref", () => {
    const ref = createRef<HTMLHRElement>()
    render(<Separator aria-label="내용 구획" className="consumer-separator" id="content-separator" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole("separator", { name: "내용 구획" }))
    expect(ref.current?.tagName).toBe("HR")
    expect(ref.current).toHaveAttribute("id", "content-separator")
    expect(ref.current).toHaveClass("jdsb-separator", "consumer-separator")
  })

  it("renders a vertical separator and forwards its event and ref", () => {
    const ref = createRef<HTMLDivElement>()
    const onClick = vi.fn()
    render(<Separator aria-label="도구 모음 구획" onClick={onClick} orientation="vertical" ref={ref} />)

    const separator = screen.getByRole("separator", { name: "도구 모음 구획" })
    expect(ref.current).toBe(separator)
    expect(separator.tagName).toBe("DIV")
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
    fireEvent.click(separator)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm test -- packages/components/src/layout/Separator.test.tsx`

Expected: FAIL because `./Separator.js` and its package-entry exports do not exist.

- [ ] **Step 3: Add the minimal component and styles**

Create `packages/components/src/layout/Separator.tsx`. Use a single `forwardRef<HTMLHRElement | HTMLDivElement, SeparatorProps>` component so Storybook can consume both orientation branches; the ref still receives the rendered native element.

```tsx
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react"

export type SeparatorOrientation = "horizontal" | "vertical"
type HorizontalSeparatorProps = ComponentPropsWithoutRef<"hr"> & { orientation?: "horizontal" }
type VerticalSeparatorProps = ComponentPropsWithoutRef<"div"> & { orientation: "vertical" }
export type SeparatorProps = HorizontalSeparatorProps | VerticalSeparatorProps

export const Separator = forwardRef<HTMLHRElement | HTMLDivElement, SeparatorProps>(function Separator(
  { className, orientation = "horizontal", ...props },
  ref,
) {
  const classNames = ["jdsb-separator", className].filter(Boolean).join(" ")

  if (orientation === "vertical") {
    return <div {...(props as ComponentPropsWithoutRef<"div">)} ref={ref as Ref<HTMLDivElement>} aria-orientation="vertical" className={classNames} role="separator" />
  }

  return <hr {...(props as ComponentPropsWithoutRef<"hr">)} ref={ref as Ref<HTMLHRElement>} className={classNames} />
})
```

Create `packages/components/src/layout/Separator.css`.

```css
.jdsb-separator {
  border: 0;
  margin: 0;
}

hr.jdsb-separator {
  border-block-start: var(--jdsb-size-border) solid var(--jdsb-color-field-border);
}

div.jdsb-separator[aria-orientation="vertical"] {
  align-self: stretch;
  border-inline-start: var(--jdsb-size-border) solid var(--jdsb-color-field-border);
}

@media (forced-colors: active) {
  .jdsb-separator {
    forced-color-adjust: auto;
  }
}
```

Update the package surface.

```ts
// packages/components/src/index.ts
export {
  Separator,
  type SeparatorOrientation,
  type SeparatorProps,
} from "./layout/Separator.js"
```

```css
/* packages/components/src/index.css */
@import "./layout/Separator.css";
```

Add `"src/layout/Separator.css"` to the `files` array in `packages/components/package.json` beside `src/layout/Card.css`.

- [ ] **Step 4: Run the focused test and typecheck**

Run: `pnpm test -- packages/components/src/layout/Separator.test.tsx && pnpm typecheck`

Expected: PASS. The component is exported, both native forms retain their expected ref and accessibility semantics, and all workspace TypeScript projects typecheck.

- [ ] **Step 5: Add Storybook coverage**

Create `apps/storybook/src/layout/Separator.stories.tsx`.

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Button, Separator } from "@jdsb/components"

const meta = {
  title: "Layout/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { "aria-label": "내용 구획" },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "내용 구획" })
    expect(separator.tagName).toBe("HR")
  },
}

export const Vertical: Story = {
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--jdsb-space-button-gap)" }}>
      <Button>복사</Button>
      <Separator aria-label="도구 모음 구획" orientation="vertical" />
      <Button>붙여넣기</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "도구 모음 구획" })
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
  },
}
```

- [ ] **Step 6: Run package and Storybook verification**

Run: `pnpm test -- packages/components/src/layout/Separator.test.tsx && pnpm typecheck && pnpm build && pnpm lint`

Expected: PASS for all commands.

With Storybook already serving at port 6006, run: `pnpm --filter @jdsb/storybook test`

Expected: PASS, including axe checks for `Layout/Separator` stories and their play functions.

- [ ] **Step 7: Commit the implementation**

```bash
git add packages/components/src/layout/Separator.tsx packages/components/src/layout/Separator.css packages/components/src/layout/Separator.test.tsx packages/components/src/index.ts packages/components/src/index.css packages/components/package.json apps/storybook/src/layout/Separator.stories.tsx
git commit -m "feat: Separator 컴포넌트 추가"
```

## Plan self-review

- Spec coverage: Task 1 covers both native renderings, the restricted API surface, ref·attribute·event forwarding, token-only styling, forced-colors, package CSS publication, Storybook play checks, axe execution, and all required repository checks.
- Placeholder scan: no TBD, deferred implementation, ambiguous error handling, or implicit test steps remain.
- Type consistency: `SeparatorOrientation`, `SeparatorProps`, `Separator`, `HorizontalSeparatorProps`, and `VerticalSeparatorProps` use the same names throughout the component, tests, barrel export, and Storybook plan.
