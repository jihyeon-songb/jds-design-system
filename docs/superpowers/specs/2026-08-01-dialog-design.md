# JDS Dialog 설계

## 목적

`@jds/components`에 짧은 작업이나 확인을 위해 문서의 나머지 부분을 일시적으로
차단하는 접근 가능한 modal Dialog를 추가한다. 브라우저의 native `<dialog>`와
`showModal()`을 사용해 top layer, backdrop, 모달 focus 제한을 재사용하며 외부 UI
라이브러리나 별도 Portal을 만들지 않는다.

## 범위

포함:

- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`,
  `DialogDescription`, `DialogClose` 조합 API
- `open`/`defaultOpen` 기반 controlled·uncontrolled 열림 상태와
  `onOpenChange` 요청 콜백
- Trigger 클릭, `DialogClose`, Escape, backdrop 클릭으로 닫기
- Escape 및 backdrop 상호작용을 각각 취소할 수 있는 callback
- 열릴 때 첫 포커스 가능한 자손으로 포커스 이동, 닫힌 뒤 Trigger 포커스 복귀
- native dialog 의미, title·description ID 연결, semantic token CSS,
  컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- Portal, 별도 Overlay 컴포넌트, animation, viewport 충돌 회피
- 중첩 Dialog, Dialog stack, URL·라우터 동기화, drag·resize
- focusable 자손을 세밀하게 정렬하는 `initialFocus` API와 focus trap 자체 구현
- native form의 `method="dialog"`, confirm/prompt 전용 API, 아이콘·외부 UI
  라이브러리, 새 의존성

`<dialog>.showModal()`이 viewport top layer와 modal focus 제한을 제공하므로
Dialog는 이를 다시 구현하지 않는다. 소비자는 `<DialogContent>`를 clipping이나
stacking context를 만드는 조상 밖에 배치해야 한다. 별도 Portal이 필요해질 때만
추가한다.

## 공개 API

```tsx
type DialogUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type DialogControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type DialogProps = (DialogUncontrolledProps | DialogControlledProps) & {
  children: ReactNode
}

export type DialogTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-expanded" | "aria-haspopup" | "type"
>

export type DialogContentProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "aria-describedby" | "aria-labelledby" | "onCancel" | "open" | "role"
> & {
  onEscapeKeyDown?: (event: Event) => void
  onInteractOutside?: (event: ReactMouseEvent<HTMLDialogElement>) => void
}

export type DialogTitleProps = ComponentPropsWithoutRef<"h2">

export type DialogDescriptionProps = ComponentPropsWithoutRef<"p">

export type DialogCloseProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  "aria-label": string
}
```

`open`이 있으면 controlled이며 상태 변경은 `onOpenChange`로만 요청한다.
없으면 `defaultOpen`으로 초기화한 내부 상태를 변경한다. `open`과 `defaultOpen`은
동시에 받을 수 없다.

`DialogContent`에는 하나의 `DialogTitle` 또는 직접 `aria-label`을 반드시
제공해 접근 가능한 이름을 만든다. 설명이 있으면 `DialogDescription`을 쓴다.
`DialogClose`는 아이콘 전용 사용을 안전하게 지원하도록 `aria-label`을 필수로
받는다. Content에는 사용자가 keyboard·pointer로 닫을 수 있는 `DialogClose`나
동등한 취소 버튼을 포함해야 한다.

```tsx
<Dialog>
  <DialogTrigger>계정 삭제</DialogTrigger>
  <DialogContent>
    <DialogTitle>계정을 삭제할까요?</DialogTitle>
    <DialogDescription>삭제한 계정은 복구할 수 없습니다.</DialogDescription>
    <DialogClose aria-label="취소">취소</DialogClose>
    <Button variant="danger">삭제</Button>
  </DialogContent>
</Dialog>
```

확인 전 필수 작업처럼 Escape와 backdrop으로 닫히면 안 되는 경우에는
`onEscapeKeyDown`과 `onInteractOutside`에서 `event.preventDefault()`를 호출한다.
이 경우 소비자는 명확한 취소·확인 버튼을 제공한다.

## 구조와 상태

`Dialog`는 DOM wrapper 없이 Context를 제공한다. Context에는 현재 open 상태,
상태 변경 요청 함수, Trigger ref, native dialog ref, generated title·description ID를
둔다. compound part가 Dialog 밖에서 렌더링되면 명확한 오류를 낸다.

`DialogTrigger`는 native `<button type="button">`으로 렌더링하며
`aria-haspopup="dialog"`, `aria-expanded`를 설정한다. 소비자의 `onClick`을
먼저 실행하고 prevent되지 않았을 때만 open을 요청한다.

`DialogContent`는 native `<dialog>`로 렌더링한다. open일 때 effect에서
`showModal()`을 호출하고, 닫힐 때 `close()`를 호출한다. native `cancel` 이벤트는
항상 preventDefault해 browser가 controlled state와 무관하게 dialog를 닫지 못하게
한 뒤, `onEscapeKeyDown`을 호출한다. 이 callback도 prevent되지 않으면 false를
요청한다. native `close` 이벤트는 처리하지 않는다.

Content의 click target이 Content 자신일 때만 backdrop 클릭이다. 소비자의 `onClick`을
먼저 호출하고 prevent되지 않았으면 `onInteractOutside`를 호출한다. 둘 다 prevent되지
않았을 때만 false를 요청한다. Content 내부 click은 이 정책의 대상이 아니다.
`DialogClose`도 소비자의 `onClick`을 먼저 호출하고 prevent되지 않았을 때만 false를
요청한다.

Content는 `role="dialog"`와 `aria-modal="true"`를 명시하지 않는다. native
`<dialog>.showModal()`의 의미를 그대로 사용한다. `DialogTitle`과
`DialogDescription`은 generated id를 사용하고 Content의 `aria-labelledby`,
`aria-describedby`에 연결한다. Title이 없으면 Content의 `aria-label`을 보존하고,
Description이 없으면 `aria-describedby`를 렌더링하지 않는다.

열린 뒤 `DialogContent`는 `autofocus` 자손, 첫 enabled focusable 자손, Content
순으로 포커스를 둔다. native modal은 이후 focus를 내부에 유지한다. 닫힌 뒤에는
연결되어 있고 disabled가 아닌 Trigger가 있을 때만 `trigger.focus()`를 호출한다.
Trigger가 삭제됐거나 비활성화됐다면 포커스를 강제하지 않는다.

`DialogContent`는 `data-state="open|closed"`를 노출한다. Content가 닫혀도 DOM에는
남고 native `<dialog>`의 `open` 상태로 표시 여부를 관리한다.

## 스타일과 토큰

새 토큰을 추가하지 않는다. `DialogContent`와 `::backdrop`은 기존
`color.field.background`, `color.field.foreground`, `color.field.border`,
`color.focus.ring`, `size.border`, `size.focus`, `radius.control`,
`space.field.item`, `opacity.disabled` semantic token을 재사용한다.

Content는 box sizing과 border를 token으로 설정하고, viewport보다 큰 콘텐츠가
잘리지 않도록 `max-block-size: calc(100dvb - var(--jds-space-field-group))`와
overflow를 사용한다. backdrop은 `color.field.foreground`와 `opacity.disabled`를
사용한다. focus-visible은 2px 이상의 focus token outline을 사용한다. animation과
transition은 추가하지 않으며 forced-colors에서는 시스템 색을 허용한다.

## 검증

컴포넌트 테스트는 다음을 검증한다.

- public export, native prop/ref 전달, compound part의 잘못된 문맥 오류
- controlled·uncontrolled 열기·닫기와 `data-state`
- Trigger, Close, Escape, backdrop 클릭의 close 요청 및 preventDefault 억제
- title·description의 ID와 접근 가능한 이름·설명 연결
- `<dialog>`의 `showModal()`·`close()` 호출, 첫 포커스와 Trigger 복귀 조건
- `aria-label`만 쓴 Content와 autofocus 우선 순위

jsdom이 native dialog modal API를 제공하지 않으면 테스트에서
`HTMLDialogElement.prototype.showModal`과 `close`를 최소 mock해 호출과 open 상태를
검증한다. focus trap 자체는 browser manual check로 검증한다.

Storybook은 기본, controlled, 긴 콘텐츠, label만 사용한 Content, backdrop/Escape
닫기 차단, autofocus, destructive confirmation 예시와 키보드 표를 제공한다. 모든
Story는 기존 preview의 axe error 설정으로 검사한다.

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. 실제 브라우저에서 Tab과
Shift+Tab의 modal 제한, Escape, backdrop, focus 복귀, 확대, forced-colors와
스크린리더의 dialog 이름·설명을 수동 확인한다.

## 성공 기준

소비자는 외부 의존성 없이 named modal dialog를 controlled 또는 uncontrolled로
열고 닫을 수 있다. Escape·backdrop·닫기 버튼은 예측 가능하게 동작하고 취소할 수
있으며, native dialog의 focus 관리와 Trigger 포커스 복귀가 유지된다.
