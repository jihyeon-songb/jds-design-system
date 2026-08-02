# JDS Badge 설계

## 목적

`@jds/components`에 상태와 분류를 짧은 텍스트로 보조하는 token 기반 `Badge`를
추가한다. Badge는 독립적인 알림이나 동작이 아니라, 인접한 콘텐츠의 상태를 읽기
쉽게 보강하는 비상호작용 표현 요소다.

## 범위

포함:

- `neutral`, `info`, `success`, `warning`, `error` variant를 갖는 단일 `Badge`
- native `<span>` 속성 및 ref 전달
- variant별 token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 클릭, 선택, 삭제, 토글, 링크 같은 상호작용
- 아이콘, 아바타, 숫자 카운트, dot-only 표현, 로딩 상태
- live region, 자동 announcement, Toast 또는 Alert와 같은 상태 알림 기능
- compound API와 외부 UI 라이브러리

Badge가 클릭이나 삭제 기능을 가져야 하면 해당 목적에 맞는 Button 또는 별도 Chip
컴포넌트를 설계한다. 상태 변경을 즉시 알려야 하면 `Alert` 또는 `Toast`를 사용한다.

## 공개 API

```ts
export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "error"

export type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant
}
```

`Badge`는 native `<span>` 하나를 root로 렌더링한다. `variant`의 기본값은
`"neutral"`이며, root는 `data-variant`를 노출한다. 모든 적용 가능한 native span
속성과 `ref`를 전달한다. `role`을 고정하거나 live region을 만들지 않으므로,
추가 의미가 필요한 소비자는 사용 맥락에 맞는 native 요소와 텍스트를 제공해야 한다.

```tsx
<Badge>초안</Badge>
<Badge variant="success">배포 완료</Badge>
<Badge variant="error">실패</Badge>
```

## 상태와 접근성

- Badge 자체는 상호작용하지 않으며 Tab 순서, 키보드 handler, focus style을 추가하지 않는다.
- 상태는 색상뿐 아니라 children의 텍스트로 전달한다. 색상만으로 의미를 전달하는
  dot-only Badge는 제공하지 않는다.
- root의 기본 의미는 native span이며, role과 aria 속성은 소비자가 전달한 값을 그대로
  사용한다.
- Badge는 live region이 아니므로 화면의 기존 콘텐츠가 바뀐 사실을 보조 기술에
  강제로 알리지 않는다. 즉시 알림이 필요한 상태 변경에는 Alert 또는 Toast를 쓴다.
- forced-colors에서는 시스템 색을 허용하며 animation과 transition을 추가하지 않는다.

## 토큰과 스타일

기존 primitive와 action semantic 토큰을 참조하는 다음 Badge component token을
`packages/tokens/src/jds.tokens.json`에 추가한다.

- `color.badge.{neutral,info,success,warning,error}.{background,foreground,border}`
- `space.badge.inline`, `space.badge.block`

`neutral`은 secondary action 계열을, `info`와 `success`는 primary action 계열을,
`warning`은 secondary action 계열을, `error`는 destructive action 계열을 초기값으로
참조한다. 처음에는 서로 같은 값을 공유할 수 있으나 variant별 semantic token을
분리하므로 이후 테마가 의미별 색을 독립적으로 재정의할 수 있다. 새 primitive 색은
추가하지 않는다.

Badge CSS는 위 CSS 변수와 기존 `radius.control`, `size.border`만 사용한다. root는
inline-flex로 내용 크기에 맞춰 배치하고, 배경·글자·테두리 색과 padding·radius를
token으로 적용한다. CSS에 색상, 간격, 크기, 테두리, 반경의 시각 리터럴을 넣지
않는다.

## 문서와 검증

Storybook은 neutral 기본값과 info, success, warning, error의 다섯 Story를 제공한다.
각 Story는 preview의 axe error 설정으로 검사한다. Story는 Badge가 상호작용 요소가
아니며 텍스트 상태를 표시한다는 사용 조건을 설명한다.

컴포넌트 테스트는 다음을 검증한다.

- 기본 `neutral` variant와 `data-variant`
- 각 variant 렌더링
- ref, className, id, role, aria-label 등 native span props 전달
- package entry의 `Badge`, `BadgeProps`, `BadgeVariant` export

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 200% 확대 및
forced-colors를 수동 확인한다.

## 성공 기준

소비자는 새 의존성이나 상호작용 API 없이, neutral을 기본으로 다섯 의미 variant의
짧은 텍스트 상태를 일관된 token 스타일로 표시할 수 있다. 테마는 각 variant token을
독립적으로 재정의할 수 있고, Badge는 native HTML 의미와 전달된 속성을 보존한다.
