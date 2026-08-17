# Combobox 설계

## 목적

`@jdsb/components`에 입력 텍스트로 옵션을 필터하고 단일 값을 선택하는 접근 가능한
`Combobox`를 추가한다. 고정된 목록에서 값을 고르는 `Select`와 달리 사용자는 값을
검색할 수 있다.

## 범위

포함:

- `Combobox`, `ComboboxInput`, `ComboboxList`, `ComboboxOption`, `ComboboxEmpty`
  compound API
- `value`/`defaultValue`와 `open`/`defaultOpen`의 controlled·uncontrolled 상태
- 대소문자를 무시하는 option 텍스트 필터, 활성 option, 단일 선택
- ArrowUp/ArrowDown, Home/End, Enter, Escape 키보드 조작
- hidden native input을 통한 `name` 기반 form 제출
- disabled·required·invalid 상태, semantic token CSS, 컴포넌트·Storybook axe 검사

제외:

- 원격 검색, 비동기 loading, 자유 입력값, 다중 선택·tag, 그룹, 가상 스크롤
- 한글 초성 검색, Portal, animation, viewport 충돌 회피, DatePicker 조합

## 공개 API

```tsx
type ComboboxUncontrolledValueProps = {
  defaultValue?: string
  onValueChange?: (value: string) => void
  value?: never
}

type ComboboxControlledValueProps = {
  defaultValue?: never
  onValueChange?: (value: string) => void
  value: string
}

type ComboboxUncontrolledOpenProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type ComboboxControlledOpenProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type ComboboxProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
  disabled?: boolean
  invalid?: boolean
  name?: string
  required?: boolean
} & (ComboboxUncontrolledValueProps | ComboboxControlledValueProps)
  & (ComboboxUncontrolledOpenProps | ComboboxControlledOpenProps)

export type ComboboxInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "aria-activedescendant" | "aria-autocomplete" | "aria-controls" |
  "aria-expanded" | "aria-haspopup" | "role" | "value"
>
export type ComboboxListProps = ComponentPropsWithoutRef<"div">
export type ComboboxOptionProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  disabled?: boolean
  value: string
}
export type ComboboxEmptyProps = ComponentPropsWithoutRef<"div">
```

`value`는 선택한 option의 식별값이고 input에는 해당 option의 텍스트가 표시된다.
`ComboboxInput`에는 접근 가능한 이름이 필수다. `Combobox`는 선택값과 열림 상태를
독립적으로 controlled 또는 uncontrolled로 사용할 수 있다. `value` 또는 `open`이
제어되면 해당 변경 콜백만 요청하며, 공급된 prop이 바뀌기 전에는 표시 상태를 바꾸지
않는다.

## 상태와 상호작용

root context는 선택값·열림 상태·필터 문자열·활성 option ID·input/listbox ref와
등록된 option을 공유한다. compound part가 root 밖에 렌더링되면
`"Combobox compound components must be used within Combobox"` 오류를 낸다.

`ComboboxInput`은 편집 가능한 `<input role="combobox">`이다. `aria-controls`는
`ComboboxList`의 안정적인 ID를 가리키고, `aria-haspopup="listbox"`,
`aria-autocomplete="list"`, `aria-expanded`를 제공한다. list는 열려 있을 때만
`<div role="listbox">`로 렌더링한다. option은 `<div role="option">`이며
`aria-selected`, `data-state="selected" | "active" | "idle" | "disabled"`를
노출한다.

입력은 열림을 요청하고 option의 텍스트를 `toLocaleLowerCase()`로 비교해 포함 검색한다.
선택한 option 텍스트와 다른 입력을 시작하면 선택값은 유지한 채 결과만 필터한다. 방향키는
보이는 enabled option 사이를 이동하고 양 끝에서 멈춘다. Home/End는 첫·마지막 보이는
enabled option으로 이동한다. Enter는 활성 option을 선택하고 목록을 닫으며, Escape는
목록만 닫고 선택값과 input 텍스트를 마지막 선택 option으로 복원한다. option 클릭도
같은 선택을 요청한다. disabled option은 활성화·선택되지 않는다.

`name`이 있으면 선택값을 가진 hidden `<input>`을 렌더링한다. root가 disabled이면
native input도 disabled여서 `FormData`에서 제외된다. `required`는 ComboboxInput에
전달한다.

## 스타일과 토큰

새 토큰을 추가하지 않는다. Input과 Select의 `color.field.*`, `radius.control`,
`size.border`, `size.focus`, `size.control.input.md.height`, `space.input.inline`,
`opacity.disabled` semantic token을 사용한다. 목록은 input 아래에 절대 배치하고 root
너비에 맞춘다. focus-visible, hover, invalid, disabled, selected, active 상태를
제공한다. forced-colors에서는 시스템 색을 허용하고 reduced-motion에서는 transition을
두지 않는다.

## 검증

- public export·prop type, compound context 오류, ref·className·HTML prop 전달
- uncontrolled/controlled value와 open 요청, hidden input `FormData`, disabled·required
- 대소문자·한글 전체 문자열 필터, 결과 없음, selected/active ARIA 상태
- ArrowUp/ArrowDown/Home/End/Enter/Escape, disabled option 건너뛰기, input focus 유지
- 기본, controlled, no matches, disabled option Story와 모든 Story axe 검사

릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. 실제 브라우저에서 키보드, 200%
확대, forced-colors, 스크린리더의 combobox·option 안내를 수동 점검한다.
