# JDS Accordion 설계

## 목적

`@jds/components`에 세로로 쌓인 섹션을 열고 닫는 접근 가능한 Accordion을 추가한다.
하나만 열 수 있는 `single`과 여러 개를 열 수 있는 `multiple`을 하나의 compound API로
제공한다. 각 header는 native heading 안의 native button으로 구현해 표준 키보드 동작과
접근성 의미를 보존한다.

## 범위

포함:

- `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`,
  `AccordionContent` 조합 API
- `type="single"`과 `type="multiple"`의 controlled·uncontrolled 열림 상태
- header click과 native Enter·Space로 패널 열기·닫기
- native heading, button, `aria-expanded`, `aria-controls`와 generated ID 관계
- Item별 disabled, 보이는 focus-visible 표시, token CSS, 컴포넌트 테스트,
  Storybook Story와 axe 검사

제외:

- 항상 하나의 패널을 열어 두는 `collapsible` API, root 수준 disabled
- 화살표/Home/End 키의 header 간 포커스 이동, animation, height 측정, lazy mount
- `region` role 자동 추가, 아이콘·indicator·variant·size API
- 중첩 Accordion 특수 처리, URL 동기화, 외부 UI 라이브러리와 새 의존성

Accordion header는 모두 일반 Tab 순서에 포함된다. 화살표 키 이동은 WAI-ARIA Accordion
패턴에서 요구되지 않으므로 native button의 Tab·Shift+Tab·Enter·Space 동작만 제공한다.
`region` landmark는 동시에 열린 패널이 많은 경우 남용될 수 있어 자동으로 부여하지
않는다. 패널 내용에 landmark가 필요한 소비자는 `AccordionContent`에 직접 role을 준다.

## 공개 API

```tsx
export type AccordionType = "single" | "multiple"

type AccordionSingleProps = {
  type: "single"
  value?: never
  defaultValue?: string
  onValueChange?: (value: string | null) => void
} | {
  type: "single"
  value: string | null
  defaultValue?: never
  onValueChange?: (value: string | null) => void
}

type AccordionMultipleProps = {
  type: "multiple"
  value?: never
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
} | {
  type: "multiple"
  value: string[]
  defaultValue?: never
  onValueChange?: (value: string[]) => void
}

export type AccordionProps = ComponentPropsWithoutRef<"div"> &
  (AccordionSingleProps | AccordionMultipleProps) & {
    children: ReactNode
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  }

export type AccordionItemProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
  disabled?: boolean
  value: string
}

export type AccordionHeaderProps = ComponentPropsWithoutRef<"h3">

export type AccordionTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "disabled" | "id" | "type"
>

export type AccordionContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-labelledby" | "hidden" | "id"
>
```

`type`은 필수다. `single`은 열린 항목 하나의 `string` 또는 모두 닫힌 `null`을 받고,
`multiple`은 열린 항목의 `string[]`을 받는다. `value`가 있으면 controlled이며,
`defaultValue`를 쓰면 uncontrolled이다. two props는 동시에 쓸 수 없다.

`onValueChange`는 실제로 상태가 바뀌는 요청에만 호출한다. controlled Accordion은
콜백만 호출하고 내부 상태를 바꾸지 않는다. `single`에서 열린 header를 다시 누르면
`null`을 요청하고, `multiple`에서는 해당 value를 배열에 추가하거나 제거한다. 같은
Accordion의 `AccordionItem value`는 고유해야 한다.

`AccordionItem`은 반드시 Accordion 안에 있고 `value`가 필수다. `disabled`이면 그
Item의 Trigger를 native disabled button으로 만들고 열림 상태는 보존한다.
`AccordionHeader`는 Root의 `headingLevel`(기본 3)에 해당하는 native heading 하나를
렌더링한다. Header에는 AccordionTrigger 하나만 둔다. `AccordionTrigger`와
`AccordionContent`는 반드시 같은 Item 안에서만 쓴다.

```tsx
<Accordion defaultValue="shipping" type="single">
  <AccordionItem value="shipping">
    <AccordionHeader>
      <AccordionTrigger>배송 정보</AccordionTrigger>
    </AccordionHeader>
    <AccordionContent>배송은 영업일 기준 2~3일 걸립니다.</AccordionContent>
  </AccordionItem>
</Accordion>

<Accordion defaultValue={["profile", "notifications"]} type="multiple">
  <AccordionItem value="profile">...</AccordionItem>
  <AccordionItem value="notifications">...</AccordionItem>
</Accordion>
```

## 구조와 상호작용

`Accordion`은 Context로 type, 현재 열린 values, 상태 변경 요청, generated ID prefix,
heading level을 Item에 전달한다. `AccordionItem`은 별도 Context로 자신의 value,
disabled, open 상태와 Trigger·Content ID를 Header·Trigger·Content에 전달한다. 이 두
Context는 하나의 compound widget을 조합하는 데만 쓴다.

`useId` prefix와 `encodeURIComponent(value)`로 Trigger와 Content ID를 생성한다.
소비자는 직접 ID를 관리하지 않아도 `aria-controls`와 `aria-labelledby` 관계를 얻는다.
`AccordionHeader`는 동적으로 선택한 `<h1>`부터 `<h6>` 중 하나이며, 그 안에는
AccordionTrigger button 하나만 둔다.

- Root는 `class="jds-accordion"`, `data-type="single|multiple"`를 렌더링한다.
- Item은 `class="jds-accordion-item"` 및 `data-state="open|closed|disabled"`를
  렌더링한다. disabled가 open보다 우선한다.
- Header는 `class="jds-accordion-header"`의 native heading이다.
- Trigger는 `type="button"`, generated `id`, `aria-controls`, `aria-expanded`,
  `disabled`, `class="jds-accordion-trigger"`,
  `data-state="open|closed|disabled"`를 렌더링한다.
- Content는 generated `id`, `aria-labelledby`, native `hidden`,
  `class="jds-accordion-content"`, `data-state="open|closed"`를 렌더링한다.

Trigger click은 소비자의 `onClick`을 먼저 호출한다. event가 prevent되지 않았고
Item이 enabled이면 Root에 해당 value 변경을 요청한다. disabled button은 native
동작으로 pointer·keyboard 요청을 막는다. Tab, Shift+Tab, Enter, Space는 browser가
처리한다. Header와 Content의 ref 및 허용된 native props는 모두 전달한다. Compound
part를 잘못된 문맥에서 쓰면 명확한 오류를 낸다.

## 토큰과 스타일

새 토큰은 추가하지 않는다. 기존 `color.field.*`, `color.action.ghost.hover`,
`color.focus.ring`, `size.border`, `size.focus`, `space.button.inline`,
`space.field.item`, `opacity.disabled` semantic token을 재사용한다.

Accordion은 Item 사이의 block border로 구분한다. Trigger는 전체 폭의 native button이며
배경·border·font를 초기화하고 token padding을 적용한다. hover는 ghost hover를 사용하고,
open 상태는 border와 `data-state`로도 구별한다. focus-visible은 focus token의 2px
outline을 사용한다. padding을 포함한 Trigger 상호작용 영역은 최소 24 × 24 CSS px이다.
Content는 token 기반 padding을 적용하고 닫힌 경우 native hidden으로 layout과 접근성
트리에서 제외한다. forced-colors에서는 시스템 색을 허용하며 animation과 transition은
추가하지 않는다.

## 문서와 검증

Storybook은 single 기본·모두 닫힘·multiple 기본, controlled single·multiple,
disabled Item, 긴 Trigger, 긴 Content 예시와 키보드 표를 제공한다. 모든 Story는 기존
preview의 axe 오류 설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- public export와 props type, native props·ref 전달, generated ARIA ID 관계
- single·multiple의 uncontrolled 열기·닫기와 `data-state`·hidden
- controlled 상태 보존, 실제 변화가 없는 요청과 preventDefault의 콜백 억제
- disabled Item의 native disabled, 열림 상태 보존과 interaction 차단
- click, Enter·Space, Tab·Shift+Tab 기본 동작
- heading level 렌더링과 compound part를 잘못된 문맥에서 쓴 경우의 명확한 오류

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 Tab·Shift+Tab,
Enter·Space, label과 긴 콘텐츠, 브라우저 확대, forced-colors를 수동 확인하고,
스크린리더로 header heading level, expanded/collapsed 상태, button과 panel 연결,
disabled 상태를 확인한다.

## 성공 기준

소비자는 외부 의존성이나 직접 ARIA ID 연결 없이 하나 또는 여러 섹션을 제어할 수
있다. single과 multiple의 controlled·uncontrolled 상태, focus, disabled, hidden,
native keyboard 동작이 일관되며 Accordion의 상태는 색상만으로 전달되지 않는다.
