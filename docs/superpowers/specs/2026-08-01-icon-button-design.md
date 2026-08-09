# JDSB IconButton 설계

## 목적

`@jdsb/components`에 아이콘만 표시하는 토큰 기반 `IconButton`을 추가한다.
별도 컴포넌트로 제공해 아이콘 전용 제어의 접근 가능한 이름과 최소 44 × 44 CSS px
조작 영역을 API와 스타일에서 보장한다.

## 범위

포함:

- native `<button>` 하나를 렌더링하는 `IconButton`
- 필수 `aria-label`, 아이콘 children, ref와 적용 가능한 native button props
- 기존 Button과 동일한 variant와 loading 상태
- 기본, hover, active, focus-visible, disabled, loading, forced-colors 상태
- 기존 Button semantic token을 재사용하는 CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- `Button` API 변경 또는 Button 내부 구현 공유를 위한 새 추상화
- 아이콘 라이브러리, 아이콘 이름 prop, 자체 SVG 자산
- Tooltip 또는 아이콘 의미를 보완하는 별도 텍스트 UI
- size prop과 44 × 44 CSS px보다 작은 조작 영역
- 링크 렌더링, 외부 UI 라이브러리, 새 의존성

## 공개 API

```ts
export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"

export type IconButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "aria-label"> & {
  "aria-label": string
  variant?: IconButtonVariant
  loading?: boolean
  children: React.ReactNode
}
```

`IconButton`은 native `<button>` 하나를 렌더링한다. `variant`의 기본값은
`"primary"`이고, `loading`의 기본값은 `false`다. `aria-label`은 빈 문자열이 아닌
동작을 설명하는 문자열을 소비자가 전달해야 한다. 아이콘은 children으로 전달하고,
JDSB는 아이콘을 `aria-hidden="true"` wrapper로 감싸 이름 계산에 영향을 주지 않게 한다.

`loading`이면 native `disabled`, `aria-busy="true"`, `data-state="loading"`을
적용한다. 그 외에는 disabled이면 `data-state="disabled"`, 아니면
`data-state="idle"`이다. `disabled`와 `loading` 중 하나라도 true이면 클릭과
키보드 활성화는 native button이 막는다. 모든 적용 가능한 native button 속성과 ref는
그대로 전달한다.

```tsx
<IconButton aria-label="알림 닫기" type="button" variant="ghost">
  <svg aria-hidden="true" viewBox="0 0 16 16" />
</IconButton>
```

## 토큰과 스타일

새 토큰은 추가하지 않는다. `IconButton`은 Button이 쓰는 action, focus, border,
radius, disabled opacity, spinner duration, active offset 토큰을 재사용한다.
가로·세로 크기는 `size.control.button.xl.height` 토큰으로 동일하게 설정해 항상
44 × 44 CSS px을 보장한다. 아이콘의 기준 크기는 `size.control.icon` 토큰이다.

`IconButton.css`는 variant별 배경·전경·테두리, hover, active, disabled, focus-visible,
loading spinner, motion reduction, forced-colors를 Button과 같은 토큰 언어로 구현한다.
CSS에는 리터럴 시각 값을 추가하지 않는다. loading 중 아이콘은 투명하게 유지하되
`aria-label`은 변하지 않아 버튼의 접근 가능한 이름이 보존된다.

## 접근성

- `aria-label`은 TypeScript에서 필수다. Tooltip 없이도 동작 목적을 이름으로 제공한다.
- native button이 Tab/Shift+Tab, Enter, Space, disabled 동작을 담당한다. JavaScript로
  키보드 이벤트를 재구현하지 않는다.
- focus-visible outline은 `size.focus`와 `color.focus.ring` 토큰을 사용한다.
- 44 × 44 CSS px 조작 영역을 유지하고, visible focus 표시를 제공한다.
- 아이콘은 장식으로 취급한다. 아이콘 자체의 title·텍스트가 버튼 이름을 중복하지 않는다.
- forced-colors에서는 시스템 색을 허용하고, `prefers-reduced-motion`에서는 spinner
  animation과 transition을 제거한다.

## 문서와 검증

Storybook은 기본, 모든 variant, disabled, loading, 긴 `aria-label` 예시를 제공한다.
모든 Story는 preview의 axe 오류 설정으로 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- ref, `type`, `name` 같은 native props 전달과 `aria-label` 기반 accessible name
- 기본 variant와 44 × 44 크기를 가리키는 `data-variant` 및 CSS class 적용
- loading의 native disabled, `aria-busy`, `data-state`, click handler 비호출
- disabled state, 모든 variant attribute, 아이콘 wrapper의 `aria-hidden`

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. Storybook에서 Tab/Shift+Tab, Enter,
Space, disabled, loading, 200% zoom, forced-colors를 수동 확인하고, 스크린리더로
`aria-label`, busy, disabled 상태 안내를 확인한다.

## 성공 기준

소비자는 아이콘 자산을 직접 전달하고, 별도 Tooltip이나 접근성 보완 코드 없이도
명확한 접근 가능한 이름과 44 × 44 CSS px 조작 영역을 가진 IconButton을 사용할 수 있다.
기존 Button API와 동작은 바뀌지 않으며, 새 의존성이나 중복 추상화도 추가하지 않는다.
