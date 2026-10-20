# DropdownMenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명령 항목의 키보드 포커스와 표준 ARIA menu 의미를 갖는 token 기반 DropdownMenu를 추가한다.

**Architecture:** `DropdownMenu`는 span wrapper와 React context로 controlled/uncontrolled 상태, stable content ID, refs, 등록된 menu item을 공유한다. Trigger와 Item은 native button이며 Content는 hidden 기반의 non-modal menu다. focus 이동은 등록된 enabled item의 DOM ref만 사용하고, 위치 계산·Portal·별도 의존성은 추가하지 않는다.

**Tech Stack:** React 19, TypeScript, native HTML/ARIA, semantic CSS tokens, Vitest, Testing Library, Storybook 10.

## Global Constraints

- 새 런타임·개발 의존성, Portal, animation, 위치 계산 엔진을 추가하지 않는다.
- public API는 `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`와 다섯 props type만 export한다.
- Trigger는 native `<button type="button">`이며 menu ARIA 속성은 컴포넌트가 소유한다.
- Item은 native `<button type="button" role="menuitem">`이고 disabled item은 포커스와 실행에서 제외한다.
- 모든 스타일 값은 기존 semantic token만 사용하며, forced-colors에서는 시스템 색을 허용한다.
- 외부 click, Escape, item 선택 뒤에는 enabled Trigger로 포커스를 복귀한다.

---

## 파일 구조

- `packages/components/src/overlays/DropdownMenu.tsx`: context, 상태, compound parts, 키보드와 focus 처리.
- `packages/components/src/overlays/DropdownMenu.css`: token-only root, menu, item, separator 스타일.
- `packages/components/src/overlays/DropdownMenu.test.tsx`: API, keyboard, close 정책 회귀 검사.
- `packages/components/src/index.ts`: JavaScript/type public exports.
- `packages/components/src/index.css`: DropdownMenu stylesheet import.
- `packages/components/package.json`: stylesheet publish allowlist.
- `apps/storybook/src/overlays/DropdownMenu.stories.tsx`: 사용 문서, 기본 story play/axe 검사.

### Task 1: 실패하는 API·상호작용 테스트 작성

**Files:**

- Create: `packages/components/src/overlays/DropdownMenu.test.tsx`
- Test: `packages/components/src/overlays/DropdownMenu.test.tsx`

**Interfaces:**

- Consumes: 없음.
- Produces: 다섯 compound part와 props type의 동작 명세.

- [ ] **Step 1: package export와 기본 의미의 실패 테스트를 작성한다.**

```tsx
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  DropdownMenu as PublicDropdownMenu,
  type DropdownMenuProps as PublicDropdownMenuProps,
} from "../index.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from "./DropdownMenu.js"

afterEach(cleanup)

it("package entry에서 DropdownMenu API를 export한다", () => {
  expect(PublicDropdownMenu).toBe(DropdownMenu)
  expectTypeOf<PublicDropdownMenuProps>().toEqualTypeOf<DropdownMenuProps>()
})

it("Trigger가 menu를 열고 menuitem과 separator 의미를 제공한다", async () => {
  const user = userEvent.setup()
  render(<DropdownMenu><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem>삭제</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
  const trigger = screen.getByRole("button", { name: "더 보기" })
  await user.click(trigger)
  expect(screen.getByRole("menu")).toHaveAttribute("id", trigger.getAttribute("aria-controls"))
  expect(trigger).toHaveAttribute("aria-haspopup", "menu")
  expect(screen.getByRole("menuitem", { name: "편집" })).toHaveAttribute("type", "button")
  expect(screen.getByRole("separator")).toBeVisible()
})
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인한다.**

Run: `pnpm test -- packages/components/src/overlays/DropdownMenu.test.tsx`

Expected: FAIL — `./DropdownMenu.js` module을 찾지 못한다.

- [ ] **Step 3: keyboard·close·controlled 회귀 테스트를 작성한다.**

```tsx
it("방향키가 disabled item을 건너뛰고 Enter로 실행한 뒤 Trigger에 focus를 돌린다", async () => {
  const user = userEvent.setup()
  const onEdit = vi.fn()
  render(<DropdownMenu><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={onEdit}>편집</DropdownMenuItem><DropdownMenuItem disabled>복제</DropdownMenuItem><DropdownMenuItem>삭제</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
  const trigger = screen.getByRole("button", { name: "더 보기" })
  trigger.focus()
  await user.keyboard("{ArrowDown}")
  expect(screen.getByRole("menuitem", { name: "편집" })).toHaveFocus()
  await user.keyboard("{ArrowDown}{Enter}")
  expect(onEdit).toHaveBeenCalledOnce()
  expect(trigger).toHaveFocus()
  expect(screen.queryByRole("menu")).not.toBeInTheDocument()
})

it("Escape와 외부 pointerdown은 close를 요청하고 controlled state를 직접 바꾸지 않는다", async () => {
  const user = userEvent.setup()
  const onOpenChange = vi.fn()
  render(<><DropdownMenu open onOpenChange={onOpenChange}><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem></DropdownMenuContent></DropdownMenu><button type="button">외부</button></>)
  await user.keyboard("{Escape}")
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
  expect(screen.getByRole("menu")).toBeVisible()
  await user.pointer({ keys: "[MouseLeft]", target: screen.getByRole("button", { name: "외부" }) })
  expect(onOpenChange).toHaveBeenLastCalledWith(false)
})

it("Home과 End가 첫·마지막 enabled item에 포커스를 이동한다", async () => {
  const user = userEvent.setup()
  render(<DropdownMenu defaultOpen><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem><DropdownMenuItem disabled>복제</DropdownMenuItem><DropdownMenuItem>삭제</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
  const edit = screen.getByRole("menuitem", { name: "편집" })
  const remove = screen.getByRole("menuitem", { name: "삭제" })
  remove.focus()
  await user.keyboard("{Home}")
  expect(edit).toHaveFocus()
  await user.keyboard("{End}")
  expect(remove).toHaveFocus()
})
```

- [ ] **Step 4: compound context, 취소된 item click, refs/className 테스트를 작성한다.**

```tsx
it("취소된 item click은 메뉴를 닫지 않고 compound part 밖 사용은 실패한다", async () => {
  const user = userEvent.setup()
  render(<DropdownMenu defaultOpen><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={(event) => event.preventDefault()}>편집</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
  await user.click(screen.getByRole("menuitem", { name: "편집" }))
  expect(screen.getByRole("menu")).toBeVisible()
  expect(() => render(<DropdownMenuItem>편집</DropdownMenuItem>)).toThrow("DropdownMenu compound components must be used within DropdownMenu")
})
```

- [ ] **Step 5: 테스트를 다시 실행해 구현 부재만 실패하는지 확인한다.**

Run: `pnpm test -- packages/components/src/overlays/DropdownMenu.test.tsx`

Expected: FAIL — 아직 `DropdownMenu.tsx`와 package entry export가 없다.

### Task 2: 최소 compound component와 package surface 구현

**Files:**

- Create: `packages/components/src/overlays/DropdownMenu.tsx`
- Modify: `packages/components/src/index.ts`
- Test: `packages/components/src/overlays/DropdownMenu.test.tsx`

**Interfaces:**

- Consumes: Task 1의 공개 API·interaction tests.
- Produces: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`와 five props types.

- [ ] **Step 1: context와 public type을 구현한다.**

```tsx
export type DropdownMenuItemProps = Omit<ComponentPropsWithoutRef<"button">, "type">

type ItemRecord = { disabled: boolean; ref: RefObject<HTMLButtonElement | null> }
type DropdownMenuContextValue = {
  contentId: string
  contentRef: RefObject<HTMLDivElement | null>
  open: boolean
  registerItem: (item: ItemRecord) => () => void
  requestOpen: (nextOpen: boolean, focus?: "first" | "last") => void
  triggerRef: RefObject<HTMLButtonElement | null>
}
```

`useId`, `useRef`, `useState`, `createContext`만 사용한다. `requestOpen(false)`는
uncontrolled state를 갱신하고 `onOpenChange(false)`를 호출한다. `open` prop이
있으면 내부 state를 바꾸지 않는다. item은 `useEffect`로 자신을 등록하고 cleanup에서
제거한다. Popover의 `assignRef` 패턴을 그대로 사용한다.

- [ ] **Step 2: Trigger, Content, Item, Separator를 구현한다.**

```tsx
return <button {...props} ref={triggerRef} aria-controls={contentId} aria-expanded={open} aria-haspopup="menu" type="button" />

return <div {...props} ref={contentRef} hidden={!open} id={contentId} role="menu" />

return <button {...props} ref={itemRef} role="menuitem" tabIndex={-1} type="button" />

return <div {...props} role="separator" />
```

Content가 열리면 `requestOpen`이 받은 focus target의 첫/마지막 enabled item에
`focus()`한다. Item keydown은 ArrowDown/ArrowUp/Home/End로 enabled item ref를
이동하고 Enter/Space는 `event.currentTarget.click()`을 호출한다. Escape, document
pointerdown, 취소되지 않은 Item click에는 `requestOpen(false)`와 Trigger focus를
함께 수행한다. Item click에서는 소비자의 handler를 먼저 호출한다.

- [ ] **Step 3: public export를 추가한다.**

```tsx
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuTriggerProps,
} from "./overlays/DropdownMenu.js"
```

- [ ] **Step 4: component test와 typecheck를 실행한다.**

Run: `pnpm test -- packages/components/src/overlays/DropdownMenu.test.tsx && pnpm typecheck`

Expected: PASS — public API, ARIA, keyboard navigation, close policy, controlled behavior가 통과한다.

- [ ] **Step 5: component surface를 commit한다.**

```bash
git add packages/components/src/overlays/DropdownMenu.tsx packages/components/src/overlays/DropdownMenu.test.tsx packages/components/src/index.ts
git commit -m "feat: DropdownMenu 컴포넌트 추가"
```

### Task 3: token-only style과 Storybook 문서 추가

**Files:**

- Create: `packages/components/src/overlays/DropdownMenu.css`
- Create: `apps/storybook/src/overlays/DropdownMenu.stories.tsx`
- Modify: `packages/components/src/index.css`
- Modify: `packages/components/package.json`
- Test: `apps/storybook/src/overlays/DropdownMenu.stories.tsx`

**Interfaces:**

- Consumes: Task 2의 five compound exports.
- Produces: `@jdsb/components/css`에 포함된 stylesheet와 axe 검증 Storybook stories.

- [ ] **Step 1: DropdownMenu stylesheet를 작성한다.**

```css
.jdsb-dropdown-menu { display: inline-flex; position: relative; }
.jdsb-dropdown-menu-content { background: var(--jdsb-color-field-background); border: var(--jdsb-size-border) solid var(--jdsb-color-field-border); border-radius: var(--jdsb-radius-control); color: var(--jdsb-color-field-foreground); inset-block-start: 100%; inset-inline-start: 0; margin-block-start: var(--jdsb-space-field-content); padding: var(--jdsb-space-field-item); position: absolute; }
.jdsb-dropdown-menu-item { background: transparent; border: 0; color: inherit; min-height: var(--jdsb-size-control-input-md-height); padding-inline: var(--jdsb-space-input-inline); width: 100%; }
.jdsb-dropdown-menu-item:focus-visible { outline: var(--jdsb-size-focus) solid var(--jdsb-color-focus-ring); outline-offset: calc(var(--jdsb-size-focus) * -1); }
```

Item hover/focus는 `--jdsb-color-action-secondary-background`, disabled는
`--jdsb-opacity-disabled`, separator는 `--jdsb-color-field-border`와
`--jdsb-size-border`를 사용한다. forced-colors media query는 `forced-color-adjust: auto`만
선언한다.

- [ ] **Step 2: CSS 공개 entry와 package allowlist를 갱신한다.**

```css
@import "./overlays/DropdownMenu.css";
```

`packages/components/package.json`의 `files`에
`"src/overlays/DropdownMenu.css"`를 추가한다.

- [ ] **Step 3: 기본·controlled·disabled Story를 작성한다.**

```tsx
export const Default: Story = {
  render: () => <DropdownMenu><DropdownMenuTrigger>더 보기</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem>삭제</DropdownMenuItem></DropdownMenuContent></DropdownMenu>,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "더 보기" })
    await userEvent.click(trigger)
    expect(within(document.body).getByRole("menu")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    expect(trigger).toHaveFocus()
  },
}
```

`Controlled`는 `useState(false)`와 `onOpenChange={setOpen}`을 사용한다. `DisabledItem`
story는 menuitem 하나에 `disabled`를 전달한다. meta에 `tags: ["dropdown-menu-regression"]`
와 menu 의미·키보드 사용 조건을 설명한다.

- [ ] **Step 4: component, workspace, Storybook 검증을 실행한다.**

Run: `pnpm typecheck && pnpm test && pnpm build && pnpm lint && pnpm --filter @jdsb/storybook build`

Expected: PASS — 모든 package 검사와 Storybook axe 검사가 통과한다.

- [ ] **Step 5: styles와 Storybook을 commit한다.**

```bash
git add packages/components/src/overlays/DropdownMenu.css packages/components/src/index.css packages/components/package.json apps/storybook/src/overlays/DropdownMenu.stories.tsx
git commit -m "feat: DropdownMenu 스타일과 문서 추가"
```

## 계획 자체 점검

- 설계의 public API, controlled state, keyboard, close/focus, token CSS, Storybook 요구는 Task 1~3에 모두 매핑했다.
- placeholder scan: 미완성 표식, 미지정 오류 처리, 암시적 구현 단계가 없다.
- type consistency: Task 1~3의 five component/type 이름과 `requestOpen` signature은 일치한다.
