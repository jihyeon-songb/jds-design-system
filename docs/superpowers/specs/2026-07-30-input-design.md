# JDSB Input 설계

## 목적

`@jdsb/components`에 토큰 기반의 접근 가능한 native Input을 추가한다. 이 컴포넌트는 브라우저의 `<input>` 동작과 모든 적용 가능한 native 속성을 보존하며, 일관된 크기와 상태 스타일만 제공한다.

## 범위

포함:

- native `<input>` 기반의 `Input`
- `sm`, `md`, `lg`, `xl` 크기와 기본, hover, focus-visible, disabled, readOnly, invalid 상태
- controlled와 uncontrolled value 지원
- Input 전용 높이·여백 토큰, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 시작·끝 아이콘 슬롯
- 비밀번호 표시 전환, 검색 지우기, 숫자 증감 같은 type별 동작
- label, 설명, 오류 메시지를 묶는 FormField API
- 별도 JavaScript 입력 제한 또는 외부 의존성

## 공개 API

```ts
export type InputSize = "sm" | "md" | "lg" | "xl"

export type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> & {
  size?: InputSize
  invalid?: boolean
}
```

`Input`은 ref와 적용 가능한 native input 속성을 전달하며 native `<input>` 하나만 렌더링한다. native input의 숫자 `size` 속성은 JDSB의 문자열 `size` API와 충돌하므로 제외한다. 기본 `size`는 `"md"`다. `value`와 `defaultValue`를 포함한 controlled·uncontrolled 사용은 브라우저와 React의 기본 동작에 맡긴다.

`type`은 제한하지 않는다. 소비자는 목적에 맞는 native input type과 접근 가능한 이름을 제공한다. Input은 값 변환, 입력 차단, 자동 완성 제어를 추가하지 않는다.

## 상태와 접근성

- native `disabled`, `readOnly`, `required`, `type` 등의 속성을 그대로 사용한다.
- `invalid`이면 `aria-invalid="true"`를 설정한다. `invalid`가 아니면 소비자가 제공한 `aria-invalid`를 그대로 전달한다. 오류 메시지 연결은 이후 `FormField`가 담당한다.
- `data-state`는 `disabled`, `readonly`, `invalid`, `idle` 중 하나를 노출한다. disabled를 최우선으로 하고, 그다음 readOnly와 invalid 순서로 결정한다.
- 소비자가 제공한 `aria-describedby`를 변경하지 않는다.
- native Input의 키보드 입력, 선택, 포커스 순서를 변경하지 않는다.
- `:focus-visible`은 기존 focus token으로 표시한다. forced-colors에서는 시스템 색을 사용하고, `prefers-reduced-motion`에서는 transition을 제거한다.

## 토큰과 스타일

기존 `color.field.*`, `size.border`, `size.focus`, `radius.control`, `opacity.disabled` 토큰을 재사용한다. Input에는 `sm`, `md`, `lg`, `xl` 높이와 가로 여백에 필요한 최소 토큰만 추가한다. Button과 같은 높이 체계인 `32px`, `36px`, `40px`, `44px`를 사용한다.

CSS에는 시각 값 리터럴을 쓰지 않고 `--jdsb-*` 변수만 사용한다. 기본·hover·invalid 테두리와 disabled·readOnly 상태를 지원한다. Input의 native type별 동작 및 브라우저 제공 UI는 CSS로 재정의하지 않는다.

## 문서와 검증

Storybook에 기본, 모든 size, disabled, readOnly, invalid, 긴 값, `type="password"` Story를 추가한다. 기존 preview의 axe error 설정을 모든 Story에 적용한다.

컴포넌트 테스트는 다음을 검증한다:

- ref와 native input 속성 전달
- controlled와 uncontrolled value 동작
- `invalid`의 `aria-invalid`
- disabled·readOnly와 우선순위에 따른 `data-state` 노출
- `size`의 `data-size` 노출

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, Storybook build를 실행한다. 키보드 포커스, 브라우저 확대, forced-colors는 수동으로 확인한다.

## 성공 기준

서비스는 토큰 CSS를 import한 뒤 `Input` 하나로 native 입력 동작을 유지하면서 일관된 크기, 상태 스타일, 키보드 포커스를 사용할 수 있다.
