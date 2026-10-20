# JDSB Pagination 설계

## 목적

`@jdsb/components`에 현재 목록·검색 결과 등의 페이지 위치를 선택하는 token 기반
`Pagination`을 추가한다. 이 컴포넌트는 페이지 선택 UI와 접근성 의미만 제공하고,
URL 변경과 데이터 요청은 소비자가 `onPageChange`에서 처리한다.

## 범위

포함:

- 하나의 현재 페이지를 위한 controlled·uncontrolled `Pagination`
- 이전·다음 button, 현재 페이지, 첫·마지막 페이지와 생략 표기
- native button keyboard 동작, `nav` landmark와 현재 페이지 ARIA 의미
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- URL·라우터·데이터 요청 연동과 link 렌더링
- 페이지 크기 선택, 처음·마지막 페이지 button, 무한 스크롤
- 사용자 지정 visible-count·아이콘 slot·animation·새 의존성·새 token

페이지 수가 일곱 이하이면 모든 페이지를 표시한다. 여덟 이상이면 최대 일곱 개의
page button을 표시한다. 첫 네 페이지에서는 `1 2 3 4 5 … 마지막`, 마지막 네
페이지에서는 `1 … 마지막-4 마지막-3 마지막-2 마지막-1 마지막`, 나머지는
`1 … 현재-1 현재 현재+1 … 마지막`을 표시한다. ellipsis는 button이나 focus 대상이
아닌 텍스트다.

## 공개 API

```tsx
type PaginationValueProps =
  | { page: number; defaultPage?: never }
  | { defaultPage: number; page?: never }

export type PaginationProps = Omit<
  React.ComponentPropsWithoutRef<"nav">,
  "aria-label" | "children"
> &
  PaginationValueProps & {
    "aria-label": string
    totalPages: number
    getPageLabel?: (page: number, current: boolean) => string
    nextLabel?: string
    onPageChange?: (page: number) => void
    previousLabel?: string
  }
```

`totalPages`, `page`, `defaultPage`는 1 이상의 정수여야 한다. 아닐 때는 render에서
`RangeError`를 던진다. controlled `page`는 소비자가 갱신하며, uncontrolled
`defaultPage`는 첫 render에서만 사용한다. 사용자가 다른 페이지를 요청하면
uncontrolled 상태를 먼저 바꾸고 `onPageChange`를 한 번 호출한다. 현재 페이지를
다시 누르거나 disabled 이전·다음 button을 누를 때는 호출하지 않는다.

`aria-label`은 navigation landmark의 접근 가능한 이름으로 필수다. `previousLabel`과
`nextLabel`의 기본값은 각각 `"이전 페이지"`, `"다음 페이지"`다.
`getPageLabel`의 기본값은 현재 페이지면 `"${page} 페이지, 현재 페이지"`, 아니면
`"${page} 페이지"`다. 소비자는 이 세 props로 화면 언어에 맞춘 이름을 제공한다.

## 구조와 접근성

`Pagination`은 `class="jdsb-pagination"`인 native `<nav>` 안에 `<ul>`을 렌더링한다.
각 선택 control은 `<li>` 안의 `type="button"` button이며, 생략 표기는
`aria-hidden="true"`인 `<span>`이다. 현재 page button은 `aria-current="page"`와
`data-state="current"`를, 나머지는 `data-state="idle"`을 가진다. 이전·다음은
각각 `data-direction="previous|next"`와 `data-state="enabled|disabled"`를 가진다.

이전 button은 1페이지에서, 다음 button은 마지막 페이지에서 native `disabled`다.
모든 button은 브라우저의 Tab, Shift+Tab, Space, Enter 동작을 그대로 쓴다. 별도
roving tabindex나 arrow-key handler는 추가하지 않는다. focus 이동은 페이지 선택
이후 소비자의 URL·콘텐츠 갱신 책임이며, Pagination은 button focus를 강제로 옮기지
않는다.

## 스타일과 토큰

별도 token을 추가하지 않는다. root list는 `space.button.gap`으로 항목 간격을 두고,
button은 `color.action.ghost.*`, `color.action.primary.*`, `color.focus.ring`,
`size.control.button.md.height`, `size.focus`, `space.button.inline`,
`radius.control`, `opacity.disabled`만 사용한다. 현재 페이지는 primary background와
foreground로 구분하며, disabled는 native disabled와 opacity로 표시한다. 모든 button은
기존 md control 높이로 최소 36px 조작 영역을 보장한다. focus-visible outline,
forced-colors의 시스템 색, reduced-motion에서 transition을 추가하지 않는 규칙을
기존 Button과 동일하게 적용한다.

## 문서와 검증

Storybook은 기본, controlled, 첫·마지막 페이지, 많은 페이지의 양쪽 생략, 긴
navigation label과 locale label 예시를 제공한다. 기존 preview axe 설정으로 모든
Story를 검사한다.

컴포넌트 테스트는 다음을 검증한다.

- public export, ref와 `nav` native props 전달, 필수 accessible name
- controlled·uncontrolled 페이지 변경과 중복 선택 요청 억제
- 범위 밖·정수가 아닌 numeric props의 `RangeError`
- 첫·마지막의 disabled 이전·다음과 page button의 `aria-current`·accessible label
- 일곱 이하 전체 표시와 여덟 이상 앞·중간·끝 window 및 비상호작용 ellipsis
- native keyboard activation과 사용자 지정 label

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. Storybook에서 Tab/Shift+Tab,
Space/Enter, 브라우저 확대, forced-colors를 수동 확인한다.

## 성공 기준

소비자는 URL·데이터 계층을 결합하지 않고 현재 페이지와 총 페이지 수만 전달해
스크린리더·키보드·포인터에서 동등하게 작동하는 페이지 선택 UI를 사용한다. 현재
페이지, 이전·다음 경계, 큰 범위의 생략 표기와 locale별 accessible label이 일관되게
전달된다.
