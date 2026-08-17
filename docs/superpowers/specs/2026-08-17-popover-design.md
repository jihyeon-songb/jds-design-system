# JDSB Popover 설계

## 목적

`@jdsb/components`에 Trigger에 연결된 비모달 보조 콘텐츠를 표시하는 접근 가능한
Popover를 추가한다. 브라우저의 native Popover API를 우선 사용하고, 지원하지 않는
환경에서는 동일한 React 상태와 최소 닫기 동작을 제공한다. 외부 의존성이나
위치 계산 엔진은 추가하지 않는다.

## 범위

포함:

- `Popover`, `PopoverTrigger`, `PopoverContent` 조합 API
- `open` 또는 `defaultOpen` 기반의 controlled·uncontrolled 상태와
  `onOpenChange` 요청 콜백
- Trigger 클릭, Escape, 바깥 pointer 상호작용으로 닫기와 Trigger 포커스 복귀
- native Popover API의 `toggle`, `showPopover()`, `hidePopover()` 동기화
- 네 방향의 논리적 배치, semantic token CSS, 컴포넌트 테스트와 Storybook axe 검사

제외:

- Portal, focus trap, modal 의미, animation, viewport 충돌 회피와 자동 배치
- 중첩 Popover, Popover stack, hover/focus 지연, URL·라우터 상태 동기화
- 메뉴·선택·form 상태 같은 도메인 동작과 새 런타임 의존성

Popover는 Tooltip과 달리 Trigger를 클릭해 열고 콘텐츠 안에서 상호작용할 수 있다.
modal이 아니므로 포커스를 가두지 않으며, 복잡한 명령 목록은 다음 작업인
DropdownMenu가 담당한다.

## 공개 API

```tsx
type PopoverUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type PopoverControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type PopoverProps =
  & ComponentPropsWithoutRef<"span">
  & (PopoverUncontrolledProps | PopoverControlledProps)

export type PopoverTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "aria-haspopup" | "popoverTarget" | "type"
>

export type PopoverSide = "top" | "right" | "bottom" | "left"

export type PopoverContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "hidden" | "id" | "popover"
> & {
  side?: PopoverSide
}
```

`open`을 제공하면 controlled이고, 내부에서 상태를 바꾸지 않고
`onOpenChange(nextOpen)`만 요청한다. `open`을 생략하면 `defaultOpen`으로 초기화한
내부 상태를 변경한다. 두 prop은 동시에 제공할 수 없다.

`Popover`는 `span` wrapper를 렌더링해 Trigger와 Content의 API·fallback 배치 범위를
묶는다.
`PopoverTrigger`는 항상 `<button type="button">`이며 `aria-haspopup="dialog"`,
`aria-expanded`, `aria-controls`, `popovertarget`를 제공한다. 이 declarative association은
native Content의 implicit anchor도 만든다. 소비자의 `onClick`을 먼저 실행하고
취소되지 않았을 때 browser default를 막은 뒤 열림 상태를 토글한다. Content가 의미 있는
상호작용을 제공하면 소비자는 Content에 `aria-label` 또는 `aria-labelledby`를 제공한다.

`PopoverContent`는 `<div>`에 stable id, `popover="auto"`, `data-state`,
`data-side`를 제공한다. `side` 기본값은 `bottom`이다. Popover가 닫혀도 Content는
DOM에 유지하고, 지원 환경에서는 native popover 상태로, 미지원 환경에서는
`hidden`으로 표시 여부를 관리한다.

```tsx
<Popover>
  <PopoverTrigger>표시 옵션</PopoverTrigger>
  <PopoverContent aria-label="표시 옵션" side="bottom">
    <label><input type="checkbox" /> 품절 상품 숨기기</label>
  </PopoverContent>
</Popover>
```

## 상태와 상호작용

`Popover` context는 현재 open 상태, open 변경 요청 함수, generated content ID,
Trigger ref와 Content ref를 공유한다. compound part가 `Popover` 밖에서 렌더링되면
명확한 오류를 낸다.

Trigger의 클릭은 소비자 이벤트가 취소되지 않았을 때 `requestOpen(!open)`을
호출한다. `PopoverContent`는 open 변경 effect에서 지원되는 브라우저에
`showPopover()` 또는 `hidePopover()`를 호출한다. native `toggle` 이벤트로 사용자가
Escape 또는 바깥 클릭으로 닫았음을 감지해 `requestOpen(false)`로 동기화한다.

Popover API가 없는 환경에서는 Content의 `hidden` 속성과 document-level Escape 및
pointerdown 검사로 같은 닫기 요청을 제공한다. trigger 또는 content 내부의 pointer
상호작용은 바깥 클릭으로 취급하지 않는다. Escape 또는 바깥 클릭으로 닫을 때,
연결되어 있고 disabled가 아닌 Trigger가 있으면 `trigger.focus()`로 복귀한다.
Content 내부에서의 클릭, Tab 이동, blur는 닫지 않는다. 소비자가 취소한 Trigger
click은 상태를 바꾸지 않는다.

## 스타일과 토큰

새 token을 추가하지 않는다. wrapper는 `inline-flex`와 `position: relative`를
사용한다. Content는 `color.field.background`, `color.field.foreground`,
`color.field.border`, `radius.control`, `size.border`, `size.focus`,
`space.field.content`, `space.field.item` semantic token으로 배경·테두리·여백·focus
표시를 구성한다.

native Popover가 top layer에 올라가면 부모의 position을 기준으로 배치되지 않으므로,
side는 implicit anchor와 CSS Anchor Positioning의 `position-area`로 배치한다.
top/bottom은 각각 `block-start`/`block-end`, left/right는 `inline-start`/`inline-end`를
사용하며 간격은 `space.field.content`를 사용한다. Anchor Positioning이 없는 브라우저는
native Popover의 기본 viewport 배치를 유지한다. 이 경우의 위치 계산 JavaScript,
화면 가장자리 충돌 회피, 재배치, animation은 제공하지 않는다. forced-colors에서는
시스템 색을 허용한다.

## 검증

컴포넌트 테스트는 다음을 검증한다.

- package entry export, props·event·ref 전달, 잘못된 compound context 오류
- controlled·uncontrolled 열기와 `data-state`, trigger ARIA 연결
- Trigger click, Escape, 바깥 클릭, 취소된 Trigger click, focus 복귀
- native API 사용 시 `showPopover()`·`hidePopover()` 호출과 `toggle` 상태 동기화
- API 미지원 fallback의 `hidden` 표시와 닫기 동작, 모든 `side` 값

jsdom에는 native Popover API가 없으므로 해당 테스트는 필요한 element prototype
method와 `toggle` event만 최소 mock한다. Storybook에는 기본, controlled, 네 방향,
form 콘텐츠 Story를 제공한다. 기본 Story의 play는 열기, Escape 닫기, Trigger 포커스
복귀를 검사하며 기존 preview 설정으로 axe 검사를 실행한다.

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 실제 브라우저에서는 Escape,
바깥 클릭, Trigger와 Content 간 Tab 이동, focus 복귀, 200% 확대, forced-colors와
스크린리더의 Trigger 상태를 수동 확인한다.

## 성공 기준

소비자는 외부 의존성 없이 Trigger에 연결된 비모달 콘텐츠를 controlled 또는
uncontrolled로 열고 닫을 수 있다. native Popover API가 있을 때는 플랫폼의 top layer와
닫기 동작을 사용하고, 없을 때도 Escape·바깥 클릭·ARIA 상태·focus 복귀가 일관되게
유지된다.
