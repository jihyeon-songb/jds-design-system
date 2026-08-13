# JDSB Card 설계

## 목적

`@jdsb/components`에 관련 콘텐츠를 시각적으로 묶는 token 기반의 비상호작용
`Card` 조합 프리미티브를 추가한다. 콘텐츠의 구조는 소비자가 조합하고, Card는 surface와
일관된 간격만 제공한다.

## 범위

포함:

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- 각 root의 native `div` 속성과 ref 전달
- `CardTitle`의 기본 `h3`와 제목 수준 변경을 위한 `as` prop
- semantic token만 사용하는 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 클릭·선택·확장 상태, variant, size, elevation API
- 링크 또는 버튼 Card, 이미지·미디어 슬롯, loading·skeleton 상태
- Card 내부의 자동 heading 관계·랜드마크 role과 외부 UI 라이브러리

Card 전체를 클릭 가능하게 만들지 않는다. 클릭이나 이동이 필요하면 소비자가 `Button` 또는
native `<a>`를 `CardFooter` 등에 배치한다.

## 공개 API

```ts
export type CardProps = React.ComponentPropsWithoutRef<"div">
export type CardHeaderProps = React.ComponentPropsWithoutRef<"div">
export type CardDescriptionProps = React.ComponentPropsWithoutRef<"div">
export type CardContentProps = React.ComponentPropsWithoutRef<"div">
export type CardFooterProps = React.ComponentPropsWithoutRef<"div">

export type CardTitleProps<T extends React.ElementType = "h3"> =
  React.ComponentPropsWithoutRef<T> & { as?: T }
```

`Card`, `CardHeader`, `CardDescription`, `CardContent`, `CardFooter`는 native `<div>`를
forwardRef로 렌더링한다. `CardTitle`은 기본 `<h3>`를 렌더링하며, `as`에 전달한 요소로
바꾼다. 소비자는 문서 outline에 맞춰 `as="h2"`처럼 제목 수준을 선택한다.

모든 요소는 소비자 className을 JDSB class와 결합하고 나머지 native 속성·이벤트를 그대로
전달한다. Card는 하위 요소의 존재나 순서를 강제하지 않는다.

```tsx
<Card>
  <CardHeader>
    <CardTitle as="h2">월간 사용량</CardTitle>
    <CardDescription>이번 결제 주기의 누적 사용량입니다.</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter><Button>상세 보기</Button></CardFooter>
</Card>
```

## 접근성

- Card는 비상호작용 `div`이며 keyboard handler, tabindex, role, focus style을 추가하지 않는다.
- `CardTitle`의 기본 native heading 의미를 보존한다. `as`로 heading이 아닌 요소를 선택하면
  소비자가 필요한 의미를 책임진다.
- 제목과 설명의 자동 `aria-labelledby` 또는 `aria-describedby` 연결은 만들지 않는다. Card가
  landmark·dialog·article인지 여부는 사용 맥락에 따라 소비자가 root 속성으로 정한다.
- forced-colors에서 시스템 색을 허용한다. animation과 transition은 추가하지 않는다.

## 토큰과 스타일

Card는 `color.surface`, `color.border`, `color.foreground`, `radius.control`, `size.border`와
기존 spacing token을 우선 재사용한다. 누락된 Card 전용 token은 추가하지 않는다. CSS는
하드코딩한 색·간격·반경·크기 값을 포함하지 않는다.

- `Card`: surface, border, radius, foreground와 내부 padding
- `CardHeader`, `CardContent`, `CardFooter`: 역할별 padding과 vertical gap
- `CardTitle`: 기존 heading typography token
- `CardDescription`: muted foreground와 body typography token

간격과 typography에 필요한 semantic token이 없다면 컴포넌트 token을 새로 만들기 전에 기존
token의 의미가 맞는지 확인한다.

## 문서와 검증

Storybook은 기본 조합, `h2` title, footer action Story를 제공한다. 각 Story는 기존 axe
검사 대상이 된다.

컴포넌트 테스트는 package entry export, 각 요소의 native element·className·속성·ref 전달,
`CardTitle` 기본 `h3`와 `as="h2"` 변경을 검증한다. 구현 뒤 `pnpm typecheck`, `pnpm test`,
`pnpm build`, `pnpm lint`와 Storybook 검사를 실행한다.

## 성공 기준

소비자는 새 의존성이나 상태 API 없이 semantic HTML 콘텐츠를 Card로 조합할 수 있고, heading
수준을 문서 구조에 맞게 선택할 수 있다. 모든 시각 스타일은 기존 semantic token을 사용하며
native 속성·ref·접근성 의미가 보존된다.
