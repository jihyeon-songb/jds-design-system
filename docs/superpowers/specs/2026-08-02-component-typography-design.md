# 컴포넌트 텍스트 14px 통일

## 목적

모든 JDS 컴포넌트 텍스트를 14px로 통일하되, 소비 서비스의 일반 본문과
전역 문서 typography는 바꾸지 않는다.

## 변경

- `typography.body.font-size` semantic token을 `14px`로 추가한다.
- `@jds/components`의 `index.css`에서 `jds-` 접두사의 클래스에만 이 token을
  한 번 적용한다.
- 컴포넌트 안의 label, 입력값, 버튼 텍스트, 오버레이와 포털 콘텐츠는
  CSS 상속으로 14px을 사용한다.
- 소비자가 제공한 더 구체적인 selector 또는 inline style은 기존 CSS cascade에
  따라 계속 재정의할 수 있다.

## 제외

- `:root`, `html`, `body` 또는 소비 서비스의 일반 콘텐츠에 전역 font-size를
  설정하지 않는다.
- 컴포넌트별 중복 font-size 선언, 새 런타임 API, 새 의존성은 추가하지 않는다.

## 검증

- token 빌드 테스트에서 typography token CSS 변수를 확인한다.
- 컴포넌트 stylesheet 검사로 JDS 범위 규칙이 token을 사용하는지 확인한다.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`를 실행한다.
