# JDSB Table 설계

## 목적

`@jdsb/components`에 표 데이터를 올바른 HTML 의미로 표시하는 token 기반 `Table`
프리미티브를 추가한다. Table은 구조와 기본 스타일만 제공하며, 데이터·정렬·선택 같은
애플리케이션 상태는 소비자가 소유한다.

## 범위

포함:

- `Table`, `TableCaption`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`,
  `TableHead`, `TableCell`
- 각 요소의 native 속성, 이벤트, `className`, ref 전달
- caption을 통한 native table accessible name 및 `TableHead`의 native `scope` 보존
- semantic token만 사용하는 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 정렬, 필터, 선택, 페이지네이션, 데이터 요청, 빈 상태, 행 클릭 API
- 가로 스크롤 wrapper와 반응형 카드 변환
- 열 너비·정렬·sticky 열을 위한 별도 props, variant·size API
- 외부 UI 라이브러리와 새 의존성

좁은 화면의 가로 스크롤은 Table의 책임이 아니다. 소비자는 표의 의미를 바꾸지 않는
컨테이너로 감싸거나 해당 서비스에 맞는 대체 표현을 선택한다.

## 공개 API

```ts
export type TableProps = React.ComponentPropsWithoutRef<"table">
export type TableCaptionProps = React.ComponentPropsWithoutRef<"caption">
export type TableHeaderProps = React.ComponentPropsWithoutRef<"thead">
export type TableBodyProps = React.ComponentPropsWithoutRef<"tbody">
export type TableFooterProps = React.ComponentPropsWithoutRef<"tfoot">
export type TableRowProps = React.ComponentPropsWithoutRef<"tr">
export type TableHeadProps = React.ComponentPropsWithoutRef<"th">
export type TableCellProps = React.ComponentPropsWithoutRef<"td">
```

각 컴포넌트는 이름에 대응하는 native element를 `forwardRef`로 렌더링하고 JDSB class와
소비자 `className`을 결합한다. `TableHead`는 native `<th>`이므로 `scope`, `colSpan`,
`rowSpan`, `abbr`를 별도 변환 없이 전달한다.

```tsx
<Table>
  <TableCaption>주문 목록</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">주문</TableHead>
      <TableHead scope="col">상태</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>JDSB-1</TableCell>
      <TableCell>처리 중</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 접근성

- native `<table>`과 하위 요소를 사용한다. `role`로 표 의미를 다시 구현하지 않는다.
- 데이터 표에는 보이는 `<TableCaption>`을 제공한다. caption을 둘 수 없는 맥락에서는
  소비자가 `aria-label` 또는 `aria-labelledby`를 `Table`에 직접 전달한다. `Table`은
  이름을 강제하거나 자동 생성하지 않는다.
- `TableHead`의 `scope`와 `TableCaption`의 위치를 변경하지 않는다.
- Table 자체는 비상호작용 요소다. keyboard handler, `tabIndex`, focus style을 추가하지
  않는다. 셀 안의 링크·버튼 등 interactive content는 native 동작과 기존 컴포넌트가
  담당한다.
- forced-colors에서는 시스템 색 조정을 허용한다. animation과 transition은 추가하지
  않는다.

## 토큰과 스타일

기존 `color.field.background`, `color.field.foreground`, `color.field.border`,
`size.border`, `space.field` semantic token만 재사용한다. Table 전용 token은 추가하지
않는다.

- `Table`: `border-collapse: collapse`, field foreground.
- `TableCaption`: 콘텐츠와 같은 색으로 caption의 native 위치를 보존한다.
- `TableHead`, `TableCell`: semantic spacing과 bottom border를 적용한다.
- `TableHeader`, `TableFooter`: 추가 surface나 상태 스타일을 적용하지 않는다.
- `TableRow`: 배경, pointer cursor, click 동작을 추가하지 않는다.

CSS에는 색상·크기·간격·반경·시간 리터럴을 넣지 않는다. native table 구조를 바꾸는
`display` 재정의나 overflow 처리는 추가하지 않는다.

## 문서와 검증

Storybook은 caption이 있는 기본 표, 숫자 데이터, 좁은 컨테이너의 표 Story를 제공한다.
좁은 컨테이너 Story는 Table이 wrapper를 추가하지 않고 표 구조를 보존함을 보여 준다.
모든 Story는 기존 axe 검사 대상에 남긴다.

컴포넌트 테스트는 package entry export, native element 렌더링, caption의 accessible name,
`scope` 전달, 각 root의 속성·이벤트·ref·className 전달을 검증한다. 정렬 버튼,
checkbox, 행 클릭 같은 상태 기능이 생기지 않는 것도 확인한다. 구현 뒤 `pnpm typecheck`,
`pnpm test`, `pnpm build`, `pnpm lint`와 Storybook 검사를 실행한다.

## 성공 기준

소비자는 새 의존성이나 Table 상태 API 없이 올바른 native 표를 구성할 수 있다. 모든
기본 시각 값은 semantic token으로 제어되고, 표의 native 접근성 의미·속성·ref가
보존된다.
