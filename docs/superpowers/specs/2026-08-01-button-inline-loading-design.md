# JDSB Button 인라인 로딩 설계

## 목적

`Button`의 loading 상태를 중앙 스피너만 보이는 방식에서, 레이블 앞에 스피너와
레이블이 함께 보이는 방식으로 바꾼다. 참조 이미지의 outline과 filled 버튼 모두에
같은 구성을 적용한다.

## 범위

- `loading`일 때 spinner를 레이블 앞에 인라인으로 렌더링한다.
- 레이블은 보이는 상태를 유지하고 start/end 아이콘만 숨긴다.
- 기존 `disabled`, `aria-busy`, 접근 가능한 이름, reduced motion, forced-colors
  동작을 유지한다.
- 인라인 spinner는 버튼 콘텐츠 폭에 포함되며 loading 상태의 버튼 폭은 이를 반영한다.
- 새 공개 prop, 토큰, 의존성은 추가하지 않는다.

## 구현

`Button.tsx`의 spinner는 label 앞에 두고, 기존 `loading` 분기로 렌더링한다.
`Button.css`에서는 spinner의 absolute positioning을 제거하고 `currentColor`를
사용해 모든 variant의 전경색을 따른다. loading 상태의 label opacity 규칙은
제거하고 icon slot에만 적용한다.

## 검증

컴포넌트 테스트는 loading 버튼의 spinner가 label보다 앞에 있고 label이 DOM에
유지되는지 검증한다. Storybook의 Loading story는 기존대로 loading 상태를
문서화한다. typecheck, test, build, lint와 Storybook build를 실행한다.
