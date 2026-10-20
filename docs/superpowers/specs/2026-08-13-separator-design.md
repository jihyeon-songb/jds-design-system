# JDSB Separator 설계

## 목적

`@jdsb/components`에 콘텐츠 구획을 시각적·의미적으로 나누는 token 기반의
`Separator` 프리미티브를 추가한다. 가로와 세로 구분선만 제공하며, 상태나 복합
상호작용을 만들지 않는다.

## 범위

포함:

- 가로와 세로 구분선을 위한 `Separator`
- `orientation?: "horizontal" | "vertical"` 공개 API와 native 속성·ref 전달
- semantic token만 사용하는 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- label, children, decorative, variant, size API
- 클릭·선택·포커스·키보드 동작
- 텍스트가 포함된 divider와 외부 UI 라이브러리

텍스트로 구획을 표시해야 하면 소비자가 heading 또는 label을 별도로 렌더링한다.
장식 선만 필요하면 소비자는 `aria-hidden="true"`인 요소와 자체 CSS를 사용한다.

## 공개 API

```ts
export type SeparatorOrientation = "horizontal" | "vertical"

export type SeparatorProps =
  | (React.ComponentPropsWithoutRef<"hr"> & {
      orientation?: "horizontal"
    })
  | (React.ComponentPropsWithoutRef<"div"> & {
      orientation: "vertical"
    })
```

`orientation`의 기본값은 `"horizontal"`이다.

- 가로 Separator는 native `<hr>`로 렌더링한다. `<hr>`의 기본 separator 의미를
  보존하고 `aria-orientation`을 중복해 설정하지 않는다.
- 세로 Separator는 `<div role="separator" aria-orientation="vertical">`로
  렌더링한다.
- 두 방향 모두 관련 native 속성, 이벤트, `className`, ref를 전달한다. `className`은
  JDSB class와 결합한다.

```tsx
<Separator />
<div className="toolbar">
  <Button>복사</Button>
  <Separator orientation="vertical" />
  <Button>붙여넣기</Button>
</div>
```

## 접근성

- Separator는 비상호작용 요소다. `tabIndex`, keyboard handler, focus style을 추가하지
  않는다.
- 가로 Separator는 native `<hr>` 의미를, 세로 Separator는 `role="separator"`와
  `aria-orientation="vertical"`을 제공한다.
- 값 조절이 가능한 separator가 아니므로 `aria-valuenow` 등의 range 속성을 지원하지
  않는다.
- forced-colors에서는 시스템 색을 허용하며 animation과 transition을 추가하지 않는다.

## 토큰과 스타일

기존 semantic border 색과 `size.border` token을 재사용한다. 새로운 token은 추가하지
않는다. CSS에 색상, 크기, 간격, 반경의 하드코딩 값은 두지 않는다.

- `.jdsb-separator`는 border 색을 적용하고 기본 browser margin을 제거한다.
- 가로 Separator는 block 너비와 border-top으로 선을 만든다.
- 세로 Separator는 self-stretch 높이와 border-inline-start로 선을 만든다.
- 소비자가 레이아웃 간격과 컨테이너 높이를 책임진다.

## 문서와 검증

Storybook은 기본 가로 Separator와 toolbar 안의 세로 Separator Story를 제공한다.
각 Story는 기존 axe 검사 대상이 된다.

컴포넌트 테스트는 package entry export와 prop type, 가로의 `<hr>` 렌더링·ref·속성
전달, 세로의 `role="separator"`·`aria-orientation="vertical"`·ref·이벤트 전달을
검증한다. 구현 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`와 Storybook
검사를 실행한다.

## 성공 기준

소비자는 새 의존성이나 상태 API 없이 가로·세로 콘텐츠 구획을 추가할 수 있다. 두 방향의
native 의미와 ref·속성 전달이 보존되고, 모든 시각 스타일은 기존 semantic token만 사용한다.
