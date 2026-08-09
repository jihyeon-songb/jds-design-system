# JDSB Switch 외형 개선 설계

## 목표

기존 native checkbox 기반 Switch의 API와 접근성 동작은 바꾸지 않고, track과 thumb의
비례를 정돈해 더 선명하고 완성도 높은 on/off 형태를 만든다.

## 변경

- track과 thumb는 각 크기에 맞는 완전한 pill 형태로 유지한다.
- 레퍼런스 비율에 맞춰 track은 `24×14px`(sm), `34×18px`(md), `38×22px`(lg),
  `42×26px`(xl)로 하고 thumb는 기존 크기를 유지한다. `thumb-inset`은 `1px`로
  통일해 thumb가 track을 더 채우게 한다. sm의 `thumb-travel`은 track 안에서 이동하도록
  `10px`로 조정하고, 나머지 크기는 `16px`를 유지한다.
- off track은 `color.field.border`를 채우는 경계선 없는 연한 회색 면으로 두고, thumb는
  field background를 사용한다. 레퍼런스처럼 부드럽고 단순한 대비를 유지한다.
- checked, hover, disabled, invalid, focus-visible 색상과 우선순위는 기존 semantic token을
  유지한다.
- track 배경과 thumb 위치는 기존 `duration.spinner` 토큰으로 전환하고,
  `prefers-reduced-motion`에서는 전환을 끈다.

## 비변경 범위와 검증

React API, 크기 토큰, native form 동작, keyboard·label 조작, ARIA와 Storybook 구조는
변경하지 않는다. CSS 변경이므로 기존 Switch 단위 테스트와 typecheck, test, build, lint를
실행한다.
