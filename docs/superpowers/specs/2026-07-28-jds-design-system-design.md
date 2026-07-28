# JDS 디자인 시스템 설계

이 문서는 JDS의 목표, 패키지 구조, 토큰 체계, 컴포넌트, 접근성 기준, 검증 방법, 배포 정책을 정의한다.

## 개요

JDS(jh design system)는 npm으로 공개 배포하는 React 디자인 시스템이다. 20개의 범용 컴포넌트가 동작과 접근성을 공유한다. 각 서비스는 CSS 변수 기반 토큰을 재정의해 서로 다른 시각 테마를 적용한다.

첫 릴리스는 다음 두 패키지를 공개한다:

- `@jds/tokens`
- `@jds/components`

Storybook은 같은 저장소에서 개발하지만 npm 패키지로 배포하지 않는다. 실제 서비스에서 두 번째 테마가 필요할 때 별도 테마 패키지를 추가한다.

## 목표

JDS는 다음 목표를 충족해야 한다:

- 모든 컴포넌트에 일관된 API, 상태, 키보드 동작, 포커스 관리, 접근성 의미를 적용한다
- 디자이너가 컴포넌트 구현을 수정하지 않고 토큰을 변경하거나 추가할 수 있게 한다
- 컴포넌트를 복제하지 않고 의미 토큰을 재정의해 서비스별 테마를 만든다
- 웹 콘텐츠 접근성 지침(Web Content Accessibility Guidelines, WCAG) 2.2 AA를 기본 기준으로 삼는다
- 독립적으로 설치할 수 있는 React 패키지를 npm에 배포한다

## 제외 범위

첫 릴리스에서는 다음 작업을 제외한다:

- 커머스 전용 컴포넌트
- 자체 Figma 플러그인
- JavaScript 기반 ThemeProvider
- npm 자동 배포
- 시각적 회귀 검사 인프라

npm 자동 배포는 릴리스가 반복될 때 추가한다. 시각적 회귀 검사는 컴포넌트의 기준 디자인이 안정된 뒤 추가한다.

## 저장소 구조

JDS는 pnpm workspace 기반 모노레포로 구성한다:

```text
jh-design-system/
├── packages/
│   ├── tokens/       # @jds/tokens
│   └── components/   # @jds/components
└── apps/
    └── storybook/    # 문서와 컴포넌트 검증
```

각 패키지는 독립적으로 빌드하고 배포한다. 토큰, 컴포넌트, 문서, 테스트는 하나의 workspace에서 함께 검증한다.

## 패키지 구조

### `@jds/tokens`

토큰 패키지는 토큰 원본을 관리하고 다음 파일을 생성한다:

- CSS 사용자 정의 속성
- JavaScript 토큰 모듈
- TypeScript 타입 선언

토큰 원본은 디자인 토큰 커뮤니티 그룹(Design Tokens Community Group, DTCG) 2025.10 JSON 형식을 사용한다. 이 형식을 지원하는 디자인 도구와 토큰 파일을 교환할 수 있다.

### `@jds/components`

컴포넌트 패키지는 React API, 상태, 접근성 동작, JDS 기본 스타일을 관리한다. 모든 스타일은 의미 토큰을 사용한다. 서비스에 종속된 색상, 간격, 글꼴, 그림자, 모서리 반경을 컴포넌트에 직접 입력하지 않는다.

네이티브 HTML이 필요한 동작을 제공하면 그대로 사용한다. 네이티브 HTML만으로 구현하기 어려운 위젯은 Radix UI를 사용해 WAI-ARIA 의미, 키보드 탐색, 포커스를 관리한다. JDS는 Radix UI 위에 자체 API, 토큰, 기본 스타일, 문서, 테스트를 제공한다.

shadcn/ui에서는 조합 가능한 API와 문서 구성을 참고한다. shadcn/ui를 런타임 의존성이나 배포 방식으로 사용하지 않는다.

React와 Radix UI는 peer dependency로 선언해 소비 서비스가 같은 런타임을 중복 설치하지 않게 한다.

## 토큰 체계

토큰은 세 단계로 구성한다:

1. Primitive 토큰은 `blue.600`, `space.4`, `radius.2` 같은 원시 값을 정의한다
2. Semantic 토큰은 `color.action.primary`, `color.surface.default`, `radius.control` 같은 사용 목적을 정의한다
3. Component 토큰은 `button.background`처럼 한 컴포넌트만 필요한 예외 값을 정의한다

컴포넌트는 Semantic 토큰을 우선 사용한다. 테마가 값을 지정하지 않은 Semantic 토큰은 기본 테마의 값을 상속한다. 한 컴포넌트에 독립적인 값이 필요할 때만 Component 토큰을 추가한다.

토큰 변경은 다음 순서로 적용한다:

```text
Figma 또는 토큰 편집 도구
        ↓
DTCG *.tokens.json
        ↓ 검증과 빌드
@jds/tokens
        ↓
@jds/components
        ↓
서비스 테마 CSS 재정의
```

토큰 빌드는 잘못된 타입, 존재하지 않는 별칭, 순환 참조, 중복된 출력 이름을 감지하면 실패한다. 일부 값만 정의한 테마는 나머지 값을 기본 테마에서 상속한다.

서비스는 CSS import 또는 `data-theme` 속성으로 테마를 활성화한다. 런타임 JavaScript를 사용하지 않으므로 서버 렌더링에서도 같은 테마를 적용할 수 있다.

## 컴포넌트 20개

첫 릴리스는 다음 범용 컴포넌트를 포함한다.

### 입력

1. Input
2. Textarea
3. Select
4. Checkbox
5. RadioGroup
6. Switch
7. Label
8. FormField

### 동작과 정보

9. Button
10. IconButton
11. Alert
12. Badge
13. Avatar

### 탐색과 오버레이

14. Tabs
15. Accordion
16. Dialog
17. Drawer
18. Tooltip
19. Toast
20. Pagination

## 컴포넌트 API 규칙

모든 컴포넌트는 다음 API 규칙을 따른다:

- ref와 적용 가능한 네이티브 HTML 속성을 전달한다
- 상태를 외부에서 제어할 필요가 있는 컴포넌트는 controlled 방식과 uncontrolled 방식을 지원한다
- 시각 상태와 상호작용 상태를 안정적인 `data-state` 속성으로 노출한다
- variant와 size는 임의 문자열이 아닌 문서화된 TypeScript 유니온으로 제한한다
- 필수 접근성 정보는 가능한 범위에서 TypeScript로 강제한다
- `IconButton`은 접근 가능한 이름을 필수로 받는다
- 외부 API가 Radix UI의 내부 구현에 직접 의존하지 않게 감싼다

## 접근성 기준

JDS는 WCAG 2.2 AA를 최소 기준으로 삼고, 해당하는 WAI-ARIA Authoring Practices 패턴을 적용한다:

- 모든 상호작용 컴포넌트를 키보드로 조작할 수 있어야 한다
- 모든 상호작용 컴포넌트에 보이는 포커스 표시를 제공한다
- 포커스 순서를 논리적으로 유지하고 포커스가 오버레이나 고정 콘텐츠에 완전히 가려지지 않게 한다
- 포커스 표시는 최소 2 CSS px 두께와 비포커스 상태 대비 3:1 이상의 시각 차이를 갖는다
- `FormField`는 label, 설명, 필수 여부, 오류 메시지를 입력 요소와 연결한다
- `Dialog`와 `Drawer`는 열릴 때 내부로 포커스를 이동하고 모달 포커스를 내부에 유지한다
- 안전하게 닫을 수 있는 `Dialog`와 `Drawer`는 Escape 키를 지원하고 닫힌 뒤 트리거로 포커스를 돌려보낸다
- `Toast`와 `Alert`는 포커스를 강제로 옮기지 않고 필요한 상태 변경을 보조 기술에 알린다
- `Tabs`, `Accordion`, `RadioGroup`과 복합 위젯은 WAI-ARIA 키보드 패턴을 따른다
- 색상만으로 상태와 의미를 전달하지 않는다
- 텍스트, 아이콘, 컨트롤 경계, 포커스 표시가 해당 명도 대비 기준을 충족해야 한다
- 상호작용 대상은 WCAG 2.2 AA의 최소 크기인 24 x 24 CSS px을 충족해야 한다
- `Button`과 `IconButton`의 기본 상호작용 영역은 최소 44 x 44 CSS px로 설정한다
- hover에서만 확인할 수 있는 정보나 동작을 만들지 않는다
- 키보드와 터치 환경에서 같은 기능을 제공한다
- 브라우저 확대, `prefers-reduced-motion`, forced-colors 모드, 고대비 설정을 존중한다
- ARIA로 의미를 다시 만들기 전에 네이티브 HTML 요소를 우선 사용한다

## 문서

Storybook은 각 컴포넌트에 다음 내용을 제공한다:

- 목적과 사용 조건
- API와 조합 방법
- 해당하는 기본, hover, focus, active, disabled, invalid, loading 상태
- 테마 적용 결과
- 접근 가능한 이름과 label 요구사항
- 키보드 조작표
- 짧은 콘텐츠, 긴 콘텐츠, 오류 상태 예시

Storybook의 공식 접근성 addon으로 렌더링된 모든 Story에 axe 검사를 실행한다. 접근성 위반을 발견하면 해당 Story 테스트를 실패 처리한다.

## 검증

각 컴포넌트는 다음 항목을 검증한다:

- 공개 props와 생성된 토큰 타입의 TypeScript 검사
- 상태 변경과 이벤트 처리를 확인하는 컴포넌트 테스트
- 복합 위젯의 키보드 탐색과 포커스를 확인하는 브라우저 테스트
- 모든 Storybook Story에 대한 axe 자동 검사
- 모든 상호작용 컴포넌트의 수동 키보드 검사
- `Dialog`, `Drawer`, `Tabs`, `Select`, `Tooltip`, `Toast`, `RadioGroup`, `Accordion`의 수동 스크린리더 검사
- 브라우저 확대, 모션 감소, forced-colors 설정의 수동 검사

자동 검사는 수동 접근성 검사를 대체하지 않는다. 릴리스 전에 타입 검사, 테스트, 프로덕션 빌드를 모두 통과해야 한다.

## 배포와 버전 정책

두 npm 패키지는 공개 배포하며 같은 릴리스 주기를 사용한다. 첫 버전은 모든 검증이 끝난 뒤 명시적인 수동 명령으로 배포한다.

버전은 다음 규칙으로 변경한다:

- 토큰 추가와 하위 호환 컴포넌트 기능 추가는 minor 버전을 올린다
- API를 바꾸지 않는 토큰 값 수정과 동작 수정은 patch 버전을 올린다
- 토큰 제거 또는 이름 변경, 컴포넌트 API 호환성 변경, 기존 상호작용 동작 변경은 major 버전을 올린다

npm scope는 승인된 패키지 이름에 맞춰 `@jds`를 사용한다. npm에서 해당 scope를 소유할 수 없으면 package scope만 사용자 계정이나 조직 이름으로 바꾸고 패키지 구조와 API는 유지한다.

## 참고 자료

- [웹 콘텐츠 접근성 지침 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [DTCG Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/)
- [Radix Primitives 접근성 지침](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/docs/components)
- [Carbon Design System 접근성 검사](https://carbondesignsystem.com/components/button/accessibility/)
- [GOV.UK Design System 접근성 전략](https://design-system.service.gov.uk/accessibility/accessibility-strategy/)
- [Storybook 접근성 검사](https://storybook.js.org/docs/writing-tests/accessibility-testing)
