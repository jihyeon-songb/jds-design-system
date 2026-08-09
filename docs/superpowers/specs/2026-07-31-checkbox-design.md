# JDSB Checkbox 설계

## 우선순위

현재 구현된 `Button`, `Input`, `Textarea`, `Select` 다음에는 다음 순서로 구현한다.

1. `Checkbox` — 가장 자주 쓰이는 독립 native control이다.
2. `Label`, `Field` 계열 — 기존 입력 요소와 Checkbox를 label·설명·오류 연결로 묶는다.
3. `RadioGroup`, `Switch` — 선택 상태를 공유하거나 전환하는 입력 control이다.
4. `IconButton`, `Alert`, `Badge`, `Avatar` — 폼 의존성이 없는 동작·정보 표현이다.
5. `Tabs`, `Accordion`, `Pagination` — 키보드 탐색을 제공하는 탐색 위젯이다.
6. `Dialog`, `Drawer`, `Tooltip`, `Toast` — 포커스 관리와 라이브 영역을 요구하는 overlay다.

이 문서는 첫 항목인 Checkbox만 정의한다. `Label`과 `Field` 계열은 Checkbox의
외부 `<label>` 사용을 대체하지 않고, 다음 작업에서 별도로 설계한다.

## 목적

`@jdsb/components`에 토큰 기반의 접근 가능한 native Checkbox를 추가한다. 브라우저의
체크·해제, 폼 제출, 키보드, controlled·uncontrolled 상태는 native `<input>`에 맡기고,
JDSB는 일관된 크기·상태·focus-visible 스타일만 제공한다.

## 범위

포함:

- native `<input type="checkbox">` 기반 `Checkbox`
- 기본, checked, hover, focus-visible, disabled, invalid 상태
- native `checked`, `defaultChecked`, `name`, `value`, `required`, `onChange` 전달
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- indeterminate, checkbox group, 전체 선택 API
- label·설명·오류 메시지를 조합하는 wrapper API
- 별도 size·variant API, 아이콘, 외부 UI 라이브러리

indeterminate와 group은 실제 상위 선택 요구가 생길 때 native input의 DOM property와
`Field`/그룹 설계를 함께 추가한다. 지금은 native input 하나가 요구를 충족한다.

## 공개 API

```ts
export type CheckboxProps = Omit<React.ComponentPropsWithoutRef<"input">, "type"> & {
  invalid?: boolean
}
```

`Checkbox`는 항상 `type="checkbox"`인 native input 하나를 렌더링하고 ref와 나머지
적용 가능한 native 속성을 전달한다. `checked`와 `defaultChecked`의 제어 방식은 React와
브라우저 기본 동작을 보존한다. `type`은 고정하므로 소비자가 덮어쓸 수 없다.

접근 가능한 이름은 소비자가 인접한 `<label htmlFor>` 또는 `aria-label`/`aria-labelledby`
중 하나로 제공한다. label 텍스트를 props로 추가하지 않는다.

## 상태와 접근성

- `disabled`이면 native disabled 상태와 `data-state="disabled"`를 사용한다.
- `invalid`이면 `aria-invalid="true"`, `data-state="invalid"`를 설정한다. 그렇지 않으면
  소비자가 전달한 `aria-invalid`를 보존한다.
- 그 외 상태는 checked이면 `data-state="checked"`, 아니면 `data-state="unchecked"`다.
  우선순위는 disabled, invalid, checked, unchecked다.
- Space 키와 pointer 동작은 native control에 맡긴다. JavaScript click handler나 role을
  추가하지 않는다.
- CSS 상호작용 영역은 24 × 24 CSS px 이상으로 제공하며 focus-visible outline에는 기존
  `size.focus`와 `color.focus.ring` 토큰을 사용한다.
- forced-colors에서 시스템 색을 허용하고 reduced-motion에서 transition을 추가하지 않는다.

## 토큰과 스타일

`size.control.checkbox`에 24px 정사각형 dimension token만 추가한다. checked 색은 기존
`color.action.primary.background`, focus는 기존 focus token, disabled는
`opacity.disabled`를 재사용한다. native checkbox의 외형은 유지하며 `accent-color`만
토큰으로 지정한다. CSS에 색상·간격·크기·테두리·반경 리터럴을 넣지 않는다.

invalid 상태는 native checkbox의 색을 대체하지 않고 `color.field.invalid-border` token을
사용한 outline으로 상태를 색 외의 focus outline과 구분되게 전달한다. 오류의 텍스트와
`aria-describedby` 연결은 Field 계열의 책임이다.

## 문서와 검증

Storybook은 기본, checked, disabled, invalid, native label, 긴 label, controlled 상태를
제공한다. preview의 axe error 설정으로 모든 Story를 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- ref, type 고정, native name/value/required 속성 전달
- uncontrolled click과 controlled checked 상태 보존
- disabled가 pointer·키보드 변경을 막음
- invalid와 disabled의 `aria-invalid`·`data-state` 우선순위
- label을 통한 접근 가능한 이름과 폼 값 제출

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 키보드 Space, label 클릭, 브라우저 확대,
forced-colors를 수동 확인한다.

## 성공 기준

소비자는 토큰 CSS를 import한 뒤 `Checkbox`와 native label만으로 키보드·포인터·폼에서
동등하게 동작하는 체크 제어를 사용할 수 있다. 외부 의존성이나 별도 소비자 상태 관리 없이
checked, disabled, invalid 상태와 접근 가능한 이름이 올바르게 전달된다.
