# 모노크롬 B2B 시각 시스템 설계

## 목표

JDSB의 모든 컴포넌트에 차분하고 조밀한 관리 도구의 시각 언어를 적용한다. 공개 React API와 키보드 동작은 변경하지 않는다.

## 시각 원칙

- 흰색 표면, 검정 본문, 중립 회색 경계와 보조 정보를 기본으로 한다.
- 검정은 주요 동작과 강한 정보 위계에만 사용한다. 장식용 색상과 과도한 강조는 사용하지 않는다.
- 기본 컨트롤은 32px 높이와 촘촘한 간격을 기준으로 한다. 큰 크기는 필요한 곳에서만 유지한다.
- 카드, 테이블, 오버레이, 입력 컨트롤은 동일한 표면·경계·반경 규칙을 공유한다.
- 오류·경고·성공은 색만으로 의미를 전달하지 않는다. 기존의 텍스트와 아이콘 의미를 유지하고, 상태색은 필요한 접근성 신호로만 제한한다.

## 토큰

`packages/tokens/src/jdsb.tokens.json`에서 기존 blue 중심의 action·focus 토큰을 검정/흰색/중립 회색 역할 토큰으로 재정의한다.

- `color.action.primary`: 검정 배경과 흰색 전경
- `color.action.secondary`, `outline`, `ghost`: 흰색 또는 옅은 회색 표면, 검정 전경, 중립 회색 경계
- `color.field`, `card`, `progress`, `skeleton`, `focus`: 같은 중립 색상 단계로 연결
- 기존 오류 토큰은 의미 상태용으로 보존한다. 정보·성공·경고는 파란색을 재사용하지 않고 중립 표면과 명시적 텍스트로 구분한다.
- 공통 `radius.control`과 간격 토큰은 조밀한 4px 기반 리듬을 반영한다. 컴포넌트 CSS에 새 시각 값을 직접 넣지 않는다.

## 컴포넌트 적용

모든 CSS는 생성된 `--jdsb-*` 토큰만 사용한다.

- **동작·입력**: Button, IconButton, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Combobox와 Field의 배경, 테두리, hover, focus를 동일한 대비 계층으로 맞춘다.
- **정보·레이아웃**: Card, Table, Alert, Badge, Avatar, Progress, Skeleton, Separator가 표면과 보조 텍스트의 위계를 공유한다.
- **탐색·오버레이**: Tabs, Accordion, Breadcrumb, Pagination, Dialog, Drawer, DropdownMenu, Popover, Tooltip, Toast에 같은 경계, 반경, 간격, 선택 상태 규칙을 적용한다.
- 어떤 컴포넌트도 새로운 variant, size, prop을 추가하지 않는다.

## 접근성과 상호작용

- 포커스 링은 2px 이상이며 비포커스 상태와 3:1 이상 시각적으로 구분한다.
- 텍스트, 컨트롤 경계, 아이콘은 WCAG 2.2 AA 대비 기준을 충족한다.
- hover, disabled, invalid, selected 상태는 색상 외의 기존 상태 속성·텍스트·아이콘 의미를 보존한다.
- 키보드 동작, 포커스 이동, ARIA 의미, reduced-motion, forced-colors 동작은 회귀시키지 않는다.

## 검증

- 토큰 빌드와 TypeScript 검사로 생성 토큰과 컴포넌트 사용을 검증한다.
- 토큰 또는 상태 스타일을 바꾸는 각 컴포넌트의 기존 테스트와 Storybook axe 검사를 실행한다.
- Storybook에서 Button, Field, Table, Dialog를 기준 샘플로 확인해 표면·간격·포커스의 일관성을 수동 점검한다.

## 제외 범위

- 새 테마 패키지, ThemeProvider, 외부 UI 라이브러리, 공개 API 변경, 시각 회귀 테스트 인프라는 추가하지 않는다.
