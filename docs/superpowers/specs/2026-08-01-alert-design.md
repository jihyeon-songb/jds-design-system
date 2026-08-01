# JDS Alert 설계

## 목적

`@jds/components`에 작업 결과나 중요한 상태를 현재 위치에서 알리는 토큰 기반
`Alert`를 추가한다. Alert는 포커스를 이동하지 않으며, 오류만 긴급 알림으로 전달하고
그 밖의 상태는 비강제 상태 메시지로 전달한다.

## 범위

포함:

- `info`, `success`, `warning`, `error` variant를 갖는 단일 `Alert`
- 선택적 title과 본문 children
- `dismissible`, `open`/`defaultOpen`, `onOpenChange` 기반 닫기 상태
- variant별 live-region 역할, 키보드 조작 가능한 닫기 버튼
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- Alert queue, 자동 닫힘, transition, portal, stack manager
- 아이콘 prop 또는 자체 SVG icon 세트
- 복합 조합 API(`Alert.Root`, `Alert.Title` 등), 외부 UI 라이브러리
- Toast와 같은 일시적·전역 알림 동작

자동 닫힘과 여러 Alert의 순서 관리는 실제 제품의 시간 정책과 화면 배치 요구가 생길
때 Toast로 별도 설계한다. 현재는 페이지 흐름 안의 상태 알림 하나가 필요하다.

## 공개 API

```ts
export type AlertVariant = "info" | "success" | "warning" | "error"

type AlertBaseProps = Omit<React.ComponentPropsWithoutRef<"div">, "role"> & {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title?: React.ReactNode
  variant?: AlertVariant
}

export type AlertProps =
  | (AlertBaseProps & { dismissible?: false; closeLabel?: never })
  | (AlertBaseProps & { closeLabel: string; dismissible: true })
```

`Alert`는 native `<div>` 하나를 root로 렌더링하고 ref 및 적용 가능한 div 속성을
전달한다. `variant` 기본값은 `"info"`다. `title`은 Alert 안의 제목 텍스트이며,
children은 제목 아래의 본문이다. title이 없는 본문-only Alert도 지원한다.

`dismissible`이 true이면 `closeLabel`은 필수이며, Alert는
`<button type="button" aria-label={closeLabel}>` 닫기 버튼을 렌더링한다. 버튼의
보이는 기호는 접근 가능한 이름으로 사용하지 않는다. `dismissible`이 false이거나
생략되면 닫기 버튼을 렌더링하지 않는다.

`open`이 제공되면 controlled이고, 없으면 `defaultOpen`(기본 true)으로 시작하는
uncontrolled component다. 닫기 버튼은 `onOpenChange(false)`를 호출한다. uncontrolled
Alert는 이어서 닫히며 null을 렌더링하고, controlled Alert는 소비자가 open 값을
변경할 때만 닫힌다. 닫힌 Alert는 DOM에 남지 않으므로 exit transition과
`data-state="closed"`는 제공하지 않는다.

```tsx
<Alert
  closeLabel="알림 닫기"
  dismissible
  title="저장하지 못했습니다"
  variant="error"
>
  네트워크 연결을 확인한 뒤 다시 시도해 주세요.
</Alert>
```

## 상태와 접근성

- root는 `data-variant`와 렌더링 중인 `data-state="open"`을 노출한다.
- `error`는 `role="alert"`로 즉시 알리고, `info`, `success`, `warning`은
  `role="status"`로 비강제 안내한다. 소비자는 role을 덮어쓸 수 없다.
- Alert는 열리거나 닫힐 때 포커스를 이동하거나 가로채지 않는다.
- dismissible Alert의 close button은 Tab으로 도달하고 Enter와 Space로 동작한다.
  native button 동작을 별도로 재구현하지 않는다.
- close button은 최소 24 × 24 CSS px 조작 영역과 focus-visible 표시를 제공한다.
- `aria-live`, `aria-atomic`, `aria-relevant`를 별도로 설정하지 않는다. role의
  표준 live-region 의미를 사용해 소비자의 추가 announcement 정책과 충돌하지 않는다.
- forced-colors에서는 시스템 색을 허용하고, transition을 추가하지 않는다.

## 토큰과 스타일

기존 primitive 및 semantic 토큰으로 `color.alert.{info,success,warning,error}` 아래의
`background`, `foreground`, `border` component token을 추가한다. 초기 팔레트에
success/warning primitive가 없으므로 success는 primary action 계열, warning은
secondary action 계열을 재사용한다. error는 destructive action 계열을 사용한다.
새 색 primitive는 추가하지 않는다.

`space.alert.inline`, `space.alert.block`, `space.alert.gap`, `space.alert.close-gap`과
`size.control.alert-close` dimension token을 추가한다. Alert CSS는 해당 CSS 변수,
`radius.control`, `size.border`, `size.focus`, `color.focus.ring`만 사용한다.
CSS에 색상·간격·크기·테두리·반경의 시각 리터럴을 넣지 않는다.

root는 variant 색을 background, color, border에 적용하는 block layout이다. title과
body는 각각 `data-slot="title"`, `data-slot="description"`으로 식별하고, close
button은 `data-slot="close"`로 식별한다. close button은 Alert의 foreground를 상속해
고정 icon 색을 만들지 않는다.

## 문서와 검증

Storybook은 info, success, warning, error, title 없는 본문, dismissible,
controlled dismissible, 긴 본문 예시를 제공한다. 모든 Story는 preview의 axe error
설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- variant 기본값, ref와 native div props 전달, public export
- variant별 role과 `data-variant`/`data-state`
- title·본문 slot 렌더링 및 title 없는 본문 지원
- `dismissible`일 때의 required closeLabel type 계약과 close button 의미
- uncontrolled 닫힘·callback 호출, controlled state 보존과 external reopen
- close button의 keyboard Enter/Space 동작 및 focus-visible 대상 존재

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 Tab/Shift+Tab,
Enter·Space 닫기, 200% 확대, forced-colors, 스크린리더의 variant별 announcement를
수동 확인한다.

## 성공 기준

소비자는 별도 의존성이나 전역 알림 관리 없이, 페이지 흐름 안에서 오류와 일반 상태를
접근 가능한 live-region 의미로 알리고 필요하면 키보드로 닫을 수 있다. 상태 제어,
variant, title·본문, close label은 TypeScript와 native HTML 동작으로 일관되게
동작한다.
