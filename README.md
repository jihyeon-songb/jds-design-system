# JDSB

JDSB는 토큰 기반의 접근 가능한 React 디자인 시스템입니다. 외부 UI 라이브러리 없이 네이티브 HTML과 표준 ARIA로 컴포넌트를 구현하고, 모든 시각 값은 디자인 토큰(CSS 변수)으로 관리합니다.

| 패키지 | 설명 |
| --- | --- |
| [`@jdsb/tokens`](packages/tokens) | 디자인 토큰. CSS 변수, JavaScript 객체, TypeScript 타입으로 제공 |
| [`@jdsb/components`](packages/components) | 토큰 기반 React UI 컴포넌트 |
| [`@jdsb/storybook`](apps/storybook) | 컴포넌트 문서와 검증용 Storybook (배포하지 않음) |

> npm에 배포된 `0.0.0`은 초기 스냅샷으로 Button, Input, Select, Textarea만 포함합니다. 아래 컴포넌트 전체는 다음 릴리스부터 제공합니다.

## 특징

- **의존성 최소화**: 런타임 의존성은 `@jdsb/tokens`뿐이며, `react`와 `react-dom`(18 또는 19)은 peer dependency입니다.
- **네이티브 우선**: `<dialog>`, `<button>`, `<input>`, Popover API 같은 플랫폼 기능을 우선 사용합니다.
- **접근성**: WCAG 2.2 AA를 기준으로 키보드 조작, 보이는 포커스 표시, 접근 가능한 이름을 제공하며, 모든 Story에 axe 검사를 실행합니다.
- **토큰 기반 스타일**: 컴포넌트 CSS에는 하드코딩한 값을 넣지 않고 `--jdsb-*` semantic token을 사용합니다.
- **타입 안전성**: 모든 공개 API에 명시적인 TypeScript 타입을 제공하며, 컴포넌트 props는 대응하는 네이티브 요소의 속성을 그대로 받습니다.

## 설치

```sh
pnpm add @jdsb/components @jdsb/tokens
```

## 시작하기

앱 진입점에서 토큰 CSS와 컴포넌트 CSS를 순서대로 한 번만 불러옵니다.

```tsx
import "@jdsb/tokens/css"
import "@jdsb/components/css"
```

이후 컴포넌트를 가져와 사용합니다.

```tsx
import { Button, Field, FieldLabel, Input } from "@jdsb/components"

export function SignInForm() {
  return (
    <form>
      <Field>
        <FieldLabel htmlFor="email">이메일</FieldLabel>
        <Input id="email" type="email" required />
      </Field>
      <Button type="submit" variant="primary">
        로그인
      </Button>
    </form>
  )
}
```

### 조합형 컴포넌트

Dialog, Select, Tabs 같은 복합 위젯은 하위 컴포넌트를 조합해 사용합니다. 대부분 `defaultOpen`·`defaultValue`(비제어)와 `open`·`value` + 변경 콜백(제어) 방식을 모두 지원합니다.

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@jdsb/components"

export function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger>삭제</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>항목을 삭제할까요?</DialogTitle>
          <DialogDescription>삭제한 항목은 복구할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>취소</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Toast

`ToastProvider`를 앱 상위에 두고 `useToast()`로 알림을 띄웁니다.

```tsx
import { Button, ToastProvider, useToast } from "@jdsb/components"

function SaveButton() {
  const toast = useToast()
  return <Button onClick={() => toast.success({ message: "저장했습니다." })}>저장</Button>
}

export function App() {
  return (
    <ToastProvider>
      <SaveButton />
    </ToastProvider>
  )
}
```

## 컴포넌트

| 분류 | 컴포넌트 |
| --- | --- |
| Actions | `Button`, `IconButton` |
| Inputs | `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Select`, `Combobox`, `Calendar` |
| Forms | `Field`, `Label` |
| Feedback | `Alert`, `Toast`, `Badge`, `Avatar`, `Progress` |
| Layout | `Card`, `Separator`, `Skeleton` |
| Data | `Table` |
| Navigation | `Tabs`, `Accordion`, `Pagination`, `Breadcrumb` |
| Overlays | `Dialog`, `Drawer`, `Popover`, `DropdownMenu`, `Tooltip` |

각 컴포넌트의 props, 상태, 키보드 동작은 Storybook과 [`docs/superpowers/specs`](docs/superpowers/specs)의 설계 문서에서 확인할 수 있습니다.

## 디자인 토큰

토큰 원본은 [`packages/tokens/src/jdsb.tokens.json`](packages/tokens/src/jdsb.tokens.json)이며 [W3C Design Tokens](https://www.designtokens.org/) 형식(`$value`, `$type`)을 따릅니다. `{color.neutral.900}`처럼 다른 토큰을 참조할 수 있고, 빌드할 때 참조를 실제 값으로 풀어 냅니다.

| 분류 | 예시 |
| --- | --- |
| `color` | primitive(`neutral`, `red`)와 semantic(`action`, `field`, `alert`, `focus` 등) |
| `size` | 컨트롤 높이, 아이콘, 테두리, 포커스 링 |
| `space` | 컴포넌트별 안쪽 여백과 간격 |
| `radius`, `typography`, `duration`, `opacity`, `offset`, `angle` | 그 밖의 시각 값 |

빌드하면 `packages/tokens/dist`에 세 가지 형태로 출력합니다.

```css
/* @jdsb/tokens/css → dist/tokens.css */
:root {
  --jdsb-color-action-primary-background: #000000;
  --jdsb-size-control-button-md-height: 36px;
}
```

```ts
// @jdsb/tokens → dist/index.js, dist/index.d.ts
import { tokens, type TokenName } from "@jdsb/tokens"

tokens["color.action.primary.background"] // "#000000"
```

### 테마 커스터마이즈

모든 스타일이 CSS 변수를 참조하므로 앱에서 변수를 다시 선언해 덮어쓸 수 있습니다.

```css
:root {
  --jdsb-color-action-primary-background: #1d4ed8;
  --jdsb-color-action-primary-hover: #1e40af;
  --jdsb-radius-control: 4px;
}
```

## 저장소 구조

```text
.
├── apps/
│   └── storybook/          # Storybook 문서와 접근성·상호작용 검증
├── packages/
│   ├── tokens/
│   │   ├── src/            # jdsb.tokens.json (토큰 원본)
│   │   ├── scripts/        # build.mjs (CSS·JS·d.ts 생성)
│   │   └── tests/
│   └── components/
│       └── src/            # actions, data, feedback, forms, inputs,
│                           # layout, navigation, overlays
├── docs/superpowers/       # 설계 문서(specs)와 구현 계획(plans)
├── AGENTS.md               # 저장소 작업 규칙
└── vitest.workspace.ts
```

## 개발

### 요구 사항

- Node.js
- pnpm 10 (`packageManager` 필드 기준, 다른 패키지 매니저는 사용하지 않음)

### 명령

```sh
pnpm install

pnpm typecheck   # tokens·components 빌드 후 전체 타입 검사
pnpm test        # Vitest 단위·컴포넌트 테스트 (jsdom)
pnpm build       # 모든 패키지 빌드
pnpm lint        # 패키지별 lint

pnpm --filter @jdsb/storybook storybook   # http://localhost:6006
pnpm --filter @jdsb/storybook test        # Storybook test-runner (axe 포함)
```

`@jdsb/components`는 `@jdsb/tokens`의 빌드 결과를 참조하므로, 처음 설치한 뒤에는 `pnpm build` 또는 `pnpm typecheck`를 먼저 실행합니다.

### 테스트

- 테스트 파일은 `packages/*/tests/**/*.test.ts`와 `packages/*/src/**/*.test.tsx`입니다.
- 상태 변경, 이벤트, 키보드 탐색, 포커스 관리는 Testing Library로 검증합니다.
- Storybook은 `a11y: { test: "error" }`로 설정해 axe 위반이 있으면 실패합니다.
- 자동 검사로 부족한 복합 위젯은 키보드와 스크린리더로 직접 확인합니다.

## 기여

작업 규칙의 전체 내용은 [`AGENTS.md`](AGENTS.md)에 있습니다.

### 브랜치 (Git Flow)

| 브랜치 | 분기 | 병합 대상 |
| --- | --- | --- |
| `main` | — | 배포용 |
| `develop` | — | 다음 릴리스 통합용 |
| `<type>/<short-kebab-case>` | `develop` | `develop` |
| `release/<version>` | `develop` | `main`, `develop` |
| `hotfix/<short-kebab-case>` | `main` | `main`, `develop` |

`type`은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci` 중 하나입니다. 작업은 git worktree에서 하고, `main`에 직접 커밋하지 않습니다.

### 커밋 메시지

```text
<type>: <제목>

- 무엇을 왜 바꿨는지 한 줄에 하나씩

Resolves: #12
```

- `type`: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `release`, `hotfix`
- 제목은 한국어로 50자 이하로 쓰고 마침표를 붙이지 않습니다.

### 새 컴포넌트를 추가할 때

1. `docs/superpowers/specs`에 설계를, `docs/superpowers/plans`에 구현 계획을 작성합니다.
2. 실패하는 테스트를 먼저 작성한 뒤 `packages/components/src/<분류>/`에 구현합니다.
3. 스타일은 semantic token만 사용하고, 필요하면 `jdsb.tokens.json`에 토큰을 추가합니다.
4. `src/index.ts`에서 컴포넌트와 타입을 내보내고 `src/index.css`에 CSS를 import합니다.
5. `packages/components/package.json`의 `files`에 CSS 경로를 추가합니다.
6. `apps/storybook/src/<분류>/`에 Story를 추가하고 axe 검사를 통과시킵니다.
7. `pnpm typecheck && pnpm test && pnpm build`를 통과시킵니다.
