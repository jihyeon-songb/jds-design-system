# JDSB Button 설계

## 목적

`@jdsb/components`의 첫 공개 컴포넌트로, 토큰 기반의 접근 가능한 네이티브 Button을 제공한다. 이 작업은 Button에 필요한 pnpm workspace, 토큰, 컴포넌트, Storybook, 검사 기반만 구축한다.

## 범위

포함:

- `@jdsb/tokens`, `@jdsb/components`, Storybook workspace의 최소 구성
- DTCG 토큰 원본과 CSS 변수·TypeScript 토큰 타입 출력
- Button의 variant, size, loading, 시작·끝 아이콘, 상태 스타일
- Button Story와 axe 접근성 검사, 컴포넌트 테스트

제외:

- 링크로 렌더링하는 Button API
- 아이콘 전용 Button과 나머지 18개 컴포넌트
- JavaScript ThemeProvider, 외부 UI 라이브러리, 시각 회귀 검사

## 패키지 구조

```text
packages/
  tokens/       # @jdsb/tokens: DTCG 원본, CSS 변수, JavaScript, TypeScript 타입
  components/   # @jdsb/components: Button과 Button CSS
apps/
  storybook/    # 문서와 axe 검사, npm 비배포
```

`@jdsb/components`는 React를 peer dependency로 선언하고, Button CSS를 별도 export한다. `@jdsb/tokens`는 primitive → semantic → component token 순서를 유지한다. Button 스타일은 semantic token을 우선 사용하며, Button에만 필요한 값만 `button.*` component token으로 둔다.

## 공개 API

```ts
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"

export type ButtonSize = "sm" | "md" | "lg" | "xl"

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}
```

Button은 ref와 모든 적용 가능한 native button 속성을 전달하며, native `<button>`만 렌더링한다. 기본값은 `variant="primary"`, `size="md"`이다. 아이콘은 소비자가 전달하고 JDSB는 위치와 간격만 제어한다.

## 시각 규칙

- variant는 `primary`, `secondary`, `outline`, `ghost`, `destructive`다.
- 시각 언어는 solid primary를 중심으로 한다. secondary는 낮은 강조의 채움, outline은 테두리, ghost는 배경 없는 보조 행동, destructive는 되돌릴 수 없는 행동에만 사용한다.
- 높이는 `sm` 32px, `md` 36px, `lg` 40px, `xl` 44px이다.
- 모서리 반경은 `radius.control`의 8px 기본값이다.
- 하드코딩한 시각 값은 컴포넌트 CSS에 두지 않고 토큰 원본에만 둔다.
- 이 크기 정책은 상위 JDSB 설계의 “Button 기본 44 x 44 CSS px” 규칙을 Button의 `xl` 크기로 한정하도록 갱신한다. `IconButton`의 기본 44 x 44 CSS px 규칙은 유지한다.

## 상태와 접근성

- Button은 native `disabled`를 사용한다.
- `loading`이면 `disabled`, `aria-busy="true"`, `data-state="loading"`을 적용한다. 그렇지 않으면 `data-state="idle"`을 적용한다.
- loading 중에는 스피너만 보이고 원래 children은 접근 가능한 이름과 버튼 폭을 유지한다. spinner는 보조 기술에 중복해서 읽히지 않는다.
- `:focus-visible`은 2 CSS px 이상이며 비포커스 상태와 3:1 이상 구분되는 focus token을 사용한다.
- hover, active, disabled, loading은 색상 외의 시각 차이도 제공한다.
- `prefers-reduced-motion`에서 spinner 회전을 중지하고, forced-colors에서는 시스템 색을 사용한다.
- Button의 사용자는 의도에 맞는 `type`을 명시한다. Button은 native HTML의 type 동작을 임의로 바꾸지 않는다.

## 문서와 검증

- Storybook은 모든 variant·size, start/end 아이콘, disabled, loading, 긴 레이블을 문서화한다.
- 모든 Story에 Storybook accessibility addon의 axe 검사를 적용한다.
- 컴포넌트 테스트는 기본 props, native 속성·ref 전달, click, disabled/loading의 상호작용 차단, `aria-busy`, 접근 가능한 이름, 아이콘 순서를 검증한다.
- 릴리스 전 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`를 실행한다.
- 키보드 포커스, 브라우저 확대, reduced motion, forced-colors는 수동으로 확인한다.

## 성공 기준

서비스는 토큰 CSS를 import한 뒤 `Button` 하나로 일관된 네이티브 버튼, 문서화된 상태, 키보드 포커스, 로딩 중 중복 실행 방지, 테마 재정의를 사용할 수 있다.
