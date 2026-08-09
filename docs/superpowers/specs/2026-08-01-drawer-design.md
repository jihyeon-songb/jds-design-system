# JDSB Drawer 설계

## 목적

`@jdsb/components`에 화면 가장자리에서 열리는 접근 가능한 modal Drawer를 추가한다.
이미 검증된 `Dialog`의 native `<dialog>` lifecycle, 모달 focus 제한, Escape·backdrop
정책을 재사용하고, Drawer는 패널의 방향과 배치만 담당한다.

## 범위

포함:

- `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerTitle`, `DrawerDescription`,
  `DrawerClose` 조합 API
- `open`/`defaultOpen` controlled·uncontrolled 상태와 `onOpenChange`
- `left`, `right`, `top`, `bottom` side와 기본 `right`
- native dialog 기반 포커스 이동·focus 복귀, Escape·backdrop close 취소
- semantic/component token CSS, Storybook, 컴포넌트 테스트

제외:

- Portal, animation, drag·resize, swipe gesture, 중첩 Drawer, 자체 focus trap
- 별도 overlay primitive 또는 런타임 의존성

## 공개 API

`Drawer`의 상태와 compound parts는 `Dialog`와 같은 props를 갖는다. `DrawerContent`만
다음 속성을 추가한다.

```tsx
export type DrawerSide = "left" | "right" | "top" | "bottom"

export type DrawerContentProps = DialogContentProps & {
  side?: DrawerSide
}
```

`side`는 물리적 viewport edge를 뜻하며 `data-side`로 노출한다. accessible name은 `DrawerTitle` 또는 `aria-label`로
제공해야 하며, `DrawerClose`는 `aria-label`을 필수로 받는다.

## 구현

`Drawer`와 Trigger·Title·Description·Close는 Dialog의 공개 compound parts를 재사용한다.
`DrawerContent`만 `DialogContent`을 감싸 `jdsb-drawer-content` class와 `data-side`를
추가한다. 따라서 controlled state, cancel, outside click, autofocus, Trigger focus 복귀의
행동은 Dialog와 동일하다.

CSS는 native dialog를 viewport edge에 배치한다. `size.drawer.inline`과
`size.drawer.block` component token은 각각 좌우 및 상하 패널 크기를 제공한다. 색상,
border, padding, backdrop, focus style은 Dialog의 기존 semantic token 스타일을 상속한다.

## 검증

- package export, side 기본값/변경, native props/ref, open/close를 테스트한다.
- Storybook에서 기본, controlled, 모든 방향, 긴 콘텐츠, aria-label 전용 예시를 제공한다.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, Storybook build를 실행한다.
- 실제 브라우저에서 Tab/Shift+Tab, Escape, backdrop, Trigger focus 복귀, 200% 확대,
  forced-colors와 스크린리더 dialog 이름·설명을 수동 확인한다.
