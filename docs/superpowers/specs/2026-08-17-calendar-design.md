# Calendar 컴포넌트 설계

## 목표

`@jdsb/components`에 단일 날짜를 선택하는 접근 가능한 월 단위 Calendar
프리미티브를 추가한다. 이 컴포넌트는 DatePicker나 날짜 문자열 입력을
대체하지 않는다.

## 범위

- `YYYY-MM-DD` 형식의 단일 선택 값
- `YYYY-MM` 형식의 표시 월
- controlled와 uncontrolled value/month API
- 이전·다음 월 버튼과 키보드 날짜 탐색
- `min`과 `max`에 따른 선택 불가 날짜
- locale 기반 월·요일·날짜 접근성 이름

다음은 범위 밖이다: 날짜 범위·시간·preset·DatePicker trigger·텍스트
입력 파싱·다중 선택.

## 공개 API

```ts
export type CalendarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  "aria-label": string
  defaultMonth?: string
  defaultValue?: string
  locale?: string
  max?: string
  min?: string
  month?: string
  onMonthChange?: (month: string) => void
  onValueChange?: (value: string) => void
  value?: string
}
```

`value`와 `month`를 전달하면 각각 controlled 상태가 되며, 전달하지 않으면
`defaultValue`와 `defaultMonth`로 초기 상태를 정한다. `defaultMonth`도
없으면 현재 지역 날짜가 속한 월을 표시한다. `value`가 있으면 해당 날짜의
월을 우선 표시한다. `onValueChange`와 `onMonthChange`는 요청한 ISO 문자열을
전달하며, controlled 상태는 부모가 새 props를 전달할 때만 변경된다.

모든 날짜는 실제 달력 날짜여야 한다. 잘못된 `value`, `defaultValue`, `min`,
`max`는 `RangeError`를 발생시키며, `min > max`도 `RangeError`다. `month`와
`defaultMonth`도 실제 월이어야 한다. 선택 값이 min/max 밖이면 같은 방식으로
실패한다.

## 렌더링과 접근성

루트는 전달받은 `div` 속성을 보존한다. 달력은 `aria-label`을 갖는
`role="grid"`이며, 요일은 `role="columnheader"`, 날짜 칸은
`role="gridcell"`이고 내부에 native `button`을 둔다. 선택 날짜 칸에는
`aria-selected="true"`를 설정한다. 날짜 버튼의 접근 가능한 이름은 locale을
적용한 완전한 날짜다.

이전·다음 월 버튼은 locale을 적용한 접근 가능한 이름을 갖는다. min/max 밖의
날짜는 native `disabled` button으로 렌더링하며, 해당 월로 이동하는 버튼도
표시 월 전체가 범위 밖이면 비활성화한다. 비활성 날짜는 포커스와 선택 대상이
아니다.

표시 월의 날짜만 렌더링하고 월의 첫 주와 마지막 주의 빈 칸은 비상호작용
placeholder로 렌더링한다. 주는 일요일에 시작한다. 표시 월의 선택 날짜가
있으면 그 날짜 버튼만 tabbable하다. 선택 날짜가 표시 월에 없으면, 범위 안의
첫 날짜를 tabbable하게 한다. 정확히 하나의 enabled 날짜 버튼만 `tabIndex=0`이고
나머지는 `-1`이다.

## 상호작용

- 날짜 클릭 또는 Enter/Space: 해당 enabled 날짜를 선택하고 `onValueChange`를 호출한다.
- Arrow 키: 하루 단위로 이동한다. 다른 달로 넘어가면 `onMonthChange`를 호출하고
  새 활성 날짜에 포커스한다.
- Home/End: 현재 주의 첫/마지막 enabled 날짜로 이동한다.
- PageUp/PageDown: 이전/다음 달의 같은 일자로 이동한다. 해당 일이 없으면 그 달의
  마지막 날로 이동한다. Shift를 함께 누르면 1년 단위로 이동한다.
- Escape는 동작하지 않는다. 이 컴포넌트는 오버레이를 소유하지 않는다.

이동 목적지가 min/max 밖이면 가장 가까운 범위 안 날짜로 clamp한다. 범위 안의
날짜가 없는 월은 표시할 수 있지만 활성 날짜와 `tabIndex=0` 날짜를 만들지
않는다.

## 구현 경계

날짜 연산은 ISO 문자열을 직접 파싱하고 numeric `Date` 생성자와 local getter로
수행한다. `new Date("YYYY-MM-DD")`와 `toISOString()`은 사용하지 않아
시간대에 따른 날짜 이동을 방지한다. 외부 의존성은 추가하지 않는다.

스타일은 기존 semantic token을 사용한다. 기존 토큰으로 의미를 표현할 수 없는
Calendar 전용 값만 토큰 원본에 추가하며, CSS에는 시각 리터럴을 넣지 않는다.

## 검증

- 유효하지 않은 ISO 값과 잘못된 min/max 범위
- uncontrolled 및 controlled 값·월 상태
- 선택, Arrow, Home/End, PageUp/PageDown, 월 이동 뒤 포커스
- min/max 비활성화와 범위 경계 clamp
- 한국어 locale을 포함한 Storybook 및 axe 검사
- 컴포넌트 집중 테스트, `pnpm typecheck`, `pnpm test`, `pnpm build`
