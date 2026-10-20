# JDSB Skeleton 설계

## 목적

`@jdsb/components`에 콘텐츠가 로드되는 동안 최종 레이아웃을 보존하는 장식용
`Skeleton` 프리미티브를 추가한다. 하나의 native `<span>`만 제공하고, 실제 콘텐츠의
모양과 크기는 소비자가 `className` 또는 native `style`로 조합한다.

## 범위

포함:

- `aria-hidden="true"`인 단일 `Skeleton` 프리미티브
- native `<span>` 속성, 이벤트, `className`, ref 전달
- skeleton 배경 semantic token, token 기반 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- `text`, `avatar`, `rectangle` 등의 variant·size API
- children, 로딩 상태, 접근 가능한 이름, keyboard·focus 동작
- shimmer 애니메이션과 외부 UI 라이브러리

소비자는 로딩 영역의 accessible name과 `aria-busy`를 해당 영역의 실제 컨테이너에
부여한다. `Skeleton` 자신은 보조 기술에서 숨긴다.

## 공개 API

```ts
export type SkeletonProps = Omit<React.ComponentPropsWithoutRef<"span">, "children">
```

```tsx
<Skeleton aria-label="무시됨" className="profile-avatar" style={{ blockSize: "var(--jdsb-size-avatar-md)", inlineSize: "var(--jdsb-size-avatar-md)" }} />
```

구현은 `aria-hidden="true"`를 항상 설정한다. 소비자가 전달한 `aria-hidden`은 이
계약을 바꾸지 못한다. 그 밖의 native span 속성·이벤트·ref 및 `className`은 보존하며,
`className`은 `jdsb-skeleton`과 결합한다.

## 접근성

- `Skeleton`은 정보를 전달하거나 조작할 수 없는 장식 요소이므로 `aria-hidden="true"`다.
- `tabIndex`, role, keyboard handler, focus style을 추가하지 않는다.
- 로딩 상태의 의미는 skeleton 묶음을 감싼 소비자 컨테이너에서 `aria-busy`와 기존 label로
  제공한다. skeleton마다 label을 만들지 않는다.
- motion을 제공하지 않으므로 `prefers-reduced-motion` 분기가 필요 없다. forced-colors에서는
  시스템 색 조정을 허용한다.

## 토큰과 스타일

`color.skeleton.background` semantic token을 추가하고 `{color.neutral.100}`을 기본값으로
사용한다. `Skeleton` 전용의 크기·간격·반경·애니메이션 token은 추가하지 않는다.

- `.jdsb-skeleton`은 `display: block`, `background`, `border-radius`를 적용한다.
- 기본 모서리 반경은 `--jdsb-radius-control`을 사용한다.
- 너비·높이·원형 모양·배치는 소비자가 기존 token을 참조하는 class 또는 inline style로
  정한다. 컴포넌트는 임의의 기본 치수를 정하지 않는다.
- CSS에 색상·크기·간격·반경·시간의 리터럴을 쓰지 않는다.

## 문서와 검증

Storybook은 text placeholder와 avatar placeholder 조합 Story를 제공한다. 두 Story는
기존 axe 검사 대상에 남긴다.

컴포넌트 테스트는 package entry export와 공개 prop type, `span` 렌더링, 강제된
`aria-hidden`, native 속성·이벤트·ref 전달, JDSB와 소비자 class 결합을 검증한다.
구현 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`와 Storybook 검사를 실행한다.

## 성공 기준

소비자는 새 의존성·상태·variant API 없이 text와 avatar 등 다양한 placeholder를 조합할 수
있다. `Skeleton`은 보조 기술에서 숨겨지고, 모든 기본 시각 값은 semantic token을 사용한다.
