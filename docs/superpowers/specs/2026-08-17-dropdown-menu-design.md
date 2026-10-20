# DropdownMenu 설계

## 목적

`@jdsb/components`에 명령 실행용 접근 가능한 `DropdownMenu`를 추가한다. 선택값을
관리하는 `Select`나 임의의 비모달 콘텐츠를 표시하는 `Popover`와 달리, 이 컴포넌트는
명령 목록의 메뉴 의미와 키보드 포커스를 제공한다.

## 범위

포함:

- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`,
  `DropdownMenuItem`, `DropdownMenuSeparator` compound API
- `open`/`defaultOpen` 기반 controlled·uncontrolled 상태와 `onOpenChange`
- Trigger 클릭, ArrowDown, ArrowUp으로 열기
- ArrowDown, ArrowUp, Home, End의 항목 포커스 이동과 Enter, Space의 항목 실행
- Escape와 바깥 pointerdown 닫기 및 Trigger 포커스 복귀
- disabled 항목 건너뛰기, semantic token CSS, 컴포넌트·Storybook axe 검사

제외:

- 체크·라디오 메뉴 항목, 서브메뉴, 그룹·라벨, typeahead, Portal, animation,
  viewport 충돌 회피, Popover API 사용

## 공개 API

```tsx
type DropdownMenuUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type DropdownMenuControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type DropdownMenuProps =
  & ComponentPropsWithoutRef<"span">
  & (DropdownMenuUncontrolledProps | DropdownMenuControlledProps)

export type DropdownMenuTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "aria-haspopup" | "type"
>

export type DropdownMenuContentProps = ComponentPropsWithoutRef<"div">
export type DropdownMenuItemProps = Omit<ComponentPropsWithoutRef<"button">, "type">
export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<"div">
```

`DropdownMenu`는 Trigger와 Content의 기준 배치 범위를 만드는 `<span>`이다.
`DropdownMenuTrigger`는 항상 `<button type="button">`이며 `aria-haspopup="menu"`,
`aria-expanded`, `aria-controls`를 제공한다. `DropdownMenuContent`는 안정적인 ID와
`role="menu"`, `data-state`를 갖고 닫혀 있으면 `hidden`이다. 소비자는 메뉴의 목적을
Trigger의 접근 가능한 이름으로 제공한다.

`DropdownMenuItem`은 `<button type="button" role="menuitem">`이다. 소비자의
`onClick`을 먼저 실행하며 이벤트가 취소되지 않았고 disabled가 아니면 메뉴를 닫는다.
`DropdownMenuSeparator`는 `<div role="separator">`이다.

## 상태와 키보드 동작

`DropdownMenu` context는 열림 상태, 변경 요청 함수, Content ID, Trigger/Content
ref, 등록된 enabled item을 공유한다. compound part가 root 밖에서 렌더링되면
`"DropdownMenu compound components must be used within DropdownMenu"` 오류를 낸다.

Trigger 클릭은 취소되지 않았을 때 열림 상태를 토글한다. 닫힌 Trigger에서
ArrowDown은 첫 enabled 항목에, ArrowUp은 마지막 enabled 항목에 포커스를 이동하며
메뉴를 연다. 열린 메뉴에서는 ArrowDown/ArrowUp이 순환하지 않고 양 끝에서 멈춘다.
Home/End는 첫/마지막 enabled 항목에 포커스를 이동한다. Enter와 Space는 포커스된
항목의 native `click()`을 호출한다. item의 ArrowDown/ArrowUp/Home/End/Escape도
같은 동작을 제공한다.

Escape와 Trigger/Content 바깥 `pointerdown`은 닫기를 요청하고, disabled가 아닌
연결된 Trigger로 포커스를 돌린다. item 선택도 Trigger로 포커스를 복귀한다. controlled
메뉴는 `onOpenChange(false)`만 호출하고 supplied `open` 값이 바뀌기 전에는 열려
있다. 내부 pointerdown과 취소된 item click은 닫지 않는다.

## 스타일과 토큰

새 토큰을 추가하지 않는다. root는 `inline-flex`/`position: relative`, Content는
`color.field.*`, `radius.control`, `size.border`, `size.focus`, `space.field.*`를
사용한다. Item은 `min-height: size.control.input.md.height`, `space.input.inline`,
`color.action.secondary.background`, `opacity.disabled`로 기본·hover·focus·disabled
상태를 제공한다. 모든 시각 값은 semantic CSS custom property만 사용한다. forced-colors
에서는 시스템 색을 허용한다.

## 검증

- package entry export와 public prop type
- controlled/uncontrolled 열림, ARIA 연결, props/ref/className 전달
- 클릭, Escape, 바깥 pointerdown, 취소된 item click, focus 복귀
- ArrowDown/ArrowUp/Home/End/Enter/Space와 disabled item 건너뛰기
- compound context 오류, separator 의미, Storybook 기본 story의 axe 검사

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 실제 브라우저에서 키보드,
200% 확대, forced-colors, 스크린리더의 메뉴·항목 안내를 수동 점검한다.
