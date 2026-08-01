# JDS Switch 외형 개선 설계

## 목표

기존 native checkbox 기반 Switch의 API와 접근성 동작은 바꾸지 않고, track과 thumb의
비례를 정돈해 더 선명하고 완성도 높은 on/off 형태를 만든다.

## 변경

- track과 thumb는 각 크기에 맞는 완전한 pill 형태로 유지한다.
- off track에는 `color.field.border`의 1px 테두리를 적용하고, thumb는 field background를
  사용한다. 따라서 흰 배경에서도 두 요소가 또렷하게 분리된다.
- checked, hover, disabled, invalid, focus-visible 색상과 우선순위는 기존 semantic token을
  유지한다.
- track 배경과 thumb 위치는 기존 `duration.spinner` 토큰으로 전환하고,
  `prefers-reduced-motion`에서는 전환을 끈다.

## 비변경 범위와 검증

React API, 크기 토큰, native form 동작, keyboard·label 조작, ARIA와 Storybook 구조는
변경하지 않는다. CSS 변경이므로 기존 Switch 단위 테스트와 typecheck, test, build, lint를
실행한다.
