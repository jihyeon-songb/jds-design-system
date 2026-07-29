# JDS Textarea 설계

## 목적

`@jds/components`에 토큰 기반의 접근 가능한 native Textarea를 추가한다. 이 컴포넌트는 브라우저의 `<textarea>` 동작을 보존하고, `maxLength`가 설정된 경우에만 현재 글자 수 카운터를 제공한다.

## 범위

포함:

- native `<textarea>` 기반의 `Textarea`
- `sm`, `md`, `lg` 크기와 기본, hover, focus-visible, disabled, readOnly, invalid 상태
- `maxLength`가 있을 때의 `현재 / 최대` 카운터
- controlled와 uncontrolled value 지원
- Textarea 토큰, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 자동 높이 조절
- label, 설명, 오류 메시지를 묶는 FormField API
- 별도 JavaScript 입력 제한 또는 외부 의존성
- 브라우저 기본 Textarea 크기 조절 동작 변경

## 공개 API

```ts
export type TextareaSize = "sm" | "md" | "lg"

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  size?: TextareaSize
  invalid?: boolean
}
```

`Textarea`는 native textarea 속성과 ref를 전달한다. 기본 `size`는 `"md"`다. `value`와 `defaultValue`를 모두 지원하며, 카운터는 DOM value에서 현재 길이를 읽어 controlled와 uncontrolled 사용에서 같은 값을 표시한다.

`maxLength`가 설정된 경우에만 카운터를 렌더링한다. native `maxLength` 속성이 입력 길이를 제한하므로 컴포넌트가 별도로 값을 자르거나 입력 이벤트를 막지 않는다.

## 상태와 접근성

- native `disabled`, `readOnly`, `maxLength` 속성을 그대로 사용한다.
- `invalid`이면 `aria-invalid="true"`를 설정한다. 오류 메시지의 연결은 이후 `FormField`가 담당한다.
- `data-state`는 `disabled`, `readonly`, `invalid`, `idle` 중 하나를 노출한다. disabled를 최우선으로 하고, 그다음 readOnly와 invalid 순서로 결정한다.
- 카운터는 `maxLength`가 있을 때만 `현재 / 최대` 형식으로 표시하고 `aria-live="polite"`로 값 변경을 알린다.
- 소비자가 제공한 `aria-describedby`와 카운터 ID를 함께 연결해 보조 기술에 카운터 정보를 제공한다.
- native Textarea의 키보드 입력, 선택, 줄바꿈, 포커스 순서를 변경하지 않는다.

## 토큰과 스타일

Textarea에 필요한 최소 semantic/component 토큰을 추가한다. 기본·hover·invalid의 배경, 글자색, 테두리색과 `sm`, `md`, `lg` 최소 높이 및 여백을 토큰으로 둔다. 기존 focus ring, disabled opacity, border size, control radius 토큰은 재사용한다.

CSS에는 시각 값 리터럴을 쓰지 않고 `--jds-*` 변수만 사용한다. `:focus-visible`은 기존 focus token으로 표시하며, disabled·readOnly·invalid 상태와 forced-colors 모드를 지원한다. `prefers-reduced-motion`에서 transition을 제거한다. Textarea의 기본 `resize` 동작은 CSS로 재정의하지 않는다.

## 문서와 검증

Storybook에 기본, 모든 size, maxLength 카운터, disabled, readOnly, invalid, 긴 내용 Story를 추가한다. 기존 preview의 axe error 설정을 모든 Story에 적용한다.

컴포넌트 테스트는 다음을 검증한다:

- ref와 native textarea 속성 전달
- `maxLength`가 없을 때 카운터가 렌더링되지 않음
- `maxLength`가 있을 때 controlled와 uncontrolled value에서 카운터가 표시·갱신됨
- invalid의 `aria-invalid`, disabled와 readOnly 상태 노출

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, Storybook build를 실행한다. 키보드 포커스, 브라우저 확대, forced-colors는 수동으로 확인한다.

## 성공 기준

서비스는 토큰 CSS를 import한 뒤 `Textarea` 하나로 native 입력 동작, 일관된 상태 스타일, 최대 글자 수 제한과 접근 가능한 카운터를 사용할 수 있다.
