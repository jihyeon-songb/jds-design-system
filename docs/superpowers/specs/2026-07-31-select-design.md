# JDS Select 설계

## 목적

`@jds/components`에 접근 가능한 단일 선택 복합 Select를 추가한다. 이
컴포넌트는 native `<select>`가 아닌 WAI-ARIA select-only combobox 패턴을
구현하며, 옵션 안의 조합 가능한 콘텐츠와 그룹을 지원한다.

## 범위

포함:

- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`,
  `SelectLabel`, `SelectItem` 조합 API
- 문자열 값 하나를 위한 controlled·uncontrolled 상태
- 키보드 열기·탐색·선택·닫기와 첫 글자 탐색
- 단일 포커스 대상, ARIA 의미, 보이는 포커스 표시
- `name` 기반 hidden input 폼 제출
- 기본·hover·focus-visible·disabled·invalid·open 상태, Storybook과 axe 검사

제외:

- `multiple`, 검색 입력, 옵션 생성, 가상화, 비동기 옵션
- Portal, 뷰포트 충돌 회피, 자동 위·아래 배치
- native form constraint validation 대체
- 아이콘 라이브러리 또는 외부 UI 라이브러리

`required`는 Trigger에 `aria-required`를 전달할 수 있지만 hidden input은
브라우저 constraint validation 대상이 아니다. 폼의 필수값 검사는 소비자가
제출 시 수행하고, 오류를 `invalid`로 표시한다.

## 공개 API

```tsx
export type SelectProps = {
  children: ReactNode
  defaultOpen?: boolean
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  name?: string
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string) => void
  open?: boolean
  required?: boolean
  value?: string
}

export type SelectTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "type">

export type SelectValueProps = {
  placeholder?: ReactNode
}

export type SelectContentProps = ComponentPropsWithoutRef<"div">

export type SelectGroupProps = ComponentPropsWithoutRef<"div">

export type SelectLabelProps = ComponentPropsWithoutRef<"div">

export type SelectItemProps = Omit<ComponentPropsWithoutRef<"div">, "value"> & {
  disabled?: boolean
  value: string
}
```

`value`와 `open`은 각각 `defaultValue`와 `defaultOpen`을 사용해 독립적으로
제어 또는 비제어로 사용할 수 있다. 제어 props가 제공되면 내부 상태는 해당
값을 대체하지 않고 콜백으로 변경을 요청한다. `SelectItem`의 `value`는
문자열이고 같은 Select 안에서 고유해야 한다.

```tsx
<Select name="country" defaultValue="kr" onValueChange={setCountry}>
  <SelectTrigger aria-label="국가">
    <SelectValue placeholder="국가를 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>아시아</SelectLabel>
      <SelectItem value="kr">대한민국</SelectItem>
      <SelectItem value="jp">일본</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

`SelectTrigger`의 `type`은 항상 `"button"`이다. 접근 가능한 이름은
`aria-label` 또는 외부 `<label>` 연결로 소비자가 제공한다. `SelectValue`는
선택한 Item의 텍스트를 보여 주며 값이 없을 때만 placeholder를 표시한다.

## 구조와 상태

`Select`는 Context로 선택값, open 상태, active item, 등록 Item의 value·text·
disabled·DOM id·ref를 하위 컴포넌트에 제공한다. Context는 이 한 조합 위젯의
상태 공유 용도만 가진다.

`SelectContent`는 open일 때만 렌더링되는 `role="listbox"`이다. `SelectGroup`는
`role="group"`이며 `SelectLabel`의 id를 `aria-labelledby`로 연결한다.
`SelectItem`는 `role="option"`, `aria-selected`, disabled일 때 `aria-disabled`
를 설정한다. disabled Item은 active·선택 대상이 아니다.

`SelectTrigger`는 `role="combobox"`, `aria-haspopup="listbox"`,
`aria-expanded`, `aria-controls`, open 상태의 `aria-activedescendant`를
설정한다. 포커스는 항상 Trigger에 남으므로 Content와 Item은 tab stop이 아니다.
Trigger에는 접근성 트리에 노출되지 않는 기본 chevron 표시를 포함한다.

`name`이 있으면 `Select`는 선택값을 가진 `<input type="hidden">`을 렌더링한다.
disabled일 때는 hidden input도 disabled로 설정해 폼 데이터에서 제외한다.

## 상호작용

닫힌 Trigger에서 Enter, Space, ArrowDown, ArrowUp을 누르면 목록을 연다. 열 때
active Item은 현재 선택값의 enabled Item이고, 선택값이 없거나 disabled면 Enter,
Space, ArrowDown은 첫 enabled Item, ArrowUp은 마지막 enabled Item을 active로 만든다.

열린 상태에서 ArrowDown·ArrowUp은 다음·이전 enabled Item으로 이동하고 끝에서
반대쪽으로 순환하지 않는다. Home·End는 각각 첫·마지막 enabled Item으로 이동한다.
Enter와 Space는 active Item을 선택하고 목록을 닫으며 Trigger에 포커스를 유지한다.
Escape는 값을 바꾸지 않고 목록만 닫는다. Tab은 기본 포커스 이동을 허용하며,
Trigger blur 시 목록을 닫는다. 바깥 pointerdown도 목록을 닫는다.

문자 키는 현재 시간으로부터 500ms 이내에 입력된 접두사를 누적해 enabled Item의
텍스트와 대소문자를 구분하지 않고 비교한다. 일치하는 첫 Item을 active로 만든다.
일치 항목이 없으면 현재 active Item을 유지한다. 이 동작은 검색 UI를 렌더링하지
않는다.

Pointer로 enabled Item을 누르면 그 Item을 선택하고 닫는다. Item의 pointerdown은
기본 포커스 이동을 막아 Trigger blur가 선택보다 먼저 Content를 닫지 않게 한다.

## 스타일과 토큰

외부 UI·아이콘 라이브러리는 사용하지 않는다. Trigger와 Content에는 기존
`color.field.*`, `color.focus.ring`, `size.border`, `size.focus`,
`size.control.input.*`, `space.input.inline`, `radius.control`,
`opacity.disabled` 토큰을 재사용한다. Content는 Select root를 기준으로 아래에
absolute 배치하며 Trigger와 같은 너비를 사용한다. 별도 그림자·애니메이션·새 토큰은
추가하지 않는다.

기본 chevron은 inline SVG로 렌더링하고 `aria-hidden="true"` 및
`focusable="false"`를 설정한다. CSS의 모든 색상·간격·크기·테두리·반경은
`--jds-*` 토큰만 사용한다. forced-colors에서는 시스템 색을 허용하고,
prefers-reduced-motion에서는 전환을 적용하지 않는다.

## 검증

컴포넌트 테스트는 다음을 검증한다:

- controlled·uncontrolled value와 open 상태
- Trigger의 ARIA 속성, Content·Group·Item 의미, accessible name
- 키보드 열기, Arrow/Home/End 이동, Enter/Space 선택, Escape 닫기, 첫 글자 탐색
- disabled Item 건너뛰기와 disabled Select의 동작 차단
- pointer 선택과 바깥 클릭 닫기
- `name` hidden input의 값과 disabled 제외
- invalid 상태와 `data-state` 노출

Storybook은 기본, placeholder, groups, disabled item, disabled, invalid,
controlled, 긴 텍스트 상태를 제공한다. preview의 axe error 설정으로 각 Story를
검사한다. 릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
Storybook build를 실행한다. 키보드, 스크린리더, 확대, forced-colors는 수동으로
확인한다.

## 성공 기준

소비자는 외부 의존성 없이 조합형 JSX로 단일 값을 선택하고, 키보드와 포인터로
동등하게 조작하며, 선택값을 폼에 제출할 수 있다. Trigger는 명확한 접근 가능한
이름과 상태를 노출하고, Content의 그룹과 옵션은 보조 기술에 올바르게 전달된다.
