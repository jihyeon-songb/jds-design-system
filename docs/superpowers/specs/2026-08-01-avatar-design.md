# JDSB Avatar 설계

## 목적

`@jdsb/components`에 사람·계정 등 엔터티를 짧게 식별하는 token 기반의 비상호작용
`Avatar`를 추가한다. 이미지가 있을 때는 이미지를, 이미지가 없거나 로드에 실패할 때는
이름의 첫 글자를 표시해 네트워크 오류에도 식별 정보를 유지한다.

## 범위

포함:

- `src`, `alt`, `name`, `size`를 받는 단일 `Avatar`
- `sm`, `md`, `lg`, `xl` 크기와 기본값 `md`
- 이미지 없음·로드 실패 시 `name`의 첫 Unicode 문자 fallback
- token CSS, 컴포넌트 테스트, Storybook Story와 axe 검사

제외:

- 클릭, 링크, 메뉴, 업로드 같은 상호작용
- status badge, group/stack, shape·variant, 사용자 지정 fallback JSX
- 이미지 로딩 spinner, retry, cache, 최적화·변환과 외부 이미지 라이브러리
- 기본 실루엣 아이콘과 외부 UI 라이브러리

Avatar를 조작해야 하면 Button 또는 링크로 감싸고, 상태 badge와 group은 실제 사용처가
필요로 할 때 별도 조합 컴포넌트로 설계한다. native 이미지 로딩과 브라우저 cache가
현재 요구를 충족하므로 별도 로더를 만들지 않는다.

## 공개 API

```ts
export type AvatarSize = "sm" | "md" | "lg" | "xl"

export type AvatarProps = Omit<React.ComponentPropsWithoutRef<"span">, "children"> & {
  alt?: string
  name?: string
  size?: AvatarSize
  src?: string
}
```

`Avatar` root는 native `<span>` 하나이며, ref와 적용 가능한 native span 속성을
전달한다. `size` 기본값은 `"md"`이고 root는 `data-size`를 노출한다. `children`은
컴포넌트의 표시 우선순위를 흔들지 않도록 받지 않는다.

표시 우선순위는 다음과 같다.

1. 비어 있지 않은 `src`가 있고 해당 이미지가 아직 실패하지 않았으면 `<img>`를 표시한다.
2. 이미지가 없거나 해당 `src`의 로드가 실패하면 `name`의 첫 Unicode 문자를 표시한다.
3. `name`도 비어 있으면 빈 원형만 표시한다.

실패한 이미지의 `src`는 상태로 보관한다. 이후 `src`가 다른 값으로 바뀌면 새 이미지를
다시 렌더링하므로, `useEffect`로 실패 상태를 별도로 초기화하지 않는다. 이미지의
`alt`는 `alt ?? name ?? ""`으로 정한다. 따라서 소비자가 `alt`를 제공하면 그것이
우선하며, 이름만 제공한 경우 이름이 이미지의 대체 텍스트가 되고, 둘 다 없으면 이미지는
장식적이다. fallback 문자는 `Array.from(name)[0]`로 구해 surrogate pair도 보존한다.

```tsx
<Avatar alt="김지현" name="김지현" src="/profiles/jihyeon.png" />
<Avatar name="김지현" size="lg" />
<Avatar aria-label="알 수 없는 사용자" />
```

## 접근성

- Avatar는 상호작용하지 않으며 Tab 순서, keyboard handler, focus style을 추가하지 않는다.
- 이미지는 위 규칙의 `alt`를 사용한다. fallback 문자는 `aria-hidden="true"`로 감추고,
  이름이 있을 때 root에는 `role="img"`와 `aria-label={name}`을 제공한다.
- 소비자가 root에 `aria-label`, `aria-labelledby`, `role`을 제공하면 native span 속성
  전달 규칙에 따라 그 값을 유지한다. 이 경우 자동 fallback 의미는 소비자 값으로 대체한다.
- 이름 없이 fallback도 없는 Avatar는 의미 없는 장식 요소다. 해당 상태에 의미가 필요하면
  소비자가 root의 aria 속성을 제공한다.
- forced-colors에서는 시스템 색을 허용하며 animation과 transition은 추가하지 않는다.

## 토큰과 스타일

기존 primitive 및 semantic token을 참조하는 다음 token을
`packages/tokens/src/jdsb.tokens.json`에 추가한다.

- `color.avatar.background` → `color.action.secondary.background`
- `color.avatar.foreground` → `color.action.secondary.foreground`
- `size.avatar.{sm,md,lg,xl}` → 기존 Button control 높이와 같은 값
- `radius.avatar` → 완전한 원형을 위한 radius token

새 primitive 색이나 하드코딩한 CSS 시각 값은 추가하지 않는다. `Avatar` CSS는 위 변수만
사용해 정사각형 inline-flex root, 원형 clipping, 가운데 정렬, overflow hidden을 적용한다.
이미지는 root 크기를 채우며 aspect ratio를 유지하도록 `object-fit: cover`를 사용한다.
fallback에는 `font: inherit`만 적용한다. root와 image의 크기 선언은 avatar size token을
사용하고, forced-colors에서는 `forced-color-adjust: auto`를 둔다.

## 문서와 검증

Storybook은 다음 Story를 제공한다.

- 이미지가 보이는 기본 Avatar
- 이미지 없는 이름 fallback
- 이미지 오류 fallback
- `sm`, `md`, `lg`, `xl` 크기
- 이름과 이미지가 모두 없는 장식 Avatar

각 Story는 기존 preview의 axe error 설정으로 검사한다. Story는 Avatar가 식별용 표현
요소이며, 상호작용이 필요하면 Button 또는 링크로 감싸야 한다는 사용 조건을 설명한다.

컴포넌트 테스트는 다음을 검증한다.

- 기본 `md` size와 `data-size`, native span props·ref 전달, package entry export
- `src`가 있으면 올바른 alt를 가진 이미지 렌더링
- `src`가 없을 때 name의 첫 Unicode 문자 fallback 및 fallback의 접근 가능한 이름
- image error 뒤 name fallback, error를 낸 `src`와 다른 `src`로 교체했을 때 새 이미지 렌더링
- 이름도 없는 빈 Avatar의 장식 동작과 소비자가 전달한 aria 의미 보존
- 네 가지 size 렌더링

구현 후 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jdsb/storybook build`를 실행한다. Storybook에서 이미지 실패 fallback,
200% 확대, forced-colors를 수동 확인한다.

## 성공 기준

소비자는 새 의존성이나 상호작용 API 없이 토큰으로 크기와 테마를 제어하며 이미지 또는
이름 fallback으로 엔터티를 식별할 수 있다. 이미지 실패는 의미 있는 fallback으로
복구하고, src 변경은 새 이미지 재시도를 허용하며, Avatar는 native HTML 의미와 전달된
속성을 보존한다.
