# JDSB Tooltip 설계

## 목적

`@jdsb/components`에 trigger와 관련된 짧은 보조 정보를 표시하는 접근 가능한 Tooltip을
추가한다. Tooltip은 trigger가 keyboard focus를 받거나 pointer가 올라갔을 때만 표시하며,
접근 가능한 이름 또는 label을 대체하지 않는다.

## 범위

포함:

- `Tooltip`, `TooltipTrigger`, `TooltipContent` compound API
- focus와 hover의 300ms 표시 지연, blur·pointer leave·Escape 닫기
- `top`, `right`, `bottom`, `left`의 네 위치
- trigger와 content 사이 pointer 이동 시 열린 상태 유지
- `role="tooltip"`, `aria-describedby`, semantic token CSS, component test,
  Storybook Story와 axe 검사

제외:

- `TooltipProvider`, controlled state, configurable delay, Portal
- viewport collision avoidance, dynamic position calculation, arrow, animation
- interactive Tooltip, touch-only trigger, disabled control 자동 래핑, 중첩 Tooltip
- 새 runtime dependency와 새 token

첫 릴리스에는 compound API와 정해진 300ms delay로 충분하다. Provider나 위치 엔진은
여러 Tooltip의 공통 delay 정책 또는 viewport escape가 실제 요구될 때만 추가한다.

## 공개 API

```tsx
export type TooltipProps = ComponentPropsWithoutRef<"span"> & {
  children: ReactNode
}

export type TooltipTriggerProps = {
  children: ReactElement
}

export type TooltipSide = "top" | "right" | "bottom" | "left"

export type TooltipContentProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "id" | "role"
> & {
  side?: TooltipSide
}
```

```tsx
<Tooltip>
  <TooltipTrigger>
    <IconButton aria-label="즐겨찾기에 추가"><StarIcon /></IconButton>
  </TooltipTrigger>
  <TooltipContent side="top">즐겨찾기에 추가</TooltipContent>
</Tooltip>
```

`Tooltip`은 positioned `<span>` wrapper를 렌더링한다. `TooltipTrigger`는 하나의
React element만 받고 clone하여 trigger에 `aria-describedby`와 focus·pointer·Escape
handler를 연결한다. 따라서 Trigger child는 DOM props를 전달하는 단일 element여야 한다.
fragment, text node, 여러 child는 지원하지 않는다.

`TooltipContent`는 `<span role="tooltip">`로 렌더링하며 generated `id`,
`data-state="open|closed"`, `data-side`를 제공한다. `side` 기본값은 `top`이다.
Tooltip은 focus를 받지 않으며 Content에 button, link, input 등 interactive descendant를
넣지 않는다. interactive 정보가 필요하면 Dialog 또는 Popover를 사용한다.

disabled native button은 focus와 pointer 이벤트를 받지 못하므로, 소비자가 trigger
밖에서 의미 없는 `<span>`을 직접 제공하거나 Tooltip을 사용하지 않는다. Tooltip은
disabled control을 자동으로 감싸지 않는다.

## 상태와 상호작용

`Tooltip` Context는 `open`, stable content ID, wrapper ref와 `openAfterDelay`,
`closeNow`, `keepOpenForRelatedTarget`을 compound part에 제공한다. Context 밖에서
compound part를 사용하면 `Tooltip compound components must be used within Tooltip`
Error를 던진다.

- Trigger `focus`와 `pointerenter`는 소비자 handler를 먼저 호출한 뒤 300ms timer를
  시작한다. 이미 open이면 timer를 만들지 않는다.
- Trigger `blur`는 즉시 닫는다. focus는 trigger에 그대로 남으며 Content로 이동하지
  않는다.
- Trigger `pointerleave`와 Content `pointerleave`는 `relatedTarget`이 Tooltip wrapper
  안에 있을 때 닫지 않는다. 둘 다 밖으로 나갈 때 timer를 취소하고 즉시 닫는다.
- Trigger `keydown`의 Escape는 소비자 handler가 preventDefault하지 않았을 때 timer를
  취소하고 닫는다. focus는 이동하지 않는다.
- unmount 시 pending timer를 정리한다. Content를 닫아도 DOM에는 유지하되 `hidden`을
  설정해 pointer와 tab order에서 제외한다.

Tooltip은 click, Enter, Space로 상태를 바꾸지 않는다. Trigger의 native 동작도 막지
않는다. 소비자 handler를 호출한 뒤 `event.defaultPrevented`를 확인하는 기존 compound
component 패턴을 따른다.

## 접근성

WAI-ARIA Tooltip pattern에 따라 Content는 `role="tooltip"`, Trigger는 Content ID를
가리키는 `aria-describedby`를 사용한다. Tooltip은 focus를 받지 않으며 Escape로
닫힌다. focus로 열렸다면 blur 때 닫고, pointer로 열렸다면 pointer가 Trigger 또는
Content 위에 있는 동안 유지한다. [WAI-ARIA Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
기준을 적용한다.

`IconButton`은 Tooltip 유무와 관계없이 `aria-label`이 필수다. Tooltip의 텍스트가
control 이름을 보완하거나 대체해서는 안 된다. `aria-describedby`는 소비자가 이미
지정한 값에 Content ID를 공백으로 이어 붙여 기존 설명을 보존한다.

## 스타일과 토큰

새 token은 추가하지 않는다. Content는 다음 existing semantic token만 사용한다.

- background: `color.action.primary.background`
- foreground: `color.action.primary.foreground`
- border-radius: `radius.control`
- padding block: `space.field.content`
- padding inline: `space.button.inline`
- trigger와의 gap: `space.field.content`

`Tooltip` wrapper는 `display: inline-flex`와 `position: relative`를 사용한다.
Content는 absolute positioning으로 trigger의 시작 모서리를 기준으로 네 `side`에
표시한다. viewport 충돌 회피와 중앙 정렬은 포함하지 않는다. `hidden` 상태에는
`display: none`을 사용하며 animation·transition은 추가하지 않는다. forced-colors에서
시스템 색을 허용한다.

## 검증

component tests는 다음을 검증한다.

- public export, root/Content ref 및 native prop forwarding, invalid Context
- 300ms 뒤 focus·hover open, pending timer cleanup, blur·outside pointer leave close
- Trigger/Content 사이 pointer 이동 유지와 Escape close, consumer handler의
  `preventDefault()` 억제
- role, stable ID, `aria-describedby` merge, `data-state`, `data-side`, hidden 상태
- Trigger native click과 keyboard activation이 유지됨

Storybook에는 기본 IconButton, 네 side, focus 예시, 기존 `aria-describedby` 병합,
긴 content를 제공한다. 모든 Story는 existing axe 설정으로 검사한다.

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 실제 브라우저에서 pointer 이동,
Tab/Shift+Tab·Escape, 200% zoom, forced-colors와 screen reader의 trigger 설명을
수동 확인한다.

## 성공 기준

소비자는 외부 의존성 없이 기존 named control의 보조 설명을 focus와 hover에서 예측
가능하게 표시할 수 있다. Tooltip은 기존 trigger 동작과 accessible name을 바꾸지
않고, pointer 이동·Escape·focus 해제에서 올바르게 닫힌다.
