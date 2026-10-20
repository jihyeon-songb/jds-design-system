# Breadcrumb 구현 계획

> **에이전트 작업자용:** 이 계획을 작업 단위로 실행할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans` 하위 스킬을 사용한다. 진행 상황은 체크박스(`- [ ]`)로 관리한다.

**목표:** `@jdsb/components`에 native navigation·목록 의미와 현재 페이지를 보존하는 token 기반 Breadcrumb 프리미티브를 추가한다.

**아키텍처:** 여섯 public primitive는 대응 native 요소를 렌더링하는 무상태 `forwardRef` 래퍼다. 조합형 API만 제공하며 라우팅·자동 축약·상태를 소유하지 않는다. 패키지 배럴·CSS entry·배포 CSS allowlist에 등록하고 Storybook에서 native 의미를 확인한다.

**기술 스택:** TypeScript, React 19, `@jdsb/tokens` CSS custom properties, Vitest + Testing Library, Storybook + axe.

## 공통 제약 조건

- 새 런타임·개발 의존성이나 Breadcrumb 전용 token을 추가하지 않는다.
- `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`와 각 props type을 export한다.
- 모든 primitive는 정확한 native element ref, native 속성·이벤트·`className`을 전달한다.
- `Breadcrumb`의 `aria-label`은 필수다. Page는 항상 `aria-current="page"`, Separator는 항상 `aria-hidden="true"`다.
- items API, 라우터 연동, 자동 축약, overflow 메뉴, 아이콘 API, variant·size API, `tabIndex`, key handler, click 상태를 추가하지 않는다.
- CSS는 `color.action.ghost.foreground`, `color.field.foreground`, `color.focus.ring`, `size.focus`, `space.field.content` semantic token만 사용하며 시각 값 리터럴·animation·transition을 쓰지 않는다.
- 모든 Storybook Story는 axe 검사 대상에 남긴다.

---

## 파일 구성

- `packages/components/src/navigation/Breadcrumb.tsx`: public types와 여섯 native wrapper.
- `packages/components/src/navigation/Breadcrumb.css`: list reset, token 기반 링크·현재 페이지·구분자·focus 스타일.
- `packages/components/src/navigation/Breadcrumb.test.tsx`: entry export, native semantics, ARIA, props/events/refs/classes, native link keyboard test.
- `packages/components/src/index.ts`, `index.css`, `package.json`: public JS/CSS 표면과 배포 allowlist.
- `apps/storybook/src/navigation/Breadcrumb.stories.tsx`: 기본·긴 경로·다국어 label 문서와 play 검사.

### Task 1: Native Breadcrumb API와 패키지 표면

**파일:**

- 생성: `packages/components/src/navigation/Breadcrumb.tsx`
- 생성: `packages/components/src/navigation/Breadcrumb.css`
- 생성: `packages/components/src/navigation/Breadcrumb.test.tsx`
- 수정: `packages/components/src/index.ts`
- 수정: `packages/components/src/index.css`
- 수정: `packages/components/package.json`

**인터페이스:**

```ts
export type BreadcrumbProps = ComponentPropsWithoutRef<"nav"> & { "aria-label": string }
export type BreadcrumbListProps = ComponentPropsWithoutRef<"ol">
export type BreadcrumbItemProps = ComponentPropsWithoutRef<"li">
export type BreadcrumbLinkProps = ComponentPropsWithoutRef<"a">
export type BreadcrumbPageProps = Omit<ComponentPropsWithoutRef<"span">, "aria-current">
export type BreadcrumbSeparatorProps = Omit<ComponentPropsWithoutRef<"span">, "aria-hidden">
```

- [ ] **1단계: 실패하는 public API와 native 의미 테스트를 작성한다**

`packages/components/src/navigation/Breadcrumb.test.tsx`를 생성한다.

```tsx
import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import { Breadcrumb as PublicBreadcrumb, BreadcrumbItem as PublicBreadcrumbItem, BreadcrumbLink as PublicBreadcrumbLink, BreadcrumbList as PublicBreadcrumbList, BreadcrumbPage as PublicBreadcrumbPage, BreadcrumbSeparator as PublicBreadcrumbSeparator, type BreadcrumbProps as PublicBreadcrumbProps } from "../index.js"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, type BreadcrumbProps } from "./Breadcrumb.js"

afterEach(cleanup)

describe("Breadcrumb", () => {
  it("exports every primitive and public props type", () => {
    expect(PublicBreadcrumb).toBe(Breadcrumb)
    expect(PublicBreadcrumbList).toBe(BreadcrumbList)
    expect(PublicBreadcrumbItem).toBe(BreadcrumbItem)
    expect(PublicBreadcrumbLink).toBe(BreadcrumbLink)
    expect(PublicBreadcrumbPage).toBe(BreadcrumbPage)
    expect(PublicBreadcrumbSeparator).toBe(BreadcrumbSeparator)
    expectTypeOf<PublicBreadcrumbProps>().toEqualTypeOf<BreadcrumbProps>()
  })

  it("renders named native navigation with a current page and hidden separator", () => {
    render(<Breadcrumb aria-label="현재 위치"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">홈</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbPage>상세</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>)
    expect(screen.getByRole("navigation", { name: "현재 위치" })).toContainElement(screen.getByRole("list"))
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/")
    expect(screen.getByText("상세")).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("/")).toHaveAttribute("aria-hidden", "true")
  })

  it("forwards native props, events, classes, and refs while retaining forced ARIA", () => {
    const navRef = createRef<HTMLElement>()
    const linkRef = createRef<HTMLAnchorElement>()
    const pageRef = createRef<HTMLSpanElement>()
    const separatorRef = createRef<HTMLSpanElement>()
    const onClick = vi.fn()
    render(<Breadcrumb aria-label="경로" className="consumer-nav" id="path" ref={navRef}><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/products" className="consumer-link" onClick={onClick} ref={linkRef}>상품</BreadcrumbLink><BreadcrumbSeparator className="consumer-separator" ref={separatorRef}>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbPage className="consumer-page" ref={pageRef}>상세</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>)
    expect(navRef.current).toBe(screen.getByRole("navigation", { name: "경로" }))
    expect(navRef.current).toHaveAttribute("id", "path")
    expect(navRef.current).toHaveClass("jdsb-breadcrumb", "consumer-nav")
    expect(linkRef.current).toHaveClass("jdsb-breadcrumb-link", "consumer-link")
    expect(pageRef.current).toHaveClass("jdsb-breadcrumb-page", "consumer-page")
    expect(pageRef.current).toHaveAttribute("aria-current", "page")
    expect(separatorRef.current).toHaveClass("jdsb-breadcrumb-separator", "consumer-separator")
    expect(separatorRef.current).toHaveAttribute("aria-hidden", "true")
    fireEvent.click(linkRef.current!)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("keeps native Enter activation for a link", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Breadcrumb aria-label="경로"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/" onClick={onClick}>홈</BreadcrumbLink></BreadcrumbItem></BreadcrumbList></Breadcrumb>)
    screen.getByRole("link", { name: "홈" }).focus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

- [ ] **2단계: 테스트를 실행해 RED를 확인한다**

실행: `pnpm test -- packages/components/src/navigation/Breadcrumb.test.tsx`

기대 결과: `./Breadcrumb.js`와 public package export가 없으므로 실패한다.

- [ ] **3단계: Native wrapper, stylesheet, package 등록을 구현한다**

`packages/components/src/navigation/Breadcrumb.tsx`를 생성한다.

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from "react"

const classes = (base: string, className?: string) => [base, className].filter(Boolean).join(" ")

export type BreadcrumbProps = ComponentPropsWithoutRef<"nav"> & { "aria-label": string }
export type BreadcrumbListProps = ComponentPropsWithoutRef<"ol">
export type BreadcrumbItemProps = ComponentPropsWithoutRef<"li">
export type BreadcrumbLinkProps = ComponentPropsWithoutRef<"a">
export type BreadcrumbPageProps = Omit<ComponentPropsWithoutRef<"span">, "aria-current">
export type BreadcrumbSeparatorProps = Omit<ComponentPropsWithoutRef<"span">, "aria-hidden">

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb({ className, ...props }, ref) { return <nav {...props} ref={ref} className={classes("jdsb-breadcrumb", className)} /> })
export const BreadcrumbList = forwardRef<HTMLOListElement, BreadcrumbListProps>(function BreadcrumbList({ className, ...props }, ref) { return <ol {...props} ref={ref} className={classes("jdsb-breadcrumb-list", className)} /> })
export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(function BreadcrumbItem({ className, ...props }, ref) { return <li {...props} ref={ref} className={classes("jdsb-breadcrumb-item", className)} /> })
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(function BreadcrumbLink({ className, ...props }, ref) { return <a {...props} ref={ref} className={classes("jdsb-breadcrumb-link", className)} /> })
export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(function BreadcrumbPage({ className, ...props }, ref) { return <span {...props} ref={ref} aria-current="page" className={classes("jdsb-breadcrumb-page", className)} /> })
export const BreadcrumbSeparator = forwardRef<HTMLSpanElement, BreadcrumbSeparatorProps>(function BreadcrumbSeparator({ className, ...props }, ref) { return <span {...props} ref={ref} aria-hidden="true" className={classes("jdsb-breadcrumb-separator", className)} /> })
```

`packages/components/src/navigation/Breadcrumb.css`를 생성한다.

```css
.jdsb-breadcrumb-list { align-items: center; display: flex; flex-wrap: wrap; gap: var(--jdsb-space-field-content); list-style: none; margin: 0; padding: 0; }
.jdsb-breadcrumb-item { align-items: center; display: flex; gap: var(--jdsb-space-field-content); }
.jdsb-breadcrumb-link { color: var(--jdsb-color-action-ghost-foreground); }
.jdsb-breadcrumb-link:focus-visible { outline: var(--jdsb-size-focus) solid var(--jdsb-color-focus-ring); outline-offset: var(--jdsb-size-focus); }
.jdsb-breadcrumb-page, .jdsb-breadcrumb-separator { color: var(--jdsb-color-field-foreground); }
@media (forced-colors: active) { .jdsb-breadcrumb-link { forced-color-adjust: auto; } }
```

`packages/components/src/index.ts`에 `./navigation/Breadcrumb.js`의 여섯 컴포넌트와 여섯 props type을 export한다. `packages/components/src/index.css`에 `@import "./navigation/Breadcrumb.css";`를, `packages/components/package.json`의 `files` 목록에 `"src/navigation/Breadcrumb.css"`를 추가한다.

- [ ] **4단계: 집중 테스트와 typecheck를 실행해 GREEN을 확인한다**

실행: `pnpm test -- packages/components/src/navigation/Breadcrumb.test.tsx && pnpm typecheck`

기대 결과: PASS. Entry/direct export, native navigation/list/link 의미, 강제 ARIA, ref, 소비자 event/class, Enter 활성화가 모두 동작한다.

- [ ] **5단계: 컴포넌트 표면을 커밋한다**

```bash
git add packages/components/src/navigation/Breadcrumb.tsx packages/components/src/navigation/Breadcrumb.css packages/components/src/navigation/Breadcrumb.test.tsx packages/components/src/index.ts packages/components/src/index.css packages/components/package.json
git commit -m "feat: Breadcrumb 컴포넌트 추가"
```

### Task 2: Storybook 문서와 전체 검증

**파일:**

- 생성: `apps/storybook/src/navigation/Breadcrumb.stories.tsx`

**인터페이스:**

- 사용: `@jdsb/components`의 여섯 Breadcrumb primitive.
- 결과: 기본·긴 경로·현지화된 경로를 문서화하는 `Navigation/Breadcrumb` Story.

- [ ] **1단계: Story와 상호작용 검사를 추가한다**

`apps/storybook/src/navigation/Breadcrumb.stories.tsx`를 생성한다.

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@jdsb/components"

const meta = { title: "Navigation/Breadcrumb", component: Breadcrumb } satisfies Meta<typeof Breadcrumb>
export default meta
type Story = StoryObj<typeof meta>

function Path({ label = "현재 위치" }: { label?: string }) {
  return <Breadcrumb aria-label={label}><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#home">홈</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbLink href="#products">상품</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbPage>상세</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
}

export const Default: Story = {
  render: () => <Path />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole("link", { name: "홈" })
    expect(canvas.getByRole("navigation", { name: "현재 위치" })).toBeInTheDocument()
    expect(canvas.getByText("상세")).toHaveAttribute("aria-current", "page")
    expect(canvas.getAllByText("/")[0]).toHaveAttribute("aria-hidden", "true")
    await userEvent.tab()
    expect(link).toHaveFocus()
  },
}

export const LongPath: Story = { render: () => <Breadcrumb aria-label="현재 위치"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#home">홈</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbLink href="#catalog">매우 긴 카탈로그 이름</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem><BreadcrumbItem><BreadcrumbPage>매우 긴 현재 페이지 이름</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb> }
export const LocalizedLabel: Story = { render: () => <Path label="You are here" /> }
```

- [ ] **2단계: 집중 검사와 저장소 전체 검증을 실행한다**

실행:

```bash
pnpm test -- packages/components/src/navigation/Breadcrumb.test.tsx
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm --filter @jds/storybook exec test-storybook
```

기대 결과: 모든 명령이 0으로 종료한다. Default Story는 이름 있는 navigation, 숨겨진 separator, 현재 페이지, 첫 native link focus를 찾고 axe는 위반을 보고하지 않는다.

- [ ] **3단계: 키보드와 스크린리더 흐름을 수동 확인한다**

실행: `pnpm --filter @jds/storybook storybook`

`Navigation/Breadcrumb` Default를 연다. Canvas 시작점에서 `Tab`을 눌러 `홈`에 보이는 focus outline이 있는지 확인한다. `Enter`를 눌러 `#home`으로 이동하는지 확인한다. 스크린리더가 separator를 건너뛰고 `상세`를 현재 페이지로 알리는지 확인한다.

- [ ] **4단계: Storybook 검증을 커밋한다**

```bash
git add apps/storybook/src/navigation/Breadcrumb.stories.tsx
git commit -m "test: Breadcrumb Storybook 검증 추가"
```

## 계획 자체 검토

- 설계 범위: 작업 1은 모든 primitive, native 의미, ARIA, 스타일, export, 테스트를 다루고 작업 2는 필수 Story와 자동·수동 접근성 검사를 다룬다.
- 빈 항목 검사: TBD/TODO 또는 미정 동작이 남아 있지 않다.
- 타입 일관성: primitive와 props type 이름은 승인된 설계, 테스트, 구현, package entry, Storybook에서 일치한다.
