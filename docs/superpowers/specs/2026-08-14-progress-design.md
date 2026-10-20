# JDSB Progress 설계

## 목적

`@jdsb/components`에 작업의 진행 상태를 나타내는 token 기반 `Progress`를 추가한다.
브라우저 native `<progress>`의 determinate·indeterminate 의미와 값 계산을 그대로
사용하고, JDSB는 접근 가능한 이름과 일관된 시각 스타일만 제공한다.

## 범위

포함:

- 필수 `label`로 이름을 갖는 단일 `Progress` 프리미티브
- native `<progress>` 속성, 이벤트, `className`, ref 전달
- determinate (`value` 제공)와 indeterminate (`value` 생략) 상태
- progress track·indicator semantic token, token 기반 CSS, 컴포넌트 테스트,
  Storybook Story와 axe 검사

제외:

- JavaScript로 만든 `role="progressbar"` 대체 구현
- 자동 증가, 애니메이션, 완료 콜백, 상태 관리, variant·size API
- 보이는 label·퍼센트 텍스트·취소 버튼 같은 조합 UI
- 외부 UI 라이브러리와 새 의존성

진행값 계산, 표시 문구와 상태 변경은 소비자가 책임진다. `Progress`는 전달한 native
`value`와 `max`를 변환·반올림·제한하지 않는다.

## 공개 API

```ts
export type ProgressProps = Omit<React.ComponentPropsWithoutRef<"progress">, "aria-label"> & {
  label: string
}
```

```tsx
<Progress label="파일 업로드" max={100} value={40} />
<Progress label="파일 업로드 진행 중" />
```

`label`은 필수이며 root의 `aria-label`로 설정한다. 소비자는 별도의 `aria-label`을
전달할 수 없다. 이 제한으로 props와 실제 accessible name이 서로 달라지는 것을 막는다.
`value`가 있으면 native determinate progress, 없으면 native indeterminate progress가
된다. `max`의 기본값과 유효 범위는 브라우저 native 계약을 따른다.

컴포넌트는 `HTMLProgressElement` ref를 전달하고, `className`은 `jdsb-progress`와
결합한다. 그 밖의 native progress 속성과 이벤트는 보존한다.

## 접근성

- native `<progress>`를 사용해 `progressbar` 역할과 현재 값 의미를 브라우저에 맡긴다.
- `label`은 항상 non-empty 접근 가능한 이름이어야 한다.
- determinate 상태에서는 native `value`·`max`가 현재 값 의미를 제공한다. indeterminate
  상태에서는 `value`를 넣지 않는다.
- `Progress`는 조작 요소가 아니므로 keyboard handler와 focus style을 추가하지 않는다.
- forced-colors에서는 시스템 색 조정을 허용한다.

## 토큰과 스타일

기본 테마에 다음 semantic token을 추가한다.

```json
"progress": {
  "track": { "$value": "{color.neutral.100}", "$type": "color" },
  "indicator": { "$value": "{color.action.primary.background}", "$type": "color" }
}
```

`.jdsb-progress`와 browser progress pseudo-element는 위 token만 사용한다. root에는
`accent-color`와 track background를 적용하고, WebKit·Firefox의 track/indicator
pseudo-element에도 같은 token을 적용한다. 기본 inline/block 크기, margin, border,
radius는 추가하지 않는다. 소비자가 레이아웃을 결정한다. CSS에 색상·크기·간격·반경·시간의
리터럴 값을 쓰지 않는다.

## 문서와 검증

Storybook은 40/100 determinate upload와 value를 생략한 indeterminate upload Story를
제공한다. determinate Story는 `progressbar` 이름과 값을 play에서 검사한다. 모든 Story는
기존 axe 검사 대상에 남긴다.

컴포넌트 테스트는 package entry export와 공개 prop type, `<progress>` 렌더링, 필수 label의
accessible name, determinate·indeterminate native 상태, native 속성·이벤트·ref 전달과
JDSB/소비자 class 결합을 검증한다. 구현 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`,
`pnpm lint`와 Storybook 검사를 실행한다.

## 성공 기준

소비자는 새 의존성이나 상태 API 없이 named determinate·indeterminate progress를 사용할 수
있다. 컴포넌트는 native semantics를 보존하며, 모든 기본 시각 값은 semantic token으로만
정의된다.
