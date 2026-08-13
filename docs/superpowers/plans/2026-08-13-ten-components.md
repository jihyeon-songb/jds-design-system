# 10개 컴포넌트 구현 계획

> **에이전트 작업자용:** 이 계획을 작업 단위로 실행할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans` 하위 스킬을 반드시 사용한다. 진행 상황은 체크박스(`- [ ]`)로 관리한다.

**목표:** `@jdsb/components`에 접근 가능하고 토큰 기반인 Table, DropdownMenu, Popover, Combobox, Breadcrumb, Separator, Skeleton, Progress, Card, Calendar 10개 프리미티브를 추가한다.

**아키텍처:** 레이아웃과 시각 프리미티브는 네이티브 HTML에 가까운 무상태 컴포넌트로 유지한다. 마크업과 키보드 동작이 함께 작동해야 할 때만 복합 컴포넌트를 사용한다. `Popover`는 `DropdownMenu`가 따르는 위치 지정·공개 패턴을 제공하며, `Calendar`는 완성형 DatePicker가 아닌 날짜 그리드 프리미티브로 제한한다. 의존성을 추가하지 않고 React, 네이티브 요소, 표준 ARIA, 그리고 닫기 동작에 충분한 플랫폼 Popover API만 사용한다.

**기술 스택:** TypeScript, React 19, `@jdsb/tokens` CSS 사용자 정의 속성, Vitest + Testing Library, Storybook + axe.

## 공통 제약 조건

- 패키지 관리는 pnpm만 사용하며 런타임·개발 의존성을 추가하지 않는다.
- 공개 React API는 명시적인 TypeScript 타입을 내보내고, 네이티브 루트가 있으면 ref를 전달한다.
- 모든 시각 값은 기존 또는 새 semantic token을 사용한다. 컴포넌트 CSS에 색상·크기·간격·반경·시간의 리터럴 값을 쓰지 않는다.
- WCAG 2.2 AA를 충족한다. 키보드 조작, 보이는 포커스, 접근 가능한 이름, forced-colors, 필요한 경우 reduced-motion을 포함한다.
- 소비자가 전달한 속성과 이벤트 핸들러를 보존하고, 소비자 이벤트가 `preventDefault()`되지 않았을 때만 컴포넌트 동작을 실행한다.
- 상호작용 상태를 소유하는 컴포넌트만 controlled/uncontrolled API를 제공한다.
- 컴포넌트 간에는 패키지 배럴 대신 직접 상대 경로 import를 사용한다.
- 마지막 작업 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`를 실행한다. 로컬 Storybook 서버가 준비되면 Storybook 테스트도 실행한다.

---

## 파일 구성

- `packages/tokens/src/jdsb.tokens.json`: surface, muted content, progress track, calendar selection용 semantic token. 의미가 맞는 `field`, `action`, `space.field`, `size.border`, `size.focus`, `radius.control`은 재사용한다.
- `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`: 공개 export, CSS import, 배포 CSS allowlist.
- `packages/components/src/layout/{Card,Separator,Skeleton}.tsx|css`: 표현 전용 프리미티브.
- `packages/components/src/feedback/Progress.tsx|css`: 네이티브 `<progress>` 래퍼.
- `packages/components/src/data/Table.tsx|css`: 정렬·필터·선택·페이지 상태를 갖지 않는 semantic table 하위 컴포넌트.
- `packages/components/src/navigation/Breadcrumb.tsx|css`: 이름 있는 breadcrumb navigation과 현재 페이지 의미.
- `packages/components/src/overlays/Popover.tsx|css`: controlled/uncontrolled trigger와 non-modal popover content.
- `packages/components/src/overlays/DropdownMenu.tsx|css`: menu role, roving focus, item activation.
- `packages/components/src/inputs/Combobox.tsx|css`: 필터 가능한 단일 선택 listbox와 form 값.
- `packages/components/src/inputs/Calendar.tsx|css`: 한 달 단위 ISO 날짜 grid. DatePicker trigger는 제공하지 않는다.
- 대응하는 `*.test.tsx`, `apps/storybook/src/**.stories.tsx`: 공개 API, 상호작용, 키보드, axe 검증 Story.

## 작업 1: 표현 전용 프리미티브 4개 추가

**파일:**

- 생성: `packages/components/src/layout/Card.tsx`, `Card.css`, `Separator.tsx`, `Separator.css`, `Skeleton.tsx`, `Skeleton.css`
- 생성: `packages/components/src/feedback/Progress.tsx`, `Progress.css`
- 생성: `packages/components/src/layout/{Card,Separator,Skeleton}.test.tsx`, `packages/components/src/feedback/Progress.test.tsx`
- 생성: `apps/storybook/src/layout/{Card,Separator,Skeleton}.stories.tsx`, `apps/storybook/src/feedback/Progress.stories.tsx`
- 수정: `packages/tokens/src/jdsb.tokens.json`, `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Separator`, `Skeleton`, `Progress`.
- `ProgressProps`는 `ComponentPropsWithoutRef<"progress">`를 확장하고 `label: string`을 추가한다. 네이티브 `value`, `max` 계약은 그대로 유지한다.

- [ ] **1단계: 실패하는 테스트 작성**

```tsx
render(<Progress label="파일 업로드" max={100} value={40} />)
expect(screen.getByRole("progressbar", { name: "파일 업로드" })).toHaveValue(40)
render(<Separator orientation="vertical" />)
expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical")
```

`Card`의 `HTMLDivElement` ref 전달, `CardTitle`의 `as` prop heading 렌더링, `Skeleton`의 `aria-hidden`, 모든 공개 심볼과 배럴 export의 동일성도 검증한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/layout/Card.test.tsx packages/components/src/layout/Separator.test.tsx packages/components/src/layout/Skeleton.test.tsx packages/components/src/feedback/Progress.test.tsx`

기대 결과: 모듈이 없으므로 실패한다.

- [ ] **3단계: 최소 네이티브 마크업 구현**

```tsx
export const Progress = forwardRef<HTMLProgressElement, ProgressProps>(
  ({ className, label, ...props }, ref) => (
    <progress {...props} ref={ref} aria-label={label} className={["jdsb-progress", className].filter(Boolean).join(" ")} />
  )
)
```

수평 `Separator`는 `<hr>`, 수직 `Separator`는 `<div role="separator" aria-orientation="vertical">`로 렌더링한다. `Skeleton`은 `aria-hidden="true"`의 비의미 `span`, `Card`는 `div` 루트의 조합 컴포넌트로 만든다. 기존 토큰으로 표현할 수 없는 surface/muted/progress/calendar 의미만 token 파일에 추가하고 기존 token build로 출력물을 생성한다. 새 CSS를 `files` allowlist와 `index.css`에 등록한다.

- [ ] **4단계: Story와 집중 검사 추가**

Card 조합, 수평·수직 Separator, text/avatar Skeleton, determinate/indeterminate Progress Story를 만든다. `Progress` 이름·값과 수직 Separator 의미를 `play`에서 검사한다.

실행: 2단계 명령, 이어서 `pnpm typecheck`.

- [ ] **5단계: 커밋**

```bash
git add packages/tokens/src/jdsb.tokens.json packages/components apps/storybook
git commit -m "feat: 레이아웃과 진행 컴포넌트 추가"
```

## 작업 2: Table을 semantic styling primitive로 추가

**파일:**

- 생성: `packages/components/src/data/Table.tsx`, `Table.css`, `Table.test.tsx`
- 생성: `apps/storybook/src/data/Table.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Table`, `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`.
- 각 컴포넌트는 해당 네이티브 요소(`table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`)의 ref를 전달한다. `TableHead`는 네이티브 `scope`를 보존한다.

- [ ] **1단계: 실패하는 테스트 작성**

```tsx
render(<Table><TableCaption>주문 목록</TableCaption><TableHeader><TableRow><TableHead scope="col">주문</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>JDSB-1</TableCell></TableRow></TableBody></Table>)
expect(screen.getByRole("table", { name: "주문 목록" })).toBeInTheDocument()
expect(screen.getByRole("columnheader", { name: "주문" })).toHaveAttribute("scope", "col")
```

ref 전달, 소비자 class 병합, 그리고 sort button·checkbox·row click 동작이 추가되지 않음을 테스트한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/data/Table.test.tsx`

기대 결과: `Table` export가 없어 실패한다.

- [ ] **3단계: 네이티브 table wrapper와 CSS 구현**

`forwardRef` wrapper와 `jdsb-table-head` 같은 class를 사용한다. 가로 스크롤은 표 의미를 바꾸지 않는 중립 wrapper에서만 제공하고, 그렇지 않으면 넓은 표를 소비자가 감싸도록 문서화한다. `:focus-visible`, `forced-colors`, field semantic token을 사용한다.

- [ ] **4단계: Story와 검증 추가**

기본, caption, 숫자 정렬, 좁은 컨테이너 Story를 추가한다. 좁은 Story는 잘리지 않고 접근 가능함을 확인한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: Table 컴포넌트 추가"
```

## 작업 3: Breadcrumb 추가

**파일:**

- 생성: `packages/components/src/navigation/Breadcrumb.tsx`, `Breadcrumb.css`, `Breadcrumb.test.tsx`
- 생성: `apps/storybook/src/navigation/Breadcrumb.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`.
- `BreadcrumbProps`는 `aria-label: string`을 필수로 한다. `BreadcrumbPage`는 항상 `aria-current="page"`를 적용하고 separator 텍스트는 `aria-hidden`이다.

- [ ] **1단계: 실패하는 테스트 작성**

```tsx
render(<Breadcrumb aria-label="경로"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">홈</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator><BreadcrumbItem><BreadcrumbPage>카드</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>)
expect(screen.getByRole("navigation", { name: "경로" })).toBeInTheDocument()
expect(screen.getByText("카드")).toHaveAttribute("aria-current", "page")
expect(screen.getByText("/")).toHaveAttribute("aria-hidden", "true")
```

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/navigation/Breadcrumb.test.tsx`

기대 결과: 모듈이 없어 실패한다.

- [ ] **3단계: semantic navigation 구현**

`<nav><ol><li>`와 네이티브 `<a>`를 사용한다. `BreadcrumbPage`는 disabled link가 아닌 `span`이다. CSS는 연결된 상위 항목만 말줄임 처리할 수 있으며 현재 페이지는 읽을 수 있어야 하고 키보드 포커스가 보여야 한다.

- [ ] **4단계: Story와 검증 추가**

기본, 긴 경로, 다국어 label Story를 추가한다. native link의 키보드 활성화를 테스트한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: Breadcrumb 컴포넌트 추가"
```

## 작업 4: Popover 추가

**파일:**

- 생성: `packages/components/src/overlays/Popover.tsx`, `Popover.css`, `Popover.test.tsx`
- 생성: `apps/storybook/src/overlays/Popover.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Popover`, `PopoverTrigger`, `PopoverContent`.
- `PopoverProps`는 `{ defaultOpen?: boolean; open?: never }` 또는 `{ defaultOpen?: never; open: boolean }`, 그리고 `onOpenChange?: (open: boolean) => void`를 받는다. content는 `side?: "top" | "right" | "bottom" | "left"`를 받는다.

- [ ] **1단계: 실패하는 테스트 작성**

```tsx
const onOpenChange = vi.fn()
render(<Popover onOpenChange={onOpenChange}><PopoverTrigger>설정</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>)
await userEvent.click(screen.getByRole("button", { name: "설정" }))
expect(screen.getByText("내용")).toHaveAttribute("data-state", "open")
await userEvent.keyboard("{Escape}")
expect(onOpenChange).toHaveBeenLastCalledWith(false)
```

controlled state, 바깥 클릭 닫기, trigger의 `aria-expanded`/`aria-controls`, Escape 뒤 focus 복원, 소비자가 취소한 trigger 이벤트도 검증한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/overlays/Popover.test.tsx`

기대 결과: 모듈이 없어 실패한다.

- [ ] **3단계: non-modal disclosure 구현**

생성된 content id, trigger ref, controlled/uncontrolled state를 context로 공유한다. 지원되는 환경에서는 content에 네이티브 `popover` attribute를 적용하고 `toggle` 이벤트로 state를 동기화한다. jsdom용 명시적 Escape/바깥 클릭 fallback도 제공한다. focus trap은 만들지 않는다. `data-state`, `data-side`, 논리 CSS inset, semantic token을 사용한다.

- [ ] **4단계: Story와 검증 추가**

기본, controlled, 네 방향, 상호작용 form content Story를 만든다. 기본 Story의 play는 열기·Escape 닫기·trigger focus 복원을 검사한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: Popover 컴포넌트 추가"
```

## 작업 5: Popover 패턴을 따른 DropdownMenu 추가

**파일:**

- 생성: `packages/components/src/overlays/DropdownMenu.tsx`, `DropdownMenu.css`, `DropdownMenu.test.tsx`
- 생성: `apps/storybook/src/overlays/DropdownMenu.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`.
- root state API는 `Popover`와 같고, item props는 `disabled?: boolean`, `onSelect?: (event: Event) => void`를 추가한다.

- [ ] **1단계: 실패하는 키보드 테스트 작성**

```tsx
render(<DropdownMenu><DropdownMenuTrigger>작업</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem><DropdownMenuItem disabled>삭제</DropdownMenuItem><DropdownMenuItem>복제</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
await userEvent.click(screen.getByRole("button", { name: "작업" }))
await userEvent.keyboard("{ArrowDown}")
expect(screen.getByRole("menuitem", { name: "편집" })).toHaveFocus()
await userEvent.keyboard("{End}{Enter}")
expect(screen.queryByRole("menu")).not.toBeInTheDocument()
```

ArrowUp/Down, Home/End, disabled item 건너뛰기, Escape focus 복원, `onSelect(event.preventDefault())`일 때 menu 유지도 검증한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/overlays/DropdownMenu.test.tsx`

기대 결과: 모듈이 없어 실패한다.

- [ ] **3단계: 범위를 제한한 menu 패턴 구현**

`<button aria-haspopup="menu">`, `<div role="menu">`, `<button role="menuitem">`를 사용한다. DOM 순서의 enabled item ref를 등록하고 지정한 키로 focus를 이동한다. `Enter`, `Space`는 네이티브 button activation을 사용한다. submenu, checkbox/radio item, 전역 command 처리는 이번 범위에서 제외한다.

- [ ] **4단계: Story와 검증 추가**

action menu, destructive action, disabled item, controlled root Story를 추가한다. play에서 arrow navigation과 selection을 검사한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: DropdownMenu 컴포넌트 추가"
```

## 작업 6: Combobox 추가

**파일:**

- 생성: `packages/components/src/inputs/Combobox.tsx`, `Combobox.css`, `Combobox.test.tsx`
- 생성: `apps/storybook/src/inputs/Combobox.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Combobox`, `ComboboxInput`, `ComboboxList`, `ComboboxOption`, `ComboboxEmpty`.
- root는 `value`/`defaultValue`/`onValueChange`, `open`/`defaultOpen`/`onOpenChange`, `name?: string`, `disabled?: boolean`, `required?: boolean`을 받는다. option은 `value: string`이 필수이고 `disabled?: boolean`을 받는다.

- [ ] **1단계: 실패하는 동작 테스트 작성**

```tsx
render(<Combobox defaultValue="seoul"><ComboboxInput aria-label="도시" /><ComboboxList><ComboboxOption value="seoul">서울</ComboboxOption><ComboboxOption value="busan">부산</ComboboxOption></ComboboxList></Combobox>)
await userEvent.click(screen.getByRole("combobox", { name: "도시" }))
await userEvent.keyboard("{ArrowDown}{Enter}")
expect(screen.getByRole("combobox", { name: "도시" })).toHaveValue("부산")
```

대소문자 무시 필터, 한글 텍스트 필터, 결과 없음, `aria-activedescendant`, Escape 복원, disabled option, controlled value, hidden native input의 `name=value` form 제출을 검증한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/inputs/Combobox.test.tsx`

기대 결과: 모듈이 없어 실패한다.

- [ ] **3단계: 단일 선택 ARIA combobox 구현**

편집 가능한 `<input role="combobox">`, `<div role="listbox">`를 사용하고 의존성 없이 등록된 option text를 `toLocaleLowerCase()`로 필터한다. DOM focus는 input에 유지하며 active option을 `aria-activedescendant`로 노출한다. form 제출은 hidden native input으로 지원한다. remote loading, tags/multiple selection, 임의 값, virtual scrolling은 구현하지 않는다.

- [ ] **4단계: Story와 검증 추가**

기본, controlled, no matches, disabled option Story를 추가한다. 한글 초성 검색은 최종 matcher가 명시적으로 지원할 때만 Story를 추가한다. 기본 play에서 ArrowDown/Enter/Escape를 검사한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: Combobox 컴포넌트 추가"
```

## 작업 7: Calendar를 date-grid primitive로 추가

**파일:**

- 생성: `packages/components/src/inputs/Calendar.tsx`, `Calendar.css`, `Calendar.test.tsx`
- 생성: `apps/storybook/src/inputs/Calendar.stories.tsx`
- 수정: `packages/components/src/index.ts`, `packages/components/src/index.css`, `packages/components/package.json`

**인터페이스:**

- 제공: `Calendar`.
- `CalendarProps`는 `ComponentPropsWithoutRef<"div">`를 확장하고 `value?: string`, `defaultValue?: string`, `onValueChange?: (value: string) => void`, `month?: string`, `defaultMonth?: string`, `onMonthChange?: (month: string) => void`, `min?: string`, `max?: string`, `locale?: string`, `aria-label: string`을 받는다.
- 날짜는 `YYYY-MM-DD`, 월은 `YYYY-MM` 문자열만 사용한다. 유효하지 않은 값은 렌더링 전에 `RangeError`를 발생시킨다.

- [ ] **1단계: 실패하는 Calendar 테스트 작성**

```tsx
render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" defaultValue="2026-08-13" />)
expect(screen.getByRole("gridcell", { name: /2026년 8월 13일/ })).toHaveAttribute("aria-selected", "true")
await userEvent.keyboard("{ArrowRight}{Enter}")
expect(screen.getByRole("gridcell", { name: /2026년 8월 14일/ })).toHaveAttribute("aria-selected", "true")
```

이전/다음 월 버튼, Arrow 키, Home/End, PageUp/PageDown, min/max disabled date, controlled value, 월 이동 뒤 active gridcell focus를 검증한다.

- [ ] **2단계: 실패 확인**

실행: `pnpm test -- packages/components/src/inputs/Calendar.test.tsx`

기대 결과: 모듈이 없어 실패한다.

- [ ] **3단계: ISO 문자열 기반 Calendar 연산 구현**

ISO 문자열은 직접 파싱·검증하고 local numeric constructor로 날짜를 만들며 local getter로 직렬화한다. time zone에 따라 날짜가 바뀔 수 있는 `new Date("YYYY-MM-DD")`, `toISOString()`은 사용하지 않는다. weekday column header와 date button의 `role="gridcell"`을 가진 `role="grid"`를 렌더링하고, roving tabindex로 하나의 day만 tabbable하게 한다. 이전/다음 월 control에는 지역화된 접근 가능한 label이 필요하다. 단일 날짜만 선택하며 range, time, preset, DatePicker popover는 범위 밖이다.

- [ ] **4단계: Story와 검증 추가**

선택 날짜, min/max 범위, controlled month, 한국어 locale, 긴 지역화 월 label Story를 추가한다. play에서 키보드 선택과 disabled date를 검사한다. 집중 테스트와 `pnpm typecheck`를 실행한다.

- [ ] **5단계: 커밋**

```bash
git add packages/components apps/storybook
git commit -m "feat: Calendar 컴포넌트 추가"
```

## 작업 8: 패키지 단위 회귀·접근성 검증

**파일:**

- 수정: 실패가 드러낸 export, stylesheet, token, Story, 접근성 누락이 있는 파일만 수정한다.

- [ ] **1단계: CSS 패키지 표면 검증**

실행: `pnpm --filter @jdsb/components build && tar -tf packages/components/*.tgz 2>/dev/null || true`

기대 결과: component build가 성공한다. 저장소가 tarball을 만들지 않으면 `packages/components/package.json`의 `files` 목록에서 모든 새 stylesheet 포함을 확인한다.

- [ ] **2단계: 전체 저장소 검사 실행**

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

기대 결과: 모든 명령이 exit 0으로 끝난다.

- [ ] **3단계: Storybook 접근성 검사 실행**

`pnpm --filter @jdsb/storybook storybook`으로 Storybook을 시작한 뒤 `pnpm --filter @jdsb/storybook test`를 실행한다. 신규 모든 Story의 axe 위반을 해결한다.

- [ ] **4단계: 필수 수동 검사**

키보드로 Popover의 Escape/바깥 클릭 닫기와 focus 복원, DropdownMenu의 arrow navigation/disabled item 건너뛰기, Combobox의 필터·선택·Escape, Calendar의 arrow·월 이동·min/max를 확인한다. 이후 브라우저 확대, `prefers-reduced-motion`, forced-colors에서 보이는 focus와 레이아웃을 다시 확인한다.

- [ ] **5단계: 검증 수정 커밋**

```bash
git add packages/tokens packages/components apps/storybook
git commit -m "test: 신규 컴포넌트 접근성 검증 보완"
```

## 자체 검토

- 범위: 합의한 10개 컴포넌트를 모두 다룬다. Table은 재사용 가능한 DataTable을 제외하고, Calendar는 DatePicker 조합을 제외한다.
- 의존성: DropdownMenu는 Popover 뒤에 구현한다. 나머지는 독립적으로 구현·리뷰할 수 있다.
- 누락 점검: 미정 API나 외부 라이브러리가 없다. token 추가는 누락된 semantic meaning으로 제한하며 기존 token build가 생성한다.
- 타입 일관성: 모든 공개 컴포넌트는 해당 작업에서 정의하고, 이후 package barrel과 대응 Storybook Story에 등록한다.
