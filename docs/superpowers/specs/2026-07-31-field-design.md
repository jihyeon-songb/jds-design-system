# JDS Field와 Label 설계

## 목적

`Checkbox`를 포함한 입력 control의 배치, label, 설명, 오류 메시지를 control 자체와
분리한다. `Field` 계열은 조합 가능한 구조와 접근성 연결을 제공하고, `Checkbox`,
`Input`, `Textarea`, `Select`, 이후 `RadioGroup`, `Switch`는 각자의 native·복합 위젯
동작만 책임진다.

## 구성과 책임

```tsx
<FieldGroup>
  <Field orientation="horizontal">
    <Checkbox id="notifications" />
    <FieldContent>
      <FieldLabel htmlFor="notifications">알림 활성화</FieldLabel>
      <FieldDescription>언제든 변경할 수 있습니다.</FieldDescription>
    </FieldContent>
  </Field>
</FieldGroup>
```

- `Label`: Field 밖에서 독립적으로 쓰는 native `<label>`이다.
- `FieldGroup`: 관련 Field를 세로로 배치하는 의미 없는 `<div>` 묶음이다.
- `Field`: 하나의 control과 그 텍스트를 묶고 `orientation="vertical" | "horizontal"`을
  노출하는 `<div>`다. 기본은 `vertical`이다.
- `FieldContent`: title, label, 설명, 오류를 묶는 `<div>`다.
- `FieldLabel`: control을 연결하는 native `<label>`이다.
- `FieldTitle`: control과 연결하지 않는 제목 텍스트 `<div>`다. FieldLabel과 동시에 쓰면
  title은 보조 제목이며 control의 접근 가능한 이름은 FieldLabel이 제공한다.
- `FieldDescription`: control의 보조 설명 `<div>`다.
- `FieldError`: control의 오류 설명 `<div>`다. 오류가 있을 때만 소비자가 렌더링하며
  `role="alert"`는 사용하지 않는다. 포커스를 이동하지 않는다.

`Field`는 `Checkbox`의 checked, disabled, invalid 상태를 제어하거나 복제하지 않는다.
control은 자신의 props와 ID 연결을 직접 관리한다.

## 공개 API

```ts
export type LabelProps = React.ComponentPropsWithoutRef<"label">
export type FieldGroupProps = React.ComponentPropsWithoutRef<"div">

export type FieldProps = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "vertical" | "horizontal"
}

export type FieldContentProps = React.ComponentPropsWithoutRef<"div">
export type FieldLabelProps = React.ComponentPropsWithoutRef<"label">
export type FieldTitleProps = React.ComponentPropsWithoutRef<"div">
export type FieldDescriptionProps = React.ComponentPropsWithoutRef<"div">
export type FieldErrorProps = React.ComponentPropsWithoutRef<"div">
```

모든 컴포넌트는 ref와 native 속성을 전달한다. `Field`는 `data-orientation`만 추가하며,
`FieldGroup`, `FieldContent`, `FieldTitle`, `FieldDescription`, `FieldError`는 별도 상태나
props를 추가하지 않는다.

## 접근성 연결

명시적 `htmlFor`/`id` 연결은 가장 예측 가능하므로 지원한다. `FieldLabel`의 `htmlFor`는
자동 생성하지 않으며, control과 label이 같은 Field 안에 있어도 소비자는 명시적 연결 또는
label wrapping 중 하나를 제공해야 한다.

`FieldDescription`과 `FieldError`도 자동으로 control을 찾거나 props를 주입하지 않는다.
소비자는 description/error에 `id`를 지정하고 control의 기존 `aria-describedby`에 그 ID를
명시적으로 넣는다. `FieldError`는 control에 `aria-invalid="true"`를 강제하지 않는다.
invalid는 control의 책임이다.

```tsx
<Field>
  <Input aria-describedby="email-description email-error" aria-invalid="true" id="email" />
  <FieldContent>
    <FieldLabel htmlFor="email">이메일</FieldLabel>
    <FieldDescription id="email-description">알림 수신에 사용합니다.</FieldDescription>
    <FieldError id="email-error">올바른 이메일 주소를 입력하세요.</FieldError>
  </FieldContent>
</Field>
```

이 명시적 연결은 간단한 native 조합 API를 유지하고 여러 control을 가진 Field에도 안전하다.
자동 연결은 실제 사용성이 부족하다고 확인될 때 `FieldControl` 같은 별도 API로 검토한다.

## 스타일과 토큰

각 컴포넌트는 semantic token만 사용한다. 첫 구현은 기존 `space.input.inline`,
`space.textarea.counter`, `opacity.disabled`, `color.field.foreground`,
`color.field.invalid-border`를 재사용하고, 실제 부족한 간격만 새 semantic token으로
추가한다. Field는 horizontal일 때 checkbox와 content를 가로로, vertical일 때 세로로
배치한다. focus, checked, disabled의 시각 상태는 control CSS가 담당한다.

`data-disabled`는 소비자가 Field에 전달해 문맥 스타일에 사용할 수 있지만, Field는 control의
disabled 속성을 자동으로 바꾸지 않는다. 향후 control 상태를 자동 상속해야 할 실제 요구가
생길 때만 Context 도입을 검토한다.

## 검증

- 모든 컴포넌트의 ref와 native 속성 전달
- Field orientation의 `data-orientation`과 token CSS hook
- `htmlFor`/`id`로 연결된 label의 접근 가능한 이름
- 소비자가 지정한 `aria-describedby`와 Description/Error ID의 명시적 연결
- FieldError가 control의 `aria-invalid`를 덮어쓰지 않음
- horizontal Checkbox, 설명 포함 Checkbox, disabled 문맥, 긴 텍스트, Input과 Textarea
  조합 Story 및 axe 검사

각 구현 뒤 `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`,
`pnpm --filter @jds/storybook build`를 실행한다. 키보드, 브라우저 확대, forced-colors에서
label 클릭과 설명·오류 읽기를 수동 확인한다.

## 범위 제외

- control props를 자동 주입하는 Context
- Field 내부 control 자동 탐색 또는 여러 control의 자동 ARIA 연결
- RadioGroup/Select 전용 label 동작
- validation 실행, 오류 상태 계산, 폼 제출 처리

이 범위는 조합 API를 작고 예측 가능하게 유지한다. validation과 control 상태는 소비자 또는
각 control이 관리한다.
