# Switch 레퍼런스 비율 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 Switch size를 레퍼런스처럼 더 얇은 track과 촘촘한 thumb 여백으로 조정한다.

**Architecture:** `@jdsb/tokens`의 Switch size와 thumb inset만 수정한다. 생성된 token CSS를 통해 기존 `Switch.css`가 새 비율을 자동으로 사용하므로 컴포넌트 API나 CSS 선택자는 변경하지 않는다.

**Tech Stack:** Design Tokens JSON, Node.js token builder, Vitest

## Global Constraints

- 기존 semantic token만 사용하고 새 의존성이나 API를 추가하지 않는다.
- track은 `30×14`, `34×18`, `38×22`, `42×26px`; thumb는 기존 크기, inset은 `1px`로 한다.
- 모든 Switch native form 및 접근성 동작을 보존한다.

---

### Task 1: Switch 크기 토큰 조정

**Files:**
- Modify: `packages/tokens/src/jdsb.tokens.json`
- Modify: `packages/tokens/dist/index.d.ts`
- Modify: `packages/tokens/dist/index.js`
- Modify: `packages/tokens/dist/tokens.css`
- Test: `packages/tokens/tests/build.test.ts`

**Interfaces:**
- Consumes: `size.control.switch.*`와 `space.switch.thumb-inset`.
- Produces: `--jdsb-size-control-switch-*-track-inline`, `--jdsb-size-control-switch-*-track-block`, `--jdsb-space-switch-thumb-inset` CSS custom properties.

- [ ] **Step 1: source token 값을 변경한다**

```json
"md": {
  "track-inline": { "$value": "34px", "$type": "dimension" },
  "track-block": { "$value": "18px", "$type": "dimension" },
  "thumb-size": { "$value": "16px", "$type": "dimension" }
}
```

- [ ] **Step 2: token 산출물을 생성한다**

Run: `pnpm --filter @jdsb/tokens build`
Expected: generated declarations and CSS contain the changed Switch dimensions.

- [ ] **Step 3: 검증한다**

Run: `pnpm test packages/tokens/tests/build.test.ts packages/components/src/inputs/Switch.test.tsx && pnpm typecheck && pnpm build && pnpm lint`
Expected: all commands exit 0

- [ ] **Step 4: 커밋한다**

```bash
git add packages/tokens/src/jdsb.tokens.json packages/tokens/dist docs/superpowers/plans/2026-08-02-switch-reference-proportions.md
git commit -m "fix: Switch 레퍼런스 비율 반영"
```
