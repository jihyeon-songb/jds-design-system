# Outline 기본 디자인 중립화

## 목적

기본 `outline` 버튼을 이미지처럼 흰 배경, 옅은 회색 테두리, 거의 검정
텍스트로 표시한다.

## 변경

- 기존 `color.action.outline` semantic token을 계속 사용한다.
- `color.action.outline.foreground`는 `color.neutral.900`을 참조한다.
- `color.action.outline.border`는 `color.neutral.300`을 참조한다.
- `Button`과 `IconButton`은 CSS 변경 없이 이 공용 token을 소비한다.
- 기본값과 명시적 `variant="outline"` 모두 같은 중립 outline 디자인을
  사용한다. `primary`, `secondary`, `ghost`, `destructive`는 바꾸지 않는다.

## 검증

- token 빌드 테스트에서 생성 CSS가 중립 foreground와 border 값을 내보내는지
  확인한다.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`를 실행한다.
