# JDS Git Flow 브랜치 전략 적용 계획

> **에이전트 작업자용:** 이 계획은 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용해 작업 단위로 실행한다.

**목표:** 저장소 규칙에 Git Flow 브랜치 정책을 반영하고 `main` 기준의 `develop` 브랜치를 만든다.

**구조:** `AGENTS.md`가 사람이 읽는 작업 규칙의 단일 출처가 된다. `develop`은 현재 `main` HEAD에서 한 번만 생성하며, 이후 기능 작업은 `develop`에서 분기한다.

**기술:** Git, Markdown.

## 공통 제약

- 장기 브랜치는 `main`, `develop`이다.
- 작업 브랜치 이름은 `<type>/<short-kebab-case>`다.
- 허용 type은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `release`, `hotfix`다.
- `release/<version>`은 `develop`에서, `hotfix/<short-kebab-case>`은 `main`에서 만들며 모두 `main`과 `develop`으로 되돌려 병합한다.
- `main`에 직접 작업 커밋을 만들지 않고, 작업은 격리 worktree에서 수행한다.

---

### Task 1: 저장소 작업 규칙에 Git Flow를 기록한다

**파일:**

- 수정: `AGENTS.md`
- 참고: `docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md`

**인터페이스:**

- 입력: 승인된 Git Flow 설계 명세.
- 출력: 모든 작업자가 따를 수 있는 branch naming·분기·병합·worktree 규칙.

- [ ] **1단계: 기존 지침과 새 명세를 확인한다**

```sh
sed -n '1,260p' AGENTS.md
sed -n '1,220p' docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md
```

예상: 기존 개발·검증 지침을 보존한 채 Git Flow 섹션을 추가할 위치를 확인한다.

- [ ] **2단계: `AGENTS.md`에 Git Flow 섹션을 추가한다**

다음 내용을 그대로 추가한다.

```markdown
## Git Flow 브랜치 규칙

- 장기 브랜치는 배포용 `main`과 다음 릴리스 통합용 `develop`이다.
- 일반 작업은 `develop`에서 `<type>/<short-kebab-case>`로 분기해 `develop`으로 병합한다.
- 허용 type은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`다.
- `release/<version>`은 `develop`에서 만들고 검증 뒤 `main`, `develop`에 병합한다.
- `hotfix/<short-kebab-case>`은 `main`에서 만들고 수정 뒤 `main`, `develop`에 병합한다.
- 기능·수정·릴리스·긴급 수정은 격리된 git worktree에서 수행하며 `main`에 직접 작업 커밋을 만들지 않는다.
```

- [ ] **3단계: 지침을 검증한다**

```sh
rg -n 'Git Flow 브랜치 규칙|develop|release/<version>|hotfix/<short-kebab-case>' AGENTS.md
```

예상: 각 branch 규칙이 한 번씩 발견된다.

- [ ] **4단계: 규칙 변경을 커밋한다**

```sh
git add AGENTS.md
git commit -m "docs: add Git Flow branch rules"
```

### Task 2: `main`에서 `develop`을 생성하고 확인한다

**파일:**

- 수정 없음: Git local refs만 변경

**인터페이스:**

- 입력: 현재 `main` HEAD.
- 출력: `develop`이 `main`과 같은 시작 커밋을 가리킨다.

- [ ] **1단계: branch 생성 전 상태를 확인한다**

```sh
git branch --show-current
git show -s --format='%H' main
git show-ref --verify --quiet refs/heads/develop; test $? -eq 1
```

예상: 현재 branch는 `main`이며 `develop`은 아직 없다.

- [ ] **2단계: 현재 `main` HEAD에서 `develop`을 생성한다**

```sh
git branch develop main
```

- [ ] **3단계: `develop`의 시작점을 확인한다**

```sh
test "$(git rev-parse main)" = "$(git rev-parse develop)"
git branch --list main develop
```

예상: 명령이 성공하고 `main`, `develop`이 같은 commit hash를 가리킨다.

- [ ] **4단계: Git ref 변경을 기록한다**

`develop` 생성은 ref 변경만 하므로 별도 commit을 만들지 않는다. 다음 feature worktree는 `develop`에서 `feat/<name>` 브랜치를 생성한다.

### Task 3: 커밋 메시지 규칙을 저장소 지침에 추가한다

**파일:**

- 수정: `AGENTS.md`
- 수정: `docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md`

**인터페이스:**

- 입력: 승인된 커밋 형식 `<type>: <제목>`과 제목·본문·footer 규칙.
- 출력: 한국어 기본의 일관된 Conventional Commit 메시지 지침.

- [ ] **1단계: 커밋 규칙이 아직 없는지 확인한다**

```sh
rg -n '커밋 메시지 규칙|Resolves: #12|제목은 50자' AGENTS.md docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md
```

예상: 설계 명세에는 규칙이 있고 `AGENTS.md`에는 아직 없다.

- [ ] **2단계: `AGENTS.md`에 다음 규칙을 추가한다**

```markdown
## 커밋 메시지 규칙

- 형식은 `<type>: <제목>`이며 type은 `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `release`, `hotfix` 중 하나다.
- 제목은 50자 이하를 권장하고 마침표를 붙이지 않는다. 한국어를 기본으로 하며, 영어는 필요할 때만 동사 원형으로 시작하고 첫 글자를 대문자로 쓴다.
- 본문이 있으면 제목 뒤에 빈 줄을 하나 둔다. 본문은 한 줄 72자 안팎, 한 줄 한 변경, 불릿 포인트로 무엇을 왜 바꿨는지 적는다.
- footer는 본문 뒤 빈 줄 다음에 `Resolves: #12`, `Fixes: #12`, `Ref: #12`, `Related to: #12` 형식으로 쓴다.
```

- [ ] **3단계: 명세와 지침의 일치를 확인한다**

```sh
rg -n '커밋 메시지 규칙|제목은 50자|한 줄 72자|Resolves: #12|Related to: #12' AGENTS.md docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md
git diff --check
```

예상: 두 문서 모두 형식·제목·본문·footer 규칙을 포함하고 whitespace 오류가 없다.

- [ ] **4단계: 명세와 저장소 지침 변경을 커밋한다**

```sh
git add AGENTS.md docs/superpowers/specs/2026-07-28-git-flow-branch-strategy-design.md
git commit -m "docs: 커밋 메시지 규칙 추가"
```

## 계획 자체 검토

- 적용 범위: 작업 1은 Git Flow 규칙을, 작업 2는 승인된 `develop` branch를, 작업 3은 한국어 기본 커밋 메시지 규칙을 적용한다.
- 누락 검사: 불완전한 단계나 정의되지 않은 branch 형식이 없다.
- 일관성: `main`, `develop`, `release`, `hotfix`의 분기·병합 방향이 승인된 설계 명세와 일치한다.
