# Switch Small 비율 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Small Switch를 `24×14px` track과 10px thumb travel로 줄인다.

**Architecture:** Switch source token만 변경하고 token build가 배포 CSS를 갱신한다.

**Tech Stack:** Design Tokens JSON, Vitest

### Task 1: Small Switch token 갱신

**Files:**
- Modify: `packages/tokens/src/jdsb.tokens.json`
- Modify: `packages/tokens/dist/index.js`
- Modify: `packages/tokens/dist/tokens.css`

- [ ] Set `sm.track-inline` to `24px` and `sm.thumb-travel` to `10px`.
- [ ] Run: `pnpm --filter @jdsb/tokens build && pnpm test packages/components/src/inputs/Switch.test.tsx && pnpm typecheck && pnpm build && pnpm lint`
- [ ] Commit with `fix: Switch small 비율 조정`.
