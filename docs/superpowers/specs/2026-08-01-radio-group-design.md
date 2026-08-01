# JDS RadioGroup 설계

## 목적

`@jds/components`에 하나의 값만 선택하는 토큰 기반 RadioGroup을 추가한다.
각 항목은 native `<input type="radio">`로 구현해 브라우저의 단일 선택, 화살표 키,
Space, 폼 제출, constraint validation과 form reset을 보존한다. JDS는 controlled와
uncontrolled 값, Group 상태 전파, 일관된 상태 스타일만 담당한다.

## 범위

포함:

- `RadioGroup`, `RadioGroupItem` 조합 API
- 문자열 하나를 위한 controlled·uncontrolled `value`
- `name`, `required`, `disabled`, 개별 Item `disabled`, form reset
- 기본, checked, hover, focus-visible, disabled, invalid 상태와 세로·가로 배치
- 기존 `Label`/`FieldLabel`을 통한 item label 연결
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- Item label, description, error를 받는 별도 props 또는 wrapper
- 사용자 정의 `role="radio"`, roving tabindex, 수동 화살표 키 처리
- 아이콘·카드형 선택지, indicator 교체, size·variant API
- RadioGroup 내부 FormField 자동 연결, toolbar 전용 키보드 동작, 외부 UI 라이브러리

카드형 표시나 toolbar 안의 radio 동작이 필요하면 별도 컴포넌트와 명시적인 키보드
설계를 추가한다. 이 작업은 표준 form radio에 집중한다.

## 공개 API

```ts
export type RadioGroupProps = Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {
  children: React.ReactNode
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  name?: string
  onValueChange?: (value: string) => void
  orientation?: "vertical" | "horizontal"
  required?: boolean
  value?: string
}

export type RadioGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "checked" | "defaultChecked" | "name" | "required" | "type" | "value"
> & {
  value: string
}
```

`RadioGroup`은 `role="radiogroup"`인 `<div>` 하나를 렌더링한다. `value`가 있으면
controlled이고, 없으면 `defaultValue`에서 시작하는 internal value를 사용한다.
`onValueChange`는 선택이 실제로 변경될 때 호출한다. `name`, `required`, `disabled`,
`invalid`와 선택 값은 context로 모든 Item에 전달한다.

`RadioGroupItem`은 반드시 Group 안에서만 쓰며, `type="radio"`인 input 하나를
렌더링한다. `value`는 필수다. Group이 `name`, `checked`, `required`와 Group 수준
`disabled`를 관리하므로 Item 소비자는 이를 전달할 수 없다. `id`, `disabled`,
`onChange`, `aria-describedby`, `form` 등 나머지 적용 가능한 native input 속성은 전달한다.
개별 `disabled`는 Group이 활성 상태여도 해당 Item만 비활성화한다.

Item의 접근 가능한 이름은 `Label` 또는 `FieldLabel`의 `htmlFor`로 제공한다.
Group 자체에는 항상 `aria-label` 또는 `aria-labelledby` 중 하나를 제공한다. TypeScript는
기존 div ARIA props를 보존하며, Storybook과 axe가 이름 누락을 검출한다.

```tsx
<FieldGroup>
  <FieldTitle id="delivery-label">배송 방식</FieldTitle>
  <RadioGroup aria-labelledby="delivery-label" defaultValue="standard" name="delivery">
    <Field orientation="horizontal">
      <RadioGroupItem id="standard" value="standard" />
      <FieldLabel htmlFor="standard">일반 배송</FieldLabel>
    </Field>
    <Field orientation="horizontal">
      <RadioGroupItem id="express" value="express" />
      <FieldLabel htmlFor="express">빠른 배송</FieldLabel>
    </Field>
  </RadioGroup>
</FieldGroup>
```

## 상태와 접근성

- Root는 `data-orientation="vertical|horizontal"`을 노출한다. `disabled`이면
  `data-state="disabled"`, `invalid`이면 `data-state="invalid"`, 그 외에는
  `data-state="enabled"`이다. disabled가 invalid보다 우선한다.
- Item은 Group disabled 또는 자체 disabled면 `data-state="disabled"`, 그렇지 않고
  Group invalid면 `data-state="invalid"`, 선택되면 `data-state="checked"`, 아니면
  `data-state="unchecked"`이다. 우선순위는 disabled, invalid, checked, unchecked다.
- Group `invalid`는 root에 `aria-invalid="true"`를 설정하고 그렇지 않으면 소비자가
  전달한 `aria-invalid`를 보존한다. Item에는 별도의 ARIA invalid를 강제하지 않는다.
- Group `required`는 각 Item의 native `required`로 전달한다. 선택값이 없을 때
  브라우저의 native constraint validation을 사용한다.
- native radio가 Tab, Shift+Tab, Space와 arrow-key 선택·포커스 이동을 담당한다.
  JavaScript로 키보드 이벤트나 ARIA radio state를 다시 구현하지 않는다.
- uncontrolled Group은 Item의 change 이벤트로 값을 기록한다. `event.preventDefault()`가
  호출되면 값을 기록하거나 `onValueChange`를 호출하지 않는다. form reset 뒤에는
  microtask에서 `defaultValue`로 internal value를 동기화해 Item `data-state`도 native
  checked 상태와 일치하게 한다. controlled Group은 value를 바꾸지 않는다.
- Group disabled와 Item disabled는 native disabled 속성으로 pointer·keyboard 변경과
  FormData 제출을 막는다. Group disabled는 Item의 자체 disabled보다 우선한다.

## 토큰과 스타일

`size.control.radio.size`(16px)와 `space.radio.target`(4px) dimension token을 추가해
CSS 상호작용 영역을 정확히 24 × 24 CSS px로 만든다. `space.field.item`은 RadioGroup
항목 간 간격에 재사용한다. checked 색에는 `color.action.primary.background`, invalid
outline에는 `color.field.invalid-border`, focus-visible outline에는 `size.focus`와
`color.focus.ring`, disabled에는 `opacity.disabled`를 사용한다.

`RadioGroup.css`는 Root에 flex direction과 token gap만 적용하고, RadioGroupItem에는
token 기반 `accent-color`, 크기, padding, margin reset과 visible focus outline을 적용한다.
모든 시각 값은 CSS custom property여야 하며 리터럴 색상·간격·크기·테두리·반경을
추가하지 않는다. native radio 외형과 `Label`/`Field` 레이아웃은 유지한다. forced-colors
에서는 시스템 색을 허용하고, 새 transition을 추가하지 않는다.

## 문서와 검증

Storybook은 기본, 미선택, controlled, horizontal, 개별 Item disabled, Group disabled,
invalid, required, FieldLabel 조합, 긴 label 예시를 제공한다. 모든 Story는 기존 preview의
axe 오류 설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- public export와 props type, fixed radio type, ref와 native form props 전달
- uncontrolled 선택과 `data-state`, controlled value 보존, preventDefault 처리
- 같은 name의 한 값만 FormData로 제출되고 form reset 뒤 상태가 기본값으로 복귀함
- native label click, Space, arrow key가 선택·포커스를 올바르게 변경함
- Group·Item disabled, required, invalid의 native·ARIA·data-state 우선순위
- Group 밖 Item 사용 시 명확한 오류를 냄

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 Tab/Shift+Tab, Space,
좌우·상하 화살표, label click, form reset, 브라우저 확대, forced-colors를 수동 확인하고
스크린리더로 Group 이름·선택 상태·disabled·invalid 전달을 확인한다.

## 성공 기준

소비자는 토큰 CSS를 import하고 `RadioGroup`, `RadioGroupItem`, 기존 Label 계열만
조합해 native 폼·키보드·접근성 동작을 보존하는 단일 선택 control을 사용할 수 있다.
외부 의존성, custom radio semantics, 소비자 측 상태 동기화 없이 checked, disabled,
invalid, controlled·uncontrolled 상태가 일관되게 동작한다.
