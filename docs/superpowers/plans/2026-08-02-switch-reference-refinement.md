# Switch 레퍼런스 외형 반영 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch off 상태를 레퍼런스와 같은 경계선 없는 연한 회색 pill로 맞춘다.

**Architecture:** `Switch.css`의 track pseudo-element에서만 테두리를 제거한다. React API, size token, thumb, focus와 disabled 상태는 유지한다.

**Tech Stack:** CSS custom properties, Vitest

## Global Constraints

- 새 의존성이나 React API 변경 없이 native HTML과 표준 ARIA를 유지한다.
- 시각 값에는 기존 semantic token만 사용한다.
- `prefers-reduced-motion` 전환 제거 규칙을 유지한다.

---

### Task 1: 레퍼런스 track 복원

**Files:**
- Modify: `packages/components/src/inputs/Switch.css`
- Test: `packages/components/src/inputs/Switch.test.tsx`

**Interfaces:**
- Consumes: `.jds-switch::before`의 기존 track token.
- Produces: 경계선 없이 `color.field.border`로 채워진 off track.

- [ ] **Step 1: track 테두리를 제거한다**

```css
.jds-switch::before {
  background: var(--jds-color-field-border);
  border: none;
}
```

- [ ] **Step 2: Switch 동작과 전체 패키지를 검증한다**

Run: `pnpm test packages/components/src/inputs/Switch.test.tsx && pnpm typecheck && pnpm build && pnpm lint`
Expected: all commands exit 0

- [ ] **Step 3: 커밋한다**

```bash
git add packages/components/src/inputs/Switch.css
git commit -m "fix: Switch 레퍼런스 외형 반영"
```
