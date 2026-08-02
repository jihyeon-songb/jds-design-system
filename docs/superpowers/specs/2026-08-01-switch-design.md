# JDS Switch 설계

## 목적

`@jds/components`에 boolean 값을 전환하는 토큰 기반 `Switch`를 추가한다.
native `<input type="checkbox">`를 유지하고 `role="switch"`를 추가해, 브라우저의
폼 제출, constraint validation, form reset, label click, Tab과 Space 동작을 보존한다.
JDS는 controlled·uncontrolled 상태, `data-state`, 크기와 토큰 기반 시각 표현만 담당한다.

## 범위

포함:

- `Switch` 단일 컴포넌트와 `sm`, `md`, `lg`, `xl` 크기
- `checked`와 `defaultChecked` 기반 controlled·uncontrolled 상태
- `disabled`, `required`, `invalid`, native input props, form reset
- 기본, checked, hover, focus-visible, disabled, invalid, forced-colors 상태
- 기존 `Label`/`FieldLabel`을 통한 접근 가능한 이름과 `Field` 조합
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 아이콘, 로딩, variant, 별도 on/off copy API
- custom button, 수동 키보드 처리, form 제출·검증·reset 재구현
- label, description, error를 받는 wrapper props
- 외부 UI 라이브러리 또는 새 의존성

## 공개 API

```ts
export type SwitchSize = "sm" | "md" | "lg" | "xl"

export type SwitchProps = Omit<React.ComponentPropsWithoutRef<"input">, "size" | "type"> & {
  invalid?: boolean
  size?: SwitchSize
}
```

`Switch`는 `type="checkbox"`와 `role="switch"`인 input 하나를 렌더링한다.
`checked`가 전달되면 controlled, 그렇지 않으면 `defaultChecked`에서 시작하는
uncontrolled component다. `size` 기본값은 `"md"`이고, Input과 같은 네 가지
문서화된 값만 받는다. 모든 적용 가능한 native input 속성과 ref를 전달한다.

소비자는 기존 `Label` 또는 `FieldLabel`의 `htmlFor`로 이름을 연결한다.
`aria-label` 또는 `aria-labelledby`도 허용한다. 설명과 오류는 기존 `FieldDescription`,
`FieldError`를 `aria-describedby`로 연결한다.

```tsx
<Field orientation="horizontal">
  <Switch
    aria-describedby="marketing-description"
    id="marketing"
    name="marketing"
    size="md"
  />
  <FieldContent>
    <FieldLabel htmlFor="marketing">마케팅 정보 수신</FieldLabel>
    <FieldDescription id="marketing-description">
      새로운 소식과 혜택을 알려드립니다.
    </FieldDescription>
  </FieldContent>
</Field>
```

## 상태와 접근성

- `data-state` 우선순위는 `disabled`, `invalid`, `checked`, `unchecked`다.
- `data-size`는 선택한 `sm`, `md`, `lg`, `xl` 값을 노출한다.
- `invalid`가 true면 `aria-invalid="true"`를 설정한다. 그렇지 않으면 소비자가 전달한
  `aria-invalid`를 보존한다.
- native `disabled`, `required`, `name`, `value`, `form` 속성을 그대로 전달한다.
  disabled input은 pointer·keyboard 변경과 `FormData` 제출에서 제외된다.
- `onChange`를 먼저 호출한다. handler가 `event.preventDefault()`를 호출하면
  uncontrolled state를 갱신하지 않아 `data-state`가 native checked 상태와 일치한다.
- uncontrolled input은 form reset 이벤트 뒤 microtask에서 native `checked` 값을 읽어
  internal state를 동기화한다. controlled input의 값은 바꾸지 않는다.
- native input이 Tab/Shift+Tab, Space, label click을 담당한다. JavaScript로 키보드
  이벤트나 switch ARIA state를 재구현하지 않는다.
- focus-visible outline은 `size.focus`와 `color.focus.ring` 토큰을 사용한다. forced-colors
  모드에서는 시스템 색을 허용한다.

## 토큰과 스타일

`size.control.switch` 아래에 다음 component token을 추가한다. track의 inline·block,
thumb, 이동 거리는 각각 `32×16px·12px·16px`(`sm`), `36×20px·16px·16px`(`md`),
`40×24px·20px·16px`(`lg`), `44×28px·24px·16px`(`xl`)이다. `space.switch.target`은
`4px`이고, `sm` native input의 조작 영역도 24 × 24 CSS px 이상이 되게 한다. track의 off 상태는
`color.field.border`, on 상태는 `color.action.primary.background`, hover는
`color.action.primary.hover`, invalid outline은 `color.field.invalid-border`, disabled는
`opacity.disabled`를 사용한다.

`Switch.css`는 native appearance를 제거한 input 하나에 pseudo-element로 track과 thumb를
그린다. CSS custom property만 사용하며 리터럴 색상·간격·크기·테두리·반경을 추가하지
않는다. checked는 thumb transform과 track 색을 변경한다. transition은 추가하지 않는다.

## 문서와 검증

Storybook은 기본, 각 크기, checked, controlled, disabled, invalid, required,
`FieldLabel`·설명·오류 조합, 긴 label 예시를 제공한다. 모든 Story는 preview의 axe
오류 설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- public export와 props type, fixed native `type`/`role`, ref와 form props 전달
- uncontrolled toggle과 `data-state`, controlled checked 보존, preventDefault 처리
- form reset 뒤 default checked 및 `data-state` 동기화, checked value의 `FormData` 제출
- native label click과 Space 키 동작
- disabled 제출 제외와 상태 우선순위, required, invalid ARIA, 모든 size attribute

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 Tab/Shift+Tab, Space,
label click, form reset, 브라우저 확대, forced-colors를 수동 확인하고, 스크린리더로
이름·switch 상태·disabled·invalid를 확인한다.

## 성공 기준

소비자는 토큰 CSS를 import하고 `Switch`와 기존 Label·Field 계열만 조합해 native
폼과 키보드·접근성 동작을 보존하는 on/off control을 사용할 수 있다. 외부 의존성이나
소비자 측 상태 동기화 없이 size, checked, disabled, invalid, controlled·uncontrolled
상태가 일관되게 동작한다.
