# JDSB Git Flow 브랜치 전략

## 목적

JDSB 저장소의 작업·릴리스·긴급 수정 흐름을 Git Flow 기반으로 통일하고, 현재 작업 브랜치를 보호한다.

## 장기 브랜치

- `main`은 배포 가능한 릴리스만 보관한다.
- `develop`은 다음 릴리스에 포함할 작업의 통합 브랜치다.

## 작업 브랜치

일반 작업은 `develop`에서 만들고 `develop`으로 병합한다. 이름은 `<type>/<short-kebab-case>` 형식이며, 허용 type은 다음과 같다.

- `feat` — 새 기능
- `fix` — 버그 수정
- `docs` — 문서만 변경
- `chore` — 도구·설정·유지보수
- `refactor` — 동작을 바꾸지 않는 구조 개선
- `test` — 테스트만 변경
- `ci` — 지속적 통합 설정

예: `feat/button`, `fix/loading-state`, `docs/branch-policy`.

## 릴리스와 긴급 수정

- `release/<version>`은 `develop`에서 만든다. 검증을 마치면 `main`과 `develop` 양쪽으로 병합한다.
- `hotfix/<short-kebab-case>`은 `main`에서 만든다. 수정 후 `main`과 `develop` 양쪽으로 병합한다.

## 작업 공간과 검증

- 기능·수정·릴리스·긴급 수정 작업은 격리된 git worktree에서 수행한다.
- 병합 전 변경 범위에 맞는 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`를 실행한다. 아직 명령이 없는 초기 단계에서는 가능한 명령이 추가된 뒤 적용한다.
- 직접 `main`에 작업 커밋을 만들지 않는다.

## 커밋 메시지 규칙

- 형식은 `<type>: <제목>`이다. `type`은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `release`, `hotfix` 중 하나를 사용한다.
- 제목은 50자 이하를 권장하고 마침표를 붙이지 않는다. 한국어를 기본으로 하며, 영어가 필요하면 동사 원형으로 시작하고 첫 글자를 대문자로 쓴다.
- 본문이 있으면 제목 다음에 빈 줄을 하나 둔다. 본문은 한 줄 72자 안팎으로, 한 줄에 하나의 변경만 적고 불릿 포인트로 무엇을 왜 바꿨는지 짧게 설명한다.
- 이슈 연결은 본문 뒤 빈 줄 다음의 footer에 `Resolves: #12`, `Fixes: #12`, `Ref: #12`, `Related to: #12` 형식으로 적는다.

```text
feat: 버튼 컴포넌트 추가

- 기본 버튼 API와 토큰 기반 스타일을 추가해 일관된 동작을 제공한다
- 로딩 중 클릭을 막아 중복 제출을 방지한다

Resolves: #12
```

## 적용

이 규칙을 `AGENTS.md`에 추가하고, 현재 `main`의 HEAD를 기준으로 `develop` 브랜치를 생성한다.
