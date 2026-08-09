# JDSB 저장소 규칙

## 프로젝트 개요

JDSB는 npm으로 배포하는 React 디자인 시스템이다. `@jdsb/tokens`는 CSS·JavaScript·TypeScript 토큰을 제공하고, `@jdsb/components`는 토큰 기반의 접근 가능한 UI 컴포넌트를 제공한다. Storybook은 컴포넌트 문서와 검증을 담당하며 배포 패키지에는 포함하지 않는다.

## 개발

- 패키지 관리는 `pnpm`만 사용한다.
- React 컴포넌트를 작성, 검토, 리팩터링할 때 `vercel-react-best-practices` 스킬을 적용한다.
- 모든 컴포넌트는 외부 UI 라이브러리 없이 네이티브 HTML과 표준 ARIA로 구현한다.
- 컴포넌트 스타일에는 하드코딩한 시각 값을 넣지 않고 semantic token을 사용한다.

## 빌드 및 테스트 명령

현재는 프로젝트 초기 단계로 실행 가능한 `package.json` 스크립트가 없다. 모노레포를 구성한 뒤에는 다음 `pnpm` 명령을 표준으로 제공하고 사용한다.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

새 스크립트나 패키지를 추가하기 전에는 기존 `package.json`의 스크립트와 의존성을 먼저 확인한다.

## 코드 스타일

- TypeScript를 사용하고 공개 API에는 명시적인 타입을 제공한다.
- 기존 포맷터와 린터 설정을 따른다. 설정이 없으면 새 도구를 임의로 추가하지 않는다.
- 작고 단일 책임인 컴포넌트와 함수를 선호하고, 사용처가 하나인 추상화는 만들지 않는다.
- 불필요한 `useMemo`, `useCallback`, 클라이언트 컴포넌트, 동적 import를 추가하지 않는다.

## 접근성

- WCAG 2.2 AA를 기준으로 한다.
- 모든 상호작용은 키보드로 조작 가능하고, 보이는 포커스 표시를 제공해야 한다.
- 접근 가능한 이름, label, 오류 메시지 등 필수 의미 정보를 누락하지 않는다.

## 검증

- 변경 범위에 맞는 typecheck, test, build를 실행한 뒤 완료를 보고한다.
- 공개 API 또는 상호작용을 바꿨다면 관련 Storybook 및 접근성 검사를 함께 갱신한다.

## 테스트 지침

- 변경한 동작을 실패시키는 가장 작은 테스트를 추가한다.
- 상태 변경, 이벤트 처리, 키보드 탐색, 포커스 관리는 컴포넌트 또는 브라우저 테스트로 검증한다.
- 모든 Storybook Story에 axe 접근성 검사를 실행한다.
- 자동 검사만으로 충분하지 않은 복합 위젯은 키보드와 스크린리더로 수동 확인한다.

## 보안 고려 사항

- 비밀 값, 액세스 토큰, 개인 정보는 코드·테스트·Story·문서에 포함하거나 커밋하지 않는다.
- 외부 입력은 신뢰 경계에서 검증하고, 사용자 제공 값을 HTML로 직접 삽입하지 않는다.
- 새 의존성은 필요성을 확인한 뒤에만 추가하고, 최소 권한과 최신 보안 패치를 유지한다.
- 공개 컴포넌트는 전달받은 HTML 속성과 이벤트가 의도치 않게 위험한 동작을 만들지 않는지 검토한다.

자세한 설계와 검증 기준은 `docs/superpowers/specs/2026-07-28-jdsb-design-system-design.md`를 따른다.

## Git Flow 브랜치 규칙

- 장기 브랜치는 배포용 `main`과 다음 릴리스 통합용 `develop`이다.
- 일반 작업은 `develop`에서 `<type>/<short-kebab-case>`로 분기해 `develop`으로 병합한다.
- 허용 type은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`다.
- `release/<version>`은 `develop`에서 만들고 검증 뒤 `main`, `develop`에 병합한다.
- `hotfix/<short-kebab-case>`은 `main`에서 만들고 수정 뒤 `main`, `develop`에 병합한다.
- 기능·수정·릴리스·긴급 수정은 격리된 git worktree에서 수행하며 `main`에 직접 작업 커밋을 만들지 않는다.

## 커밋 메시지 규칙

- 형식은 `<type>: <제목>`이며 type은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `release`, `hotfix` 중 하나다.
- 제목은 50자 이하를 권장하고 마침표를 붙이지 않는다. 한국어를 기본으로 하며, 영어는 필요할 때만 동사 원형으로 시작하고 첫 글자를 대문자로 쓴다.
- 본문이 있으면 제목 뒤에 빈 줄을 하나 둔다. 본문은 한 줄 72자 안팎, 한 줄 한 변경, 불릿 포인트로 무엇을 왜 바꿨는지 적는다.
- footer는 본문 뒤 빈 줄 다음에 `Resolves: #12`, `Fixes: #12`, `Ref: #12`, `Related to: #12` 형식으로 쓴다.
