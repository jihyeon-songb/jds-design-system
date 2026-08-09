# Accordion 구현 계획

> **에이전트 작업자용:** 이 계획을 작업별로 구현할 때 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans` 하위 스킬을 반드시 사용한다. 진행 상태는 체크박스로 관리한다.

**목표:** single·multiple controlled/uncontrolled 상태와 native heading/button 의미를 갖는 접근 가능한 Accordion을 `@jdsb/components`에 추가한다.

**구조:** `Accordion`은 type별 열린 value, 상태 변경 요청, ID prefix, heading level을 root Context로 제공한다. `AccordionItem`은 자신만의 value·disabled·open 상태와 Trigger/Content ID를 item Context로 제공하고 native button이 click·Enter·Space·Tab 동작을 담당한다.

**기술:** React 19, TypeScript, native HTML heading/button, CSS custom properties, Vitest, Testing Library, Storybook 10.

## 공통 제약

- 새 의존성, custom 키보드 탐색, animation, lazy mount, `collapsible` API, `region` 자동 부여를 추가하지 않는다.
- `type="single"`은 `string | null`, `type="multiple"`은 `string[]` value API를 사용하며 각 type은 controlled 또는 uncontrolled 방식 중 하나만 받는다.
- 같은 Root 안의 `AccordionItem value`는 고유해야 하며, disabled Item은 open 상태를 보존하고 Trigger만 비활성화한다.
- 모든 시각 값은 기존 semantic CSS token을 재사용하고 literal visual value를 추가하지 않는다.
- native Tab 순서와 Enter·Space 동작을 보존하고, 24 × 24 CSS px 이상 target, 2px focus, forced-colors, Storybook axe와 수동 keyboard/screen-reader 검사를 제공한다.

---

## 파일 구성

- 생성 `packages/components/src/navigation/Accordion.tsx`: compound API, type별 상태와 ARIA ID 관계.
- 생성 `packages/components/src/navigation/Accordion.test.tsx`: public API·state·keyboard·disabled 회귀 검사.
- 생성 `packages/components/src/navigation/Accordion.css`: token-only Accordion styles.
- 수정 `packages/components/src/index.ts`, `index.css`, `package.json`: public exports와 package CSS surface.
- 생성 `apps/storybook/src/navigation/Accordion.stories.tsx`: single·multiple·controlled·disabled 문서와 play test.

### 작업 1: compound API와 기본 상태를 구현한다

**파일:**

- 생성: `packages/components/src/navigation/Accordion.tsx`
- 테스트: `packages/components/src/navigation/Accordion.test.tsx`

**인터페이스:**

- 제공: `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionContent`.
- 제공: `AccordionType`, `AccordionProps`, `AccordionItemProps`, `AccordionHeaderProps`, `AccordionTriggerProps`, `AccordionContentProps`.
- 제공: Item/Trigger 상태 `open|closed|disabled`, Content 상태 `open|closed`.

- [ ] **1단계: 실패하는 single·multiple 상태 테스트를 작성한다**

```tsx
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "./Accordion.js"

afterEach(cleanup)

function Item({ value, children, disabled = false }: { value: string; children: string; disabled?: boolean }) {
  return <AccordionItem disabled={disabled} value={value}>
    <AccordionHeader><AccordionTrigger>{value}</AccordionTrigger></AccordionHeader>
    <AccordionContent>{children}</AccordionContent>
  </AccordionItem>
}

describe("Accordion", () => {
  it("single Trigger와 Content를 연결하고 다시 닫는다", async () => {
    const user = userEvent.setup()
    render(<Accordion defaultValue="shipping" type="single"><Item value="shipping">배송 안내</Item><Item value="returns">반품 안내</Item></Accordion>)
    const shipping = screen.getByRole("button", { name: "shipping" })
    const content = screen.getByText("배송 안내").parentElement!
    expect(shipping).toHaveAttribute("aria-expanded", "true")
    expect(shipping).toHaveAttribute("aria-controls", content.id)
    expect(content).toHaveAttribute("aria-labelledby", shipping.id)
    expect(content).not.toHaveAttribute("hidden")
    await user.click(shipping)
    expect(shipping).toHaveAttribute("aria-expanded", "false")
    expect(content).toHaveAttribute("hidden")
  })

  it("multiple은 기존 열린 항목을 유지하고 요청한 value만 전환한다", async () => {
    const user = userEvent.setup()
    render(<Accordion defaultValue={["shipping", "returns"]} type="multiple"><Item value="shipping">배송 안내</Item><Item value="returns">반품 안내</Item><Item value="payment">결제 안내</Item></Accordion>)
    await user.click(screen.getByRole("button", { name: "payment" }))
    expect(screen.getByRole("button", { name: "shipping" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "payment" })).toHaveAttribute("aria-expanded", "true")
    await user.click(screen.getByRole("button", { name: "returns" }))
    expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "false")
  })
})
```

- [ ] **2단계: 테스트가 실패하는지 확인한다**

실행: `pnpm test packages/components/src/navigation/Accordion.test.tsx`

예상: `./Accordion.js`를 찾지 못해 실패한다.

- [ ] **3단계: 최소 compound 구현을 작성한다**

명시적으로 닫힌 controlled single Accordion을 uncontrolled 상태와 구별하려고 controlled single branch에는 `value: string | null`을 사용한다. controlled multiple branch에는 `value: string[]`을 필수로 둔다.

```tsx
export type AccordionType = "single" | "multiple"
type AccordionSingleProps =
  | { type: "single"; defaultValue?: string; value?: never; onValueChange?: (value: string | null) => void }
  | { type: "single"; defaultValue?: never; value: string | null; onValueChange?: (value: string | null) => void }
type AccordionMultipleProps =
  | { type: "multiple"; defaultValue?: string[]; value?: never; onValueChange?: (value: string[]) => void }
  | { type: "multiple"; defaultValue?: never; value: string[]; onValueChange?: (value: string[]) => void }
export type AccordionProps = ComponentPropsWithoutRef<"div"> & (AccordionSingleProps | AccordionMultipleProps) & { children: ReactNode; headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 }
export type AccordionItemProps = ComponentPropsWithoutRef<"div"> & { children: ReactNode; disabled?: boolean; value: string }
export type AccordionHeaderProps = ComponentPropsWithoutRef<"h3">
export type AccordionTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "aria-controls" | "aria-expanded" | "disabled" | "id" | "type">
export type AccordionContentProps = Omit<ComponentPropsWithoutRef<"div">, "aria-labelledby" | "hidden" | "id">
```

`useAccordionContext`와 `useAccordionItemContext`를 추가한다. Context가 없을 때 각각 `Accordion compound components must be used within Accordion`, `Accordion item components must be used within AccordionItem` 오류를 던진다. Root Context는 `{ headingLevel, idPrefix, isOpen, requestValue }`, Item Context는 `{ contentId, disabled, open, triggerId, value }`를 제공한다.

`Accordion`은 `useId`와 `useState(defaultValue)`로 Root 상태를 만든다. `AccordionItem`도 `useId`를 호출해 Root prefix와 조합한 Trigger·Content ID를 만들므로 중복 value도 ARIA ID 충돌을 만들지 않는다. `isOpen`은 single value 동등성 또는 multiple 배열의 `includes`로 계산한다. `requestValue`에서 single의 열린 value는 `null`로, 다른 single value는 해당 value로 바꾼다. multiple은 `includes`와 `filter`/spread로 현재 value를 제거하거나 추가한다. 실제 변화가 있을 때만 type에 맞는 `onValueChange`를 호출하고, 해당 type의 `value` prop이 없을 때만 internal state를 갱신한다. forwarded `<div>`에는 `jdsb-accordion`, `data-type={type}`를 준다.

`AccordionItem`은 Root Context로 open을 계산하고 root prefix 및 value로 `triggerId`, `contentId`를 만든다. forwarded `<div>`에는 `jdsb-accordion-item`, `data-state={disabled ? "disabled" : open ? "open" : "closed"}`를 준다.

`AccordionHeader`는 Root Context의 `headingLevel`로 `h${headingLevel}`을 선택해 `jdsb-accordion-header`를 렌더링하고 Header Context를 제공한다. `AccordionTrigger`는 Header Context 밖에서 쓰면 명확한 오류를 내며, forwarded native button에 고정 `type="button"`, 생성한 `id`, `aria-controls`, `aria-expanded`, disabled, `jdsb-accordion-trigger`, Item과 같은 state 우선순위를 준다. 소비자 `onClick`을 먼저 호출하고 prevent되지 않았을 때만 `requestValue(item.value)`를 부른다. `AccordionContent`에는 생성한 `id`, `aria-labelledby`, `hidden={!open}`, `jdsb-accordion-content`, `data-state={open ? "open" : "closed"}`를 준다. key handler, effect, `useMemo`, `useCallback`은 추가하지 않는다.

- [ ] **4단계: 집중 테스트와 컴포넌트 typecheck를 실행한다**

실행: `pnpm test packages/components/src/navigation/Accordion.test.tsx && pnpm --filter @jdsb/components typecheck`

예상: 통과한다.

- [ ] **5단계: API를 커밋한다**

실행:

```sh
git add packages/components/src/navigation/Accordion.tsx packages/components/src/navigation/Accordion.test.tsx
git commit -m "feat: Accordion API 추가"
```

### 작업 2: 회귀 테스트, 스타일, public export를 추가한다

**파일:**

- 수정: `packages/components/src/navigation/Accordion.test.tsx`
- 생성: `packages/components/src/navigation/Accordion.css`
- 수정: `packages/components/src/index.ts`
- 수정: `packages/components/src/index.css`
- 수정: `packages/components/package.json`

**인터페이스:**

- 사용: 작업 1의 compound component, props type, class, data attribute.
- 제공: public package export와 CSS import surface.

- [ ] **1단계: 실패하는 controlled·disabled·native·export 테스트를 추가한다**

```tsx
import { createRef } from "react"
import { Accordion as PublicAccordion, AccordionContent as PublicAccordionContent, AccordionHeader as PublicAccordionHeader, AccordionItem as PublicAccordionItem, AccordionTrigger as PublicAccordionTrigger, type AccordionProps as PublicAccordionProps } from "../index.js"
import { expectTypeOf } from "vitest"

it("controlled single은 요청만 알리고 owner가 바꾸기 전에는 상태를 유지한다", async () => {
  const user = userEvent.setup(); const onValueChange = vi.fn()
  const { rerender } = render(<Accordion onValueChange={onValueChange} type="single" value="shipping"><Item value="shipping">배송 안내</Item><Item value="returns">반품 안내</Item></Accordion>)
  await user.click(screen.getByRole("button", { name: "returns" }))
  expect(onValueChange).toHaveBeenLastCalledWith("returns")
  expect(screen.getByRole("button", { name: "shipping" })).toHaveAttribute("aria-expanded", "true")
  rerender(<Accordion onValueChange={onValueChange} type="single" value="returns"><Item value="shipping">배송 안내</Item><Item value="returns">반품 안내</Item></Accordion>)
  expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "true")
})

it("open인 disabled Item을 보존하고 상태 변경 요청을 막는다", async () => {
  const user = userEvent.setup(); const onValueChange = vi.fn()
  render(<Accordion defaultValue="shipping" onValueChange={onValueChange} type="single"><Item disabled value="shipping">배송 안내</Item></Accordion>)
  const trigger = screen.getByRole("button", { name: "shipping" })
  expect(trigger).toBeDisabled(); expect(trigger).toHaveAttribute("aria-expanded", "true")
  expect(trigger.closest("div")).toHaveAttribute("data-state", "disabled")
  await user.click(trigger); expect(onValueChange).not.toHaveBeenCalled()
})

it("요청한 heading과 native button 기본 동작을 사용한다", () => {
  const headerRef = createRef<HTMLHeadingElement>()
  render(<Accordion headingLevel={2} type="single"><AccordionItem value="shipping"><AccordionHeader ref={headerRef}><AccordionTrigger>배송</AccordionTrigger></AccordionHeader><AccordionContent>배송 안내</AccordionContent></AccordionItem></Accordion>)
  expect(headerRef.current?.tagName).toBe("H2")
  expect(screen.getByRole("button", { name: "배송" })).toHaveAttribute("type", "button")
})

it("public API를 export하고 잘못된 compound 위치에는 오류를 낸다", () => {
  expect(PublicAccordion).toBe(Accordion); expect(PublicAccordionItem).toBe(AccordionItem)
  expect(PublicAccordionHeader).toBe(AccordionHeader); expect(PublicAccordionTrigger).toBe(AccordionTrigger); expect(PublicAccordionContent).toBe(AccordionContent)
  expectTypeOf<PublicAccordionProps>().toEqualTypeOf<AccordionProps>()
  expect(() => render(<AccordionItem value="shipping" />)).toThrow("Accordion compound components must be used within Accordion")
  expect(() => render(<AccordionTrigger>배송</AccordionTrigger>)).toThrow("Accordion item components must be used within AccordionItem")
})
```

소비자 `onClick={(event) => event.preventDefault()}`가 state와 `onValueChange`를 바꾸지 않는 테스트도 추가한다. `fireEvent.keyDown(trigger, { key: "Tab" })`의 반환값이 `true`인지 검사해 Accordion이 native Tab 동작을 막지 않음을 확인한다.

- [ ] **2단계: public export를 추가하기 전 테스트를 실행한다**

실행: `pnpm test packages/components/src/navigation/Accordion.test.tsx`

예상: `../index.js`의 import만 실패하고 direct component 동작 테스트는 통과한다.

- [ ] **3단계: token-only CSS와 public package surface를 추가한다**

`packages/components/src/navigation/Accordion.css`를 만든다.

```css
.jdsb-accordion { border-block: var(--jdsb-size-border) solid var(--jdsb-color-field-border); }
.jdsb-accordion-item + .jdsb-accordion-item { border-block-start: var(--jdsb-size-border) solid var(--jdsb-color-field-border); }
.jdsb-accordion-header { margin: 0; }
.jdsb-accordion-trigger { align-items: center; background: var(--jdsb-color-field-background); border: 0; color: var(--jdsb-color-field-foreground); cursor: pointer; display: flex; font: inherit; justify-content: space-between; min-block-size: var(--jdsb-size-alert-close); padding: var(--jdsb-space-button-inline); text-align: start; width: 100%; }
.jdsb-accordion-trigger[data-state="open"] { border-block-end: var(--jdsb-size-border) solid var(--jdsb-color-field-border); }
.jdsb-accordion-trigger:not(:disabled):hover { background: var(--jdsb-color-action-ghost-hover); }
.jdsb-accordion-trigger:disabled { cursor: not-allowed; opacity: var(--jdsb-opacity-disabled); }
.jdsb-accordion-trigger:focus-visible { outline: var(--jdsb-size-focus) solid var(--jdsb-color-focus-ring); outline-offset: calc(var(--jdsb-size-focus) * -1); }
.jdsb-accordion-content { padding: var(--jdsb-space-field-item) var(--jdsb-space-button-inline); }
@media (forced-colors: active) { .jdsb-accordion-trigger { forced-color-adjust: auto; } }
```

`packages/components/src/index.ts`에 다음 export를 추가한다.

```ts
export { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger, type AccordionContentProps, type AccordionHeaderProps, type AccordionItemProps, type AccordionProps, type AccordionTriggerProps, type AccordionType } from "./navigation/Accordion.js"
```

`packages/components/src/index.css`에 `@import "./navigation/Accordion.css";`를 추가하고, `packages/components/package.json`의 `files` 배열에 `"src/navigation/Accordion.css"`를 추가한다.

- [ ] **4단계: 컴포넌트와 package 검사를 실행한다**

실행: `pnpm test packages/components/src/navigation/Accordion.test.tsx && pnpm typecheck && pnpm build && pnpm lint`

예상: 통과한다.

- [ ] **5단계: 스타일과 export를 커밋한다**

실행:

```sh
git add packages/components/src/navigation/Accordion.test.tsx packages/components/src/navigation/Accordion.css packages/components/src/index.ts packages/components/src/index.css packages/components/package.json
git commit -m "feat: Accordion 스타일과 export 추가"
```

### 작업 3: Storybook 문서와 최종 검증을 추가한다

**파일:**

- 생성: `apps/storybook/src/navigation/Accordion.stories.tsx`

**인터페이스:**

- 사용: 작업 2의 public Accordion API와 CSS package export.
- 제공: `Navigation/Accordion` accessibility-tested documentation stories.

- [ ] **1단계: keyboard play test가 있는 기본 single Story를 작성한다**

```tsx
import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@jdsb/components"

const meta = { title: "Navigation/Accordion", component: Accordion } satisfies Meta<typeof Accordion>
export default meta
type Story = StoryObj<typeof meta>

function ShippingItem({ disabled = false }: { disabled?: boolean }) {
  return <AccordionItem disabled={disabled} value="shipping"><AccordionHeader><AccordionTrigger>배송 정보</AccordionTrigger></AccordionHeader><AccordionContent>배송은 영업일 기준 2~3일 걸립니다.</AccordionContent></AccordionItem>
}

export const Single: Story = {
  args: { children: null, defaultValue: "shipping", type: "single" },
  render: () => <Accordion defaultValue="shipping" type="single"><ShippingItem /><AccordionItem value="returns"><AccordionHeader><AccordionTrigger>반품 정책</AccordionTrigger></AccordionHeader><AccordionContent>수령 후 7일 안에 반품할 수 있습니다.</AccordionContent></AccordionItem></Accordion>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const shipping = canvas.getByRole("button", { name: "배송 정보" })
    shipping.focus(); await userEvent.keyboard("{Enter}")
    expect(shipping).toHaveAttribute("aria-expanded", "false")
    await userEvent.keyboard(" ")
    expect(shipping).toHaveAttribute("aria-expanded", "true")
  },
}
```

- [ ] **2단계: Storybook typecheck를 실행한다**

실행: `pnpm --filter @jdsb/storybook typecheck`

예상: 통과한다.

- [ ] **3단계: 나머지 문서 상태를 추가한다**

```tsx
function ControlledSingle() { const [value, setValue] = useState<string | null>("shipping"); return <Accordion onValueChange={setValue} type="single" value={value}><ShippingItem /></Accordion> }
function ControlledMultiple() { const [value, setValue] = useState(["shipping"]); return <Accordion onValueChange={setValue} type="multiple" value={value}><ShippingItem /><AccordionItem value="returns"><AccordionHeader><AccordionTrigger>반품 정책</AccordionTrigger></AccordionHeader><AccordionContent>수령 후 7일 안에 반품할 수 있습니다.</AccordionContent></AccordionItem></Accordion> }
export const Multiple: Story = { args: { children: null, defaultValue: ["shipping"], type: "multiple" }, render: () => <Accordion defaultValue={["shipping"]} type="multiple"><ShippingItem /><AccordionItem value="returns"><AccordionHeader><AccordionTrigger>반품 정책</AccordionTrigger></AccordionHeader><AccordionContent>수령 후 7일 안에 반품할 수 있습니다.</AccordionContent></AccordionItem></Accordion> }
export const Controlled: Story = { args: { children: null, type: "single", value: "shipping" }, render: () => <ControlledSingle /> }
export const ControlledMultiple: Story = { args: { children: null, type: "multiple", value: ["shipping"] }, render: () => <ControlledMultiple /> }
export const DisabledItem: Story = { args: { children: null, defaultValue: "shipping", type: "single" }, render: () => <Accordion defaultValue="shipping" type="single"><ShippingItem disabled /></Accordion> }
```

`AllCollapsed`, `LongTrigger`, `LongContent` Story를 더한다. 모든 Story는 완전한 Accordion 조합을 쓰며, 해당 내용 자체가 landmark를 필요로 하지 않는 한 `region` role을 넣지 않는다.

- [ ] **4단계: 전체 자동 검증을 실행한다**

실행: `pnpm typecheck && pnpm test && pnpm build && pnpm lint && pnpm --filter @jdsb/storybook build`

예상: 모든 명령이 exit 0으로 끝난다. Storybook build는 모든 Story에 구성된 axe 검사를 실행한다.

- [ ] **5단계: 필수 상호작용과 접근성을 수동 확인한다**

Storybook에서 완료 보고 전 다음을 확인한다.

- Tab과 Shift+Tab이 모든 enabled Trigger를 문서 순서대로 지나고 Enter·Space가 열고 닫는다.
- open인 disabled Item은 열린 상태를 유지하면서 활성화할 수 없고, single은 앞의 enabled Item을 닫으며 multiple은 나머지 열린 Item을 유지한다.
- 브라우저 확대에서 Trigger target을 계속 조작할 수 있고 긴 Trigger/Content text가 잘리거나 겹치지 않는다.
- forced-colors에서 focus outline과 Trigger 경계가 계속 보인다.
- 스크린리더에서 header의 heading level, Trigger의 expanded/disabled 상태, button과 panel 관계가 올바르게 전달된다.

- [ ] **6단계: Storybook 문서를 커밋한다**

실행:

```sh
git add apps/storybook/src/navigation/Accordion.stories.tsx
git commit -m "feat: Accordion Storybook 문서 추가"
```

## 계획 자체 점검

- 설계 범위: 작업 1은 compound 구조, type별 controlled/uncontrolled API, ARIA ID, hidden panel, native interaction, 상태 attribute, 오사용 오류를 구현한다. 작업 2는 disabled, preventDefault, focus/Tab 보존, token style, export와 CSS publishing을 다룬다. 작업 3은 Storybook 상태, axe build, keyboard·zoom·forced-colors·screen-reader 수동 검증을 완결한다.
- 누락 방지: 미정 항목이나 구현 시점에 결정할 요구 사항을 남기지 않았다.
- type 일관성: single은 설계·테스트·구현·Storybook 모두에서 `string | null`, multiple은 모두에서 `string[]`을 사용한다. 다섯 컴포넌트와 props type 이름은 설계 문서와 일치한다.
