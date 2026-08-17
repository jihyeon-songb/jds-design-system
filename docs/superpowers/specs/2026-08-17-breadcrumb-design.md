# JDSB Breadcrumb 설계

## 목적

`@jdsb/components`에 현재 위치와 상위 경로를 native navigation 의미로 표현하는
token 기반 Breadcrumb 프리미티브를 추가한다. 구조와 기본 스타일만 제공하며, 경로
데이터·라우팅·자동 축약은 소비자가 소유한다.

## 범위

포함:

- `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`,
  `BreadcrumbPage`, `BreadcrumbSeparator`
- 각 요소의 native 속성, 이벤트, `className`, ref 전달
- 이름 있는 `<nav>`와 `<ol>/<li>` 구조, 현재 페이지의 `aria-current="page"`,
  스크린리더에서 숨겨지는 구분자
- semantic token만 사용하는 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- `items` 배열 API, 라우터 연동, 경로 자동 생성
- 자동 말줄임·중간 항목 생략·overflow 메뉴
- 아이콘 API와 고정 구분자, variant·size API
- 외부 UI 라이브러리와 새 의존성

경로마다 링크, 아이콘, 동적 이름을 달리 구성할 수 있도록 배열 API 대신 조합형 API만
제공한다. 축약이 필요하면 소비자가 해당 서비스의 정보 구조에 맞게 항목을 구성한다.

## 공개 API

```ts
export type BreadcrumbProps = React.ComponentPropsWithoutRef<"nav"> & {
  "aria-label": string
}
export type BreadcrumbListProps = React.ComponentPropsWithoutRef<"ol">
export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<"li">
export type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<"a">
export type BreadcrumbPageProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "aria-current"
>
export type BreadcrumbSeparatorProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "aria-hidden"
>
```

각 컴포넌트는 대응하는 native element를 `forwardRef`로 렌더링하고 JDSB class와 소비자
`className`을 결합한다. `Breadcrumb`의 `aria-label`은 필수다. `BreadcrumbPage`는
항상 `<span aria-current="page">`이고, `BreadcrumbSeparator`는 항상
`<span aria-hidden="true">`이다.

```tsx
<Breadcrumb aria-label="현재 위치">
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">홈</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator>/</BreadcrumbSeparator>
    <BreadcrumbItem><BreadcrumbLink href="/products">상품</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator>/</BreadcrumbSeparator>
    <BreadcrumbItem><BreadcrumbPage>상세</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

`BreadcrumbPage`는 disabled link가 아니다. 현재 위치가 이동 대상이 아니므로 native
링크·`href`·keyboard handler를 제공하지 않는다. `BreadcrumbLink`는 native `<a>`의
`href`, target, download와 브라우저의 키보드 활성화 동작을 그대로 보존한다.

## 접근성

- `Breadcrumb`는 이름 있는 native `<nav>`를, `BreadcrumbList`와 `BreadcrumbItem`은
  native `<ol>`과 `<li>`를 사용한다. role을 다시 구현하지 않는다.
- 각 Breadcrumb에는 문맥을 설명하는 고유한 `aria-label`을 준다.
- 마지막 현재 페이지에는 `BreadcrumbPage` 하나를 사용해 `aria-current="page"`를
  보장한다. 링크와 페이지의 중복 표시는 소비자가 만들지 않는다.
- 구분자는 시각 전용이므로 `aria-hidden="true"`다. 구분자 텍스트나 장식 아이콘의
  접근 가능한 이름을 만들지 않는다.
- 링크 외에 `tabIndex`, key handler, click 처리, focus 관리는 추가하지 않는다.
  링크의 보이는 focus는 `:focus-visible`로 제공한다.
- forced-colors에서 시스템 색 조정을 허용하고, animation과 transition은 추가하지
  않는다.

## 토큰과 스타일

기존 `color.action.ghost.foreground`, `color.field.foreground`, `color.focus.ring`,
`size.focus`, `space.field.content` semantic token만 재사용한다. Breadcrumb 전용 token은
추가하지 않는다.

- `BreadcrumbList`: 목록 기본 스타일을 제거하고, 항목과 구분자를 inline flex로
  배치하며 기존 semantic spacing을 사용한다.
- `BreadcrumbLink`: action foreground와 underline으로 이동 가능함을 표시한다.
  `:focus-visible`에는 semantic focus outline을 적용한다.
- `BreadcrumbPage`: field foreground로 현재 위치를 표시한다.
- `BreadcrumbSeparator`: field foreground를 사용하되 `aria-hidden` 상태를 유지한다.

CSS에는 색상·크기·간격·반경·시간 리터럴을 넣지 않는다. 긴 경로의 축약과 overflow는
컴포넌트가 추측하지 않는다.

## 문서와 검증

Storybook은 기본 경로, 긴 경로, 다국어 label Story를 제공한다. 기본 Story의 play
test는 navigation의 이름, 현재 페이지의 `aria-current`, 구분자의 `aria-hidden`, 첫
링크의 keyboard focus를 검증한다. 모든 Story는 기존 axe 검사 대상에 남긴다.

컴포넌트 테스트는 package entry export, 모든 native root의 속성·이벤트·ref·className
전달, `Breadcrumb`의 이름, `BreadcrumbPage`와 `BreadcrumbSeparator`의 강제 ARIA 값을
검증한다. 구현 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`와 Storybook
검사를 실행한다.

## 성공 기준

소비자는 라우터나 새 의존성 없이 경로별로 링크·현재 페이지·구분자를 조합할 수 있다.
모든 기본 시각 값은 기존 semantic token으로 제어되고, native navigation·목록 의미와
키보드 가능한 링크가 보존된다.
