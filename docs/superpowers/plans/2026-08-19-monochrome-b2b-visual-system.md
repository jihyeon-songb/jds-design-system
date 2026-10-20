# 모노크롬 B2B 시각 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JDSB 전체를 조밀한 블랙·화이트 B2B 시각 시스템으로 통일한다.

**Architecture:** 토큰 원본에서 표면·전경·경계·상태 색상을 재정의해 기존 CSS 변수 소비자를 일괄 갱신한다. 누락되거나 잘못된 토큰 참조만 컴포넌트 CSS에서 바로잡고, React API와 상호작용 구현은 바꾸지 않는다.

**Tech Stack:** DTCG JSON tokens, React 19, TypeScript, CSS, Storybook 10, Vitest

**Spec:** `docs/superpowers/specs/2026-08-19-monochrome-b2b-visual-system-design.md`

## Global Constraints

- `pnpm`만 사용하고 새 의존성은 추가하지 않는다.
- 공개 React API, 키보드 동작, ARIA 의미를 변경하지 않는다.
- CSS에 시각 값을 하드코딩하지 않고 `--jdsb-*` semantic token만 사용한다.
- WCAG 2.2 AA 대비, 2px 포커스 링, forced-colors와 reduced-motion 동작을 보존한다.
- 커밋하지 않는다.

---

### Task 1: 모노크롬 토큰 기준 확정

**Files:**
- Modify: `packages/tokens/src/jdsb.tokens.json`
- Test: `packages/tokens/tests/build.test.ts`

**Interfaces:**
- Consumes: 기존 `color.action.*`, `color.field.*`, `color.card.*`, `color.alert.*`, `color.badge.*` 토큰 경로
- Produces: 동일한 생성 CSS 변수 이름의 모노크롬 값

- [ ] **Step 1: 생성 토큰 검증을 먼저 실행한다**

Run: `pnpm test -- packages/tokens/tests/build.test.ts`
Expected: PASS

- [ ] **Step 2: 토큰의 실패 기준을 추가한다**

`packages/tokens/tests/build.test.ts`에 빌드 결과가 정해진 모노크롬 primary 배경, focus ring, field border를 출력하는 assertion을 추가한다.

```ts
expect(result.css).toContain("--jdsb-color-action-primary-background: #000000;")
expect(result.css).toContain("--jdsb-color-focus-ring: #000000;")
expect(result.css).toContain("--jdsb-color-field-border: #d4d4d4;")
```

- [ ] **Step 3: 테스트가 통과함을 확인한다**

Run: `pnpm test -- packages/tokens/tests/build.test.ts`
Expected: FAIL because the source tokens still use the prior palette

- [ ] **Step 4: 최소 토큰 변경을 구현한다**

`jdsb.tokens.json`에서 neutral 0/100/300/700/900을 각각 `#ffffff`/`#f5f5f5`/`#d4d4d4`/`#525252`/`#000000`으로 설정한다. primary는 검정/흰색과 hover `#262626`으로, secondary·outline·ghost·field·card·skeleton·progress·focus는 이 중립 단계로 연결한다. info/success/warning badge와 alert은 중립 의미 토큰을 사용하고 error만 오류 토큰을 유지한다. 컨트롤의 기본 높이와 간격은 기존 32px·4px 기반 값을 재사용한다.

- [ ] **Step 5: 생성물과 타입을 검증한다**

Run: `pnpm --filter @jdsb/tokens build && pnpm test -- packages/tokens/tests/build.test.ts`
Expected: PASS

### Task 2: 잘못된 CSS 토큰 참조 제거

**Files:**
- Modify: `packages/components/src/inputs/Calendar.css`
- Modify: `packages/components/src/navigation/Accordion.css`
- Modify: `packages/components/src/navigation/Tabs.css`

**Interfaces:**
- Consumes: Task 1에서 생성된 `--jdsb-*` 변수
- Produces: 모든 컴포넌트 CSS에서 실제 생성되는 변수만 참조

- [ ] **Step 1: 생성 토큰 목록과 CSS 참조를 비교한다**

Run: `pnpm --filter @jdsb/tokens build && rg -n -- '--jdsb-space-group-gap|--jdsb-size-alert-close' packages/components/src`
Expected: `Calendar.css` 1건, `Accordion.css`와 `Tabs.css` 각 1건이 출력됨

- [ ] **Step 2: 생성되는 공통 변수를 사용하도록 수정한다**

Calendar의 group gap은 `--jdsb-space-field-item`으로, Accordion과 Tabs의 잘못된 close size 참조는 기존 생성 변수 `--jdsb-size-control-alert-close`로 교체한다. 새 토큰은 추가하지 않는다.

- [ ] **Step 3: 대상 컴포넌트를 검증한다**

Run: `pnpm test -- Calendar Accordion Tabs && pnpm --filter @jdsb/components build && ! rg -n -- '--jdsb-space-group-gap|--jdsb-size-alert-close' packages/components/src`
Expected: PASS

### Task 3: 핵심 관리 화면 흐름 시각 검증

**Files:**
- Modify: 없음

**Interfaces:**
- Consumes: Task 1 토큰과 Task 2 CSS 참조
- Produces: 기존 Storybook stories로 확인한 모노크롬 밀집형 시각 기준

- [ ] **Step 1: 수동 시각 기준을 확인한다**

Storybook에서 기본 Button, Input, Table, Dialog를 열어 검정 primary, 흰색 표면, 옅은 회색 경계, 32px 기본 컨트롤, 2px focus ring이 같은 위계를 이루는지 확인한다.

- [ ] **Step 2: Storybook 검증을 실행한다**

Run: `pnpm --filter @jdsb/storybook build && pnpm --filter @jdsb/storybook test`
Expected: PASS

### Task 4: 전체 회귀 검증

**Files:**
- Modify: 없음

**Interfaces:**
- Consumes: Tasks 1–3의 토큰, CSS, stories
- Produces: 검증된 로컬 변경 집합

- [ ] **Step 1: 타입과 단위 테스트를 실행한다**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 2: 패키지와 Storybook을 빌드한다**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: 변경 범위를 점검한다**

Run: `git diff --check && git status --short`
Expected: 공백 오류 없음, 명세·계획·`jdsb.tokens.json`·Calendar/Accordion/Tabs CSS만 변경됨
