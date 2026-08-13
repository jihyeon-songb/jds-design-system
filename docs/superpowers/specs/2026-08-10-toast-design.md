# JDSB Toast 설계

## 목적

`@jdsb/components`에 현재 화면을 떠나지 않고 작업 결과나 중요한 상태를 알리는
접근 가능한 Toast를 추가한다. 첫 릴리스는 앱 전역에서 명령형으로 추가하는
`ToastProvider`와 `useToast()`만 제공한다.

## 범위

포함:

- `ToastProvider`, `useToast()`와 `Toast` 표시 컴포넌트
- `success`, `info`, `warning`, `error` 네 variant
- 화면 하단 가운데의 최대 세 개 Toast stack
- success·info·warning의 5초 자동 닫힘과 error의 명시적 닫기
- semantic token CSS, component test, Storybook Story와 axe 검사

제외:

- 위치 변경 API, Portal, Toast action button, title, icon prop
- Promise/async helper, pause-on-hover, swipe dismissal, animation
- 새 runtime dependency와 새 token

첫 릴리스에는 한 문장의 상태 메시지와 닫기만 필요하다. action 또는 Promise API는
실제 소비처가 여러 곳에서 같은 패턴을 요구할 때 추가한다.

## 공개 API

```tsx
export type ToastVariant = "success" | "info" | "warning" | "error"

export type ToastOptions = {
  message: ReactNode
  variant?: ToastVariant
}

export type ToastApi = {
  dismiss: (id: string) => void
  error: (options: Omit<ToastOptions, "variant">) => string | undefined
  info: (options: Omit<ToastOptions, "variant">) => string | undefined
  success: (options: Omit<ToastOptions, "variant">) => string | undefined
  warning: (options: Omit<ToastOptions, "variant">) => string | undefined
}

export type ToastProviderProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
}

export type ToastProps = ComponentPropsWithoutRef<"div"> & {
  message: ReactNode
  onDismiss: () => void
  variant: ToastVariant
}

export function useToast(): ToastApi
```

```tsx
function SaveButton() {
  const toast = useToast()

  return <Button onClick={() => toast.success({ message: "저장했습니다." })}>저장</Button>
}

<ToastProvider>
  <SaveButton />
</ToastProvider>
```

`useToast()`는 `ToastProvider` 하위에서만 사용한다. 그렇지 않으면
`useToast must be used within ToastProvider` Error를 던진다. 각 add method는
새 Toast의 ID를 반환하며, Toast가 표시되지 못하면 `undefined`를 반환한다.
`dismiss(id)`는 존재하지 않는 ID에도 안전하게 아무 일도 하지 않는다.

`Toast`는 목록 표시를 위한 저수준 공개 컴포넌트다. 일반 소비자는 Provider API를
사용하며, 직접 렌더링할 때는 `variant`, `message`, `onDismiss`를 모두 제공한다.

`ToastProvider`는 children과 Toast viewport를 포함하는 일반 `<div>` wrapper를
렌더링한다. Provider의 native props와 ref는 wrapper로 전달되고, 고정 위치·live region
semantic은 children의 layout에 영향을 주지 않도록 내부 viewport에만 적용한다.

## 상태와 상호작용

`ToastProvider`는 생성 순서대로 Toast 목록을 소유하고, 현재 목록의 끝에 새 Toast를
추가한다. 화면에는 하단 가운데에 쌓인 최대 세 개를 순서대로 표시한다.

- success, info, warning은 추가된 지 5초 후 자동으로 제거한다.
- error는 자동으로 제거하지 않고 닫기 버튼으로만 제거한다.
- 닫기 버튼은 `type="button"`, 접근 가능한 이름 `닫기`를 가지며 click과 keyboard
  activation으로 해당 Toast만 제거한다.
- 네 개 이상의 Toast를 추가할 때는 가장 오래된 자동 닫힘 Toast 하나를 제거한 뒤
  새 Toast를 추가한다. 목록이 error 세 개뿐이면 새 Toast를 추가하지 않고 add method는
  `undefined`를 반환한다.
- Provider unmount 시 등록된 모든 timer를 정리한다.

자동 닫힘은 pause-on-hover 또는 focus에 따라 연장하지 않는다. Toast의 텍스트에는
interactive descendant를 넣지 않으며, 사용자가 응답해야 하는 작업은 Dialog를 사용한다.

## 접근성

Provider가 렌더링하는 Toast viewport는 `role="region"`과 `aria-label="알림"`을 가진다. 각
Toast는 `role="status"`와 `aria-live="polite"`를 사용한다. 오류도 사용자의 현재
입력을 끊지 않도록 첫 릴리스에서는 assertive announcement를 사용하지 않는다.

Toast가 추가되어도 focus를 이동하지 않는다. 닫기 버튼만 keyboard focus를 받고, visible
focus ring을 제공한다. Provider는 같은 message의 중복을 제거하거나 합치지 않아, 서로
다른 시점의 상태 변경을 숨기지 않는다.

## 스타일과 토큰

새 token은 추가하지 않는다. Toast는 Alert의 기존 semantic component token을 재사용한다.

- background: `color.alert.{variant}.background`
- foreground: `color.alert.{variant}.foreground`
- border: `color.alert.{variant}.border`
- border radius: `radius.control`
- padding: `space.alert.block`, `space.alert.inline`
- content/close gap: `space.alert.gap`, `space.alert.close-gap`
- close target: `size.control.alert-close`

Viewport는 `position: fixed`, `inset-block-end: var(--jdsb-space-field-group)`,
`inset-inline: 0`, `display: grid`, `justify-items: center`로 화면 하단 가운데에 배치한다.
각 Toast의 최대 너비는 사용하지 않으며, animation, transition, z-index와 hardcoded visual
값도 추가하지 않는다. forced-colors에서는 system color를 허용한다.

## 검증

component tests는 다음을 검증한다.

- public export와 props/native attribute forwarding, Provider 밖 hook Error
- 네 variant, 새 ID 반환, `dismiss`와 닫기 button 동작
- 5초 자동 닫힘, error 유지, unmount timer cleanup
- 세 개 상한, 자동 닫힘 항목 eviction, error 세 개일 때 새 Toast 거절
- `region`, `status`, polite live region, focus 이동 없음과 keyboard dismissal

Storybook에는 모든 variant, 세 개 stack, error 지속, 자동 닫힘, Provider 사용 예시를
제공한다. 모든 Story는 existing axe 설정으로 검사한다.

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 실제 브라우저에서 Tab과 Enter/Space로
닫기, 화면 하단 가운데 위치, 200% zoom, forced-colors, screen reader 알림을 수동 확인한다.

## 성공 기준

소비자는 새 의존성이나 반복적인 목록 상태 관리 없이 앱 어디서든 짧은 상태 알림을
추가할 수 있다. Toast는 최대 세 개만 보이고, 성공·정보·경고는 5초 후 사라지며 오류는
사용자가 확인할 때까지 유지한다.
