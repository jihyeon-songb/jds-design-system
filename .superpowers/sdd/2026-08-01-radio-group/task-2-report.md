# Task 2 보고서

## 상태

완료. RadioGroup의 controlled/prevented change, form reset, native arrow keyboard,
상태 우선순위, native label, Context 오류 회귀 테스트를 정리·추가하고 radio 전용
semantic token과 CSS를 구현했다.

## 변경 파일

- `packages/components/src/inputs/RadioGroup.test.tsx`
  - controlled value와 `onValueChange` 요청, prop rerender 동작 검증
  - consumer `onChange`가 prevent한 변경은 checked 값과 callback 모두 유지하는지 검증
  - native ArrowRight 선택 뒤 `data-state` 동기화와 form reset 복귀 검증
  - group invalid/disabled와 item required/disabled 상태 우선순위 검증
  - native `<label htmlFor>` click 선택 검증
  - Group 밖 Item 사용 시 명시적 오류 검증
  - 기존 sibling unmount/reset 및 checked/unchecked coverage 유지
- `packages/tokens/src/jds.tokens.json`
  - `size.control.radio.size = 16px` 추가
  - `space.radio.target = 4px` 추가
  - 기존 token 값은 변경하지 않음
- `packages/components/src/inputs/RadioGroup.css`
  - root vertical/horizontal flex 방향과 semantic gap 추가
  - native radio accent, 24×24px 상호작용 영역, invalid/disabled/focus-visible 상태 추가
  - forced-colors에서 native 시스템 색상 사용 허용

## 테스트 진행

### 기준선

`pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

- Exit code: 0
- 1 file passed, 6 tests passed

### 회귀 테스트 추가 직후

`pnpm test packages/components/src/inputs/RadioGroup.test.tsx`

- Exit code: 0
- 1 file passed, 8 tests passed
- 브리프의 RED 예상은 Task 1의 reset/state 구현 전 기준이다. 현재 기준 커밋
  `fe2b91e`에 해당 동작과 회귀 수정이 이미 포함되어 있어 새 테스트가 즉시 통과했다.
- 이 Task는 기존 production state 로직을 변경하지 않고 회귀 coverage와 token/CSS만
  추가하므로 production 수정의 RED/GREEN cycle은 발생하지 않았다.

### 커밋 전 최종 검증

다음을 연속 실행했다.

```sh
pnpm --filter @jds/tokens build
pnpm test packages/components/src/inputs/RadioGroup.test.tsx
pnpm --filter @jds/components typecheck
pnpm --filter @jds/components build
```

- Exit code: 0
- token build: 통과
- RadioGroup test: 1 file passed, 8 tests passed
- `@jds/components` typecheck: 통과
- `@jds/components` build: 통과
- 생성 `packages/tokens/dist/tokens.css` 확인:
  - `--jds-size-control-radio-size: 16px;`
  - `--jds-space-radio-target: 4px;`
- `git diff --check`: 통과

## Self-review

- 브리프의 세 상태/reset/keyboard 시나리오와 native label/Context 오류 계약을 모두
  실제 컴포넌트 동작으로 검증하며 dependency mock은 사용하지 않는다.
- 결합된 controlled/prevented 테스트에서도 기존 controlled prop rerender 검증과
  prevented item의 unchecked 검증을 유지해 선행 coverage를 약화하지 않았다.
- native ArrowRight 및 label 동작을 재구현하지 않고 브라우저 radio 동작을 사용한다.
- token source에는 요구한 DTCG dimension entry 두 개만 추가했고 기존 값은 유지했다.
- CSS의 시각 값은 모두 semantic custom property를 사용하며 새 dependency, transition,
  abstraction은 추가하지 않았다.
- Task 2에서 지정한 세 파일만 commit 대상으로 삼았다.

## 우려 사항

- `RadioGroup.css`의 root selector는 `.jds-radio-group`이지만 현재 Task 1의
  `RadioGroup.tsx` root는 이 기본 class를 부여하지 않는다. Item class는 정상이다.
  Task 2 파일 범위에는 component가 없고 Task 3 계획도 CSS import/export만 다루므로,
  후속 통합 전에 root에 consumer `className`을 보존하면서
  `jds-radio-group`을 합성해야 방향과 gap 스타일이 자동 적용된다.

## Review fix (P1)

- `RadioGroup` Root가 항상 `jds-radio-group`을 렌더링하고 consumer `className`을
  함께 보존하도록 수정했다.
- render-level 회귀 테스트는 horizontal Group에 두 class와
  `data-orientation="horizontal"`을 검증한다. 수정 전 기본 class 누락으로 실패했고,
  수정 후 `pnpm test packages/components/src/inputs/RadioGroup.test.tsx` (9/9)와
  `pnpm --filter @jds/components typecheck`가 통과했다.
