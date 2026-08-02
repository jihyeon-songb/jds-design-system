# RadioGroup 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Native radio 동작을 보존하는 접근 가능한 controlled·uncontrolled RadioGroup을 `@jds/components`에 추가한다.

**Architecture:** `RadioGroup`은 Context로 값·name·상태를 Item에 전달하는 `role="radiogroup"` div다. `RadioGroupItem`은 native radio 한 개만 렌더링하고 label은 기존 `Label`/`FieldLabel`에 맡긴다. 브라우저가 radio의 키보드·폼 동작을 담당하며 React는 선택값과 `data-state`만 동기화한다.

**Tech Stack:** React 19, TypeScript, native HTML radio input, CSS custom properties, Vitest, Testing Library, Storybook 10.

## Global Constraints

- 외부 UI 라이브러리나 새 의존성을 추가하지 않는다.
- 모든 시각 값은 `@jds/tokens`의 semantic 또는 component token CSS 변수만 사용한다.
- Item label은 `Label` 또는 `FieldLabel`의 `htmlFor`로 연결하고 Item label prop을 추가하지 않는다.
- native `type="radio"`, name group, keyboard, form submission, required validation, reset을 보존한다.
- `RadioGroupItem`에는 `value`가 필수이며 `checked`, `defaultChecked`, `name`, `required`, `type`, `value` 전달은 금지한다.
- `value`/`defaultValue`/`onValueChange`, disabled, invalid, required, vertical/horizontal만 이 작업 범위에 둔다.
- 공개 API·상호작용 변경에는 Storybook axe와 수동 키보드·스크린리더 확인을 포함한다.

---

## 파일 구조

- Create: `packages/components/src/inputs/RadioGroup.tsx` — Root·Item 공개 API, Context, native radio 상태 동기화.
- Create: `packages/components/src/inputs/RadioGroup.css` — token 기반 root 방향과 radio 상태 스타일.
- Create: `packages/components/src/inputs/RadioGroup.test.tsx` — public API, native form, state, keyboard 회귀 검사.
- Modify: `packages/tokens/src/jds.tokens.json` — radio 크기·target 토큰.
- Modify: `packages/components/src/index.ts` — RadioGroup public export.
- Modify: `packages/components/src/index.css` — RadioGroup CSS public import.
- Modify: `packages/components/package.json` — publish files에 CSS 추가.
- Create: `apps/storybook/src/inputs/RadioGroup.stories.tsx` — 사용법, 상태, axe 대상 Story.

### Task 1: RadioGroup native API와 상태 동기화

**Files:**

- Create: `packages/components/src/inputs/RadioGroup.tsx`
- Create: `packages/components/src/inputs/RadioGroup.test.tsx`

**Interfaces:**

- Produces: `RadioGroupProps`, `RadioGroupItemProps`, `RadioGroup`, `RadioGroupItem`.
- Produces: Root `data-state="enabled|invalid|disabled"`, Root `data-orientation="vertical|horizontal"`, Item `data-state="unchecked|checked|invalid|disabled"`.

- [ ] **Step 1: 실패하는 native API 테스트를 작성한다**

```tsx
import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { RadioGroup, RadioGroupItem } from "./RadioGroup.js"

afterEach(cleanup)

function DeliveryGroup(props: Partial<React.ComponentProps<typeof RadioGroup>> = {}) {
  return (
    <RadioGroup aria-label="배송 방식" name="delivery" {...props}>
      <RadioGroupItem id="standard" value="standard" />
      <label htmlFor="standard">일반 배송</label>
      <RadioGroupItem id="express" value="express" />
      <label htmlFor="express">빠른 배송</label>
    </RadioGroup>
  )
}

describe("RadioGroup", () => {
  it("renders fixed native radios and forwards ref and form props", () => {
    const ref = createRef<HTMLInputElement>()
    render(<RadioGroup aria-label="배송 방식" name="delivery" required><RadioGroupItem ref={ref} id="standard" value="standard" form="checkout" /></RadioGroup>)
    expect(ref.current).toHaveAttribute("type", "radio")
    expect(ref.current).toHaveAttribute("name", "delivery")
    expect(ref.current).toHaveAttribute("value", "standard")
    expect(ref.current).toHaveAttribute("form", "checkout")
    expect(ref.current).toBeRequired()
  })

  it("updates uncontrolled value and native FormData", async () => {
    const user = userEvent.setup()
    render(<form><DeliveryGroup defaultValue="standard" /></form>)
    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))
    expect(screen.getByRole("radio", { name: "일반 배송" })).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toBeChecked()
    expect(new FormData(screen.getByRole("radio", { name: "빠른 배송" }).closest("form")!).get("delivery")).toBe("express")
  })
})
```

- [ ] **Step 2: 테스트가 구현 부재로 실패하는지 확인한다**

Run: `pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

Expected: FAIL — `./RadioGroup.js`를 해석할 수 없다.

- [ ] **Step 3: 최소 Context와 native radio 구현을 작성한다**

```tsx
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

type RadioGroupContextValue = {
  disabled: boolean
  invalid: boolean
  name: string | undefined
  required: boolean
  selectedValue: string | undefined
  requestValue: (value: string, defaultPrevented: boolean) => void
  resetUncontrolled: () => void
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext(): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")
  return context
}

export type RadioGroupProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  children: ReactNode
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  name?: string
  onValueChange?: (value: string) => void
  orientation?: "vertical" | "horizontal"
  required?: boolean
  value?: string
}

export type RadioGroupItemProps = Omit<ComponentPropsWithoutRef<"input">, "checked" | "defaultChecked" | "name" | "required" | "type" | "value"> & { value: string }
```

Implement `RadioGroup` with `useState(defaultValue)`, `selectedValue = value ?? uncontrolledValue`, and a `requestValue` function that returns when `event.defaultPrevented` is true, updates uncontrolled value only when `value === undefined`, then invokes `onValueChange`. Keep current `defaultValue` and controlled status in refs; `resetUncontrolled` queues `setUncontrolledValue(defaultValueRef.current)` only while uncontrolled. Render the Context provider and one div with `role="radiogroup"`, `aria-invalid={invalid ? true : ariaInvalid}`, `data-orientation`, and disabled > invalid > enabled root state.

Implement `RadioGroupItem` as `forwardRef<HTMLInputElement, RadioGroupItemProps>`. Its `checked` value is `selectedValue === value`; its disabled value is `group.disabled || disabled`; its state priority is disabled > group invalid > checked > unchecked. Compose its forwarded ref in a callback ref, attach a `reset` listener to `node.form`, and remove the preceding listener before replacing the node. On reset call `resetUncontrolled`. Render `<input {...props}>` with fixed `type="radio"`, Context name/required/checked/disabled, class `jds-radio-group-item`, state data attribute, and an `onChange` that calls the consumer handler before `requestValue(value, event.defaultPrevented)`.

- [ ] **Step 4: 테스트와 component typecheck를 통과시킨다**

Run: `pnpm test packages/components/src/inputs/RadioGroup.test.tsx && pnpm --filter @jds/components typecheck`

Expected: PASS.

- [ ] **Step 5: 커밋한다**

```sh
git add packages/components/src/inputs/RadioGroup.tsx packages/components/src/inputs/RadioGroup.test.tsx
git commit -m "feat: RadioGroup native API 추가"
```

### Task 2: 상태·reset·keyboard 회귀 테스트와 token CSS

**Files:**

- Modify: `packages/components/src/inputs/RadioGroup.test.tsx`
- Modify: `packages/tokens/src/jds.tokens.json`
- Create: `packages/components/src/inputs/RadioGroup.css`

**Interfaces:**

- Consumes: Task 1의 RadioGroup public API 및 `data-state`/`data-orientation` attribute.
- Produces: `--jds-size-control-radio-size`, `--jds-space-radio-target`, `.jds-radio-group`, `.jds-radio-group-item`.

- [ ] **Step 1: 상태, reset, keyboard의 실패 테스트를 추가한다**

```tsx
it("keeps controlled value and does not notify after a prevented change", async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  render(<DeliveryGroup value="standard" onValueChange={onValueChange} />)
  await user.click(screen.getByRole("radio", { name: "빠른 배송" }))
  expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
  expect(onValueChange).toHaveBeenCalledWith("express")

  render(<RadioGroup aria-label="배송 방식" name="delivery" onValueChange={onValueChange}><RadioGroupItem aria-label="일반 배송" value="standard" onChange={(event) => event.preventDefault()} /></RadioGroup>)
  await user.click(screen.getByRole("radio", { name: "일반 배송" }))
  expect(onValueChange).not.toHaveBeenCalledWith("standard")
})

it("aligns data-state after form reset and preserves native keyboard behavior", async () => {
  const user = userEvent.setup()
  render(<form><DeliveryGroup defaultValue="standard" /><button type="reset">초기화</button></form>)
  const standard = screen.getByRole("radio", { name: "일반 배송" })
  const express = screen.getByRole("radio", { name: "빠른 배송" })
  standard.focus()
  await user.keyboard("{ArrowRight}")
  expect(express).toBeChecked()
  expect(express).toHaveAttribute("data-state", "checked")
  await user.click(screen.getByRole("button", { name: "초기화" }))
  expect(standard).toBeChecked()
  expect(standard).toHaveAttribute("data-state", "checked")
})

it("applies group and item disabled, invalid, required state precedence", () => {
  const { rerender } = render(<DeliveryGroup defaultValue="standard" invalid required />)
  const group = screen.getByRole("radiogroup", { name: "배송 방식" })
  const standard = screen.getByRole("radio", { name: "일반 배송" })
  expect(group).toHaveAttribute("aria-invalid", "true")
  expect(standard).toBeRequired()
  expect(standard).toHaveAttribute("data-state", "invalid")
  rerender(<DeliveryGroup defaultValue="standard" disabled invalid />)
  expect(group).toHaveAttribute("data-state", "disabled")
  expect(standard).toBeDisabled()
  expect(standard).toHaveAttribute("data-state", "disabled")
})
```

Add `vi` to the Vitest imports. Add one test that clicking a native `<label htmlFor>` checks the Item, and one that `expect(() => render(<RadioGroupItem value="standard" />)).toThrow("RadioGroupItem must be used within RadioGroup")`.

- [ ] **Step 2: 새 동작 테스트가 실패하는지 확인한다**

Run: `pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

Expected: FAIL until reset handling and state propagation are complete.

- [ ] **Step 3: token 원본과 CSS를 추가한다**

Add the following DTCG entries without changing existing token values:

```json
"radio": { "size": { "$value": "16px", "$type": "dimension" } }
```

under `size.control`, and:

```json
"radio": { "target": { "$value": "4px", "$type": "dimension" } }
```

under `space`.

Create `RadioGroup.css`:

```css
.jds-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--jds-space-field-item);
}

.jds-radio-group[data-orientation="horizontal"] {
  flex-direction: row;
}

.jds-radio-group-item {
  accent-color: var(--jds-color-action-primary-background);
  block-size: var(--jds-size-control-radio-size);
  box-sizing: content-box;
  inline-size: var(--jds-size-control-radio-size);
  margin: 0;
  padding: var(--jds-space-radio-target);
  vertical-align: middle;
}

.jds-radio-group-item[data-state="invalid"] {
  outline: var(--jds-size-border) solid var(--jds-color-field-invalid-border);
  outline-offset: var(--jds-size-border);
}

.jds-radio-group-item[data-state="disabled"] {
  opacity: var(--jds-opacity-disabled);
}

.jds-radio-group-item:focus-visible {
  outline: var(--jds-size-focus) solid var(--jds-color-focus-ring);
  outline-offset: var(--jds-size-focus);
}

@media (forced-colors: active) {
  .jds-radio-group-item { forced-color-adjust: auto; }
}
```

- [ ] **Step 4: token build와 회귀 테스트를 통과시킨다**

Run: `pnpm --filter @jds/tokens build && pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

Expected: PASS; 생성 CSS에는 radio size·target custom property가 포함된다.

- [ ] **Step 5: 커밋한다**

```sh
git add packages/tokens/src/jds.tokens.json packages/components/src/inputs/RadioGroup.css packages/components/src/inputs/RadioGroup.test.tsx
git commit -m "feat: RadioGroup 상태 스타일 추가"
```

### Task 3: Public export와 Storybook 문서

**Files:**

- Modify: `packages/components/src/index.ts`
- Modify: `packages/components/src/index.css`
- Modify: `packages/components/package.json`
- Modify: `packages/components/src/inputs/RadioGroup.test.tsx`
- Create: `apps/storybook/src/inputs/RadioGroup.stories.tsx`

**Interfaces:**

- Consumes: Task 1의 `RadioGroup`, `RadioGroupItem`, props types; Task 2의 CSS and radio tokens; existing `Field*` and `Label` components.
- Produces: `@jds/components` named exports and `@jds/components/css` RadioGroup styles; Storybook `Inputs/RadioGroup` stories.

- [ ] **Step 1: public package entrypoint의 실패 테스트를 추가한다**

```tsx
import {
  RadioGroup as PublicRadioGroup,
  RadioGroupItem as PublicRadioGroupItem,
  type RadioGroupItemProps as PublicRadioGroupItemProps,
  type RadioGroupProps as PublicRadioGroupProps,
} from "../index.js"
import {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupProps,
} from "./RadioGroup.js"

it("exports the public components and props types", () => {
  expect(PublicRadioGroup).toBe(RadioGroup)
  expect(PublicRadioGroupItem).toBe(RadioGroupItem)
  expectTypeOf<PublicRadioGroupProps>().toEqualTypeOf<RadioGroupProps>()
  expectTypeOf<PublicRadioGroupItemProps>().toEqualTypeOf<RadioGroupItemProps>()
})
```

Add `expectTypeOf` to the Vitest imports.

- [ ] **Step 2: export 누락으로 테스트가 실패하는지 확인한다**

Run: `pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

Expected: FAIL — package index가 RadioGroup exports를 제공하지 않는다.

- [ ] **Step 3: package exports와 Storybook Story를 작성한다**

Add this entry to `packages/components/src/index.ts`:

```ts
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupProps,
} from "./inputs/RadioGroup.js"
```

Add `@import "./inputs/RadioGroup.css";` to `packages/components/src/index.css` and add `src/inputs/RadioGroup.css` to the `files` array in `packages/components/package.json`.

Create `RadioGroup.stories.tsx` with a `deliveryOptions` JSX constant that uses `Field`, `FieldLabel`, and two RadioGroupItems (`standard`, `express`). Export stories named `Default`, `Unselected`, `Horizontal`, `DisabledItem`, `Disabled`, `Invalid`, `Required`, `Controlled`, and `LongLabel`. Give every Group an `aria-label` or `aria-labelledby`; `Controlled` owns its `value` state with `useState`; `Invalid` connects `FieldDescription` and `FieldError` with `aria-describedby` on the Group. In `Default.play`, click the express label, assert the radio is checked, focus it, press ArrowLeft, and assert the standard radio is checked.

- [ ] **Step 4: public API, typecheck, Storybook build를 통과시킨다**

Run: `pnpm test packages/components/src/inputs/RadioGroup.test.tsx && pnpm typecheck && pnpm --filter @jds/storybook typecheck && pnpm --filter @jds/storybook build`

Expected: PASS; every RadioGroup Story builds with the configured axe checks.

- [ ] **Step 5: 전체 검증과 수동 접근성 검사를 수행한다**

Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint`

Expected: PASS.

In Storybook, manually verify Tab/Shift+Tab entry, Space, Left/Right/Up/Down arrows, visible focus, label click, required validation, form reset, 200% browser zoom, forced-colors, and screen-reader announcement of group name, item labels, selected state, disabled state, and invalid state.

- [ ] **Step 6: 커밋한다**

```sh
git add packages/components/src/index.ts packages/components/src/index.css packages/components/package.json packages/components/src/inputs/RadioGroup.test.tsx apps/storybook/src/inputs/RadioGroup.stories.tsx
git commit -m "feat: RadioGroup 문서와 export 추가"
```

## 자체 검토

- Spec coverage: Task 1은 controlled·uncontrolled native API, Context, reset과 모든 state attribute를 구현한다. Task 2는 native keyboard/form 회귀와 token-only CSS를 검증한다. Task 3은 public package, Storybook, axe, 전체·수동 검증을 다룬다.
- Placeholder scan: `TODO`, `TBD`, 모호한 후속 구현 문구 없이 모든 파일·테스트·명령·commit 범위를 명시했다.
- Type consistency: 세 Task에서 `RadioGroup`, `RadioGroupItem`, `RadioGroupProps`, `RadioGroupItemProps`, `data-state`, `data-orientation` 이름을 일관되게 사용한다.
