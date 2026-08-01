# JDS Tabs 설계

## 목적

`@jds/components`에 빠르게 전환되는 정적 패널을 위한 접근 가능한 Tabs를 추가한다.
`Tabs`는 선택값을 관리하고, `TabsList`, `TabsTrigger`, `TabsContent`는 WAI-ARIA
Tabs 패턴의 구조와 관계를 렌더링한다. 선택과 패널 전환은 동기적으로 끝나야 하므로
화살표 키 이동 시 즉시 활성화한다.

## 범위

포함:

- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` 조합 API
- 문자열 하나를 위한 controlled·uncontrolled 선택값
- 수평 tablist, 클릭, 좌우 화살표, Home, End 키 이동과 자동 활성화
- 비활성 Trigger 건너뛰기, ARIA 관계, 보이는 focus-visible 표시
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 수직 배치, 수동 활성화, URL 동기화, 지연 로딩·비동기 패널
- 패널 유지 렌더링, animation, swipe, overflow scroll button
- 중첩 Tabs 특수 처리, 외부 UI 라이브러리, 새 의존성

비동기 패널이나 화살표 이동보다 선택 확정이 늦는 화면은 별도 `activationMode="manual"`
설계로 추가한다. 이 작업은 즉시 보여 줄 수 있는 패널만 지원한다.

## 공개 API

```tsx
type TabsValueProps =
  | { value: string; defaultValue?: never }
  | { defaultValue: string; value?: never }

export type TabsProps = ComponentPropsWithoutRef<"div"> &
  TabsValueProps & {
    children: ReactNode
    onValueChange?: (value: string) => void
  }

export type TabsListProps = ComponentPropsWithoutRef<"div">

export type TabsTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-selected" | "id" | "role" | "tabIndex" | "type"
> & {
  value: string
}

export type TabsContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-labelledby" | "hidden" | "id" | "role"
> & {
  value: string
}
```

`Tabs`는 하나의 선택값을 반드시 받는다. `value`가 있으면 controlled이고,
`defaultValue`가 있으면 uncontrolled이다. 선택 요청은 controlled 값을 직접 바꾸지 않고
`onValueChange`로 알린다. `value`와 `defaultValue`는 동일한 enabled `TabsTrigger` 및
`TabsContent`의 고유한 `value`와 일치해야 한다.

`TabsTrigger`는 항상 `type="button"`인 native button이며 `value`가 필수다. 소비자는
`id`, `role`, selected·focus state와 ARIA 연결을 바꾸지 않는다. `disabled`, `onClick`,
`onKeyDown`, `aria-label`을 포함한 나머지 적용 가능한 button props는 전달한다.
`TabsContent`의 `value`도 필수이며, 선택되지 않은 패널은 native `hidden`으로 접근성
트리와 레이아웃에서 제외한다.

```tsx
<Tabs defaultValue="overview">
  <TabsList aria-label="계정 정보">
    <TabsTrigger value="overview">개요</TabsTrigger>
    <TabsTrigger value="security">보안</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">계정 개요</TabsContent>
  <TabsContent value="security">보안 설정</TabsContent>
</Tabs>
```

## 구조와 상호작용

`Tabs`는 Context로 현재 선택값, 선택 요청, generated id prefix와 TabList ref를 하위
컴포넌트에 제공한다. 이 Context는 하나의 compound widget 상태 공유에만 사용한다.
`useId` prefix와 `encodeURIComponent(value)`로 Trigger와 Content id를 생성하므로,
소비자는 별도 id를 전달하지 않아도 `aria-controls`와 `aria-labelledby` 관계를 얻는다.
같은 Tabs 안의 value는 고유해야 한다.

- `Tabs` root는 `class="jds-tabs"`와 `data-state="enabled"`를 렌더링한다.
- `TabsList`는 `role="tablist"`, `aria-orientation="horizontal"`,
  `class="jds-tabs-list"`를 렌더링한다.
- `TabsTrigger`는 `role="tab"`, `aria-selected`, `aria-controls`, generated `id`,
  `tabIndex={0|-1}`, `data-state="active|inactive|disabled"`를 렌더링한다.
- `TabsContent`는 `role="tabpanel"`, generated `id`, `aria-labelledby`,
  `tabIndex={0}`, `hidden`, `data-state="active|inactive"`를 렌더링한다.

선택된 Trigger만 `tabIndex=0`이고 나머지는 `-1`이다. Trigger click은 소비자 `onClick`
후 event가 prevent되지 않았을 때 해당 value 선택을 요청한다. `onValueChange`는 실제로
다른 value를 요청할 때 한 번만 호출한다.

Trigger의 소비자 `onKeyDown` 후 event가 prevent되지 않았다면 ArrowRight는 다음 enabled
Trigger, ArrowLeft는 이전 enabled Trigger, Home은 첫 enabled Trigger, End는 마지막
enabled Trigger로 순환 이동한다. 이동한 Trigger에 focus를 주고 값을 즉시 선택한다.
Tab과 Shift+Tab은 브라우저 기본 동작을 유지한다. disabled Trigger는 클릭·키보드 대상과
roving tabindex 대상에서 제외한다. enabled Trigger가 하나도 없거나 선택값이 일치하지
않으면 소비자 구성 오류이며, 컴포넌트는 임의로 다른 탭을 고르지 않는다.

## 스타일과 토큰

별도 token은 추가하지 않는다. `Tabs`는 기존 `color.action.primary.*`,
`color.action.ghost.*`, `color.focus.ring`, `size.border`, `size.focus`,
`space.button.inline`, `space.button.gap`, `opacity.disabled` semantic token만
재사용한다.

`TabsList`는 수평 flex와 하단 border를 제공한다. Trigger는 border·background를
초기화한 button이고, active 상태는 primary foreground와 하단 primary border로
선택 상태를 색상 외 경계로도 전달한다. inactive hover는 ghost hover를 사용하며,
disabled는 opacity를 낮춘다. 모든 Trigger는 padding을 포함해 최소 24 × 24 CSS px
상호작용 영역을 만족한다. focus-visible은 기존 focus token의 2px outline을 사용한다.
Content는 token 기반 block padding만 적용한다. forced-colors에서는 시스템 색을
허용하고 animation·transition은 추가하지 않는다.

## 문서와 검증

Storybook은 기본, controlled, disabled Trigger, 긴 label, 긴 panel content 예시와
키보드 표를 제공한다. 모든 Story는 기존 preview의 axe 오류 설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- public export와 props type, root·list·trigger·panel native props/ref 전달
- controlled와 uncontrolled 선택값, 중복 선택 요청 억제, preventDefault 처리
- Trigger와 Content의 generated ARIA id 관계, active·inactive·disabled data-state와 hidden
- click, ArrowLeft/ArrowRight 순환, Home/End, disabled Trigger 건너뛰기와 focus 이동
- Tab/Shift+Tab의 기본 이벤트 보존, compound part를 root 밖에서 사용했을 때의 명확한 오류

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. Storybook에서 keyboard, 브라우저 확대,
forced-colors를 수동 확인하고 스크린리더로 tablist 이름, 선택 상태, 패널 연결과 disabled
상태를 확인한다.

## 성공 기준

소비자는 외부 의존성이나 직접 ARIA id 연결 없이 동기 패널을 조합하고, 포인터와
키보드에서 같은 선택 결과를 얻는다. 선택된 탭 하나와 연결된 패널 하나만 접근성
트리에 노출되며, focus 이동·disabled 상태·controlled와 uncontrolled 상태가
일관되게 동작한다.
