import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Textarea,
} from "@jds/components"

const meta = {
  title: "Forms/Field",
  component: Field,
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <input id="notifications" type="checkbox" />
      <FieldContent>
        <FieldLabel htmlFor="notifications">알림 활성화</FieldLabel>
      </FieldContent>
    </Field>
  ),
}

export const Description: Story = {
  render: () => (
    <Field orientation="horizontal">
      <input id="updates" type="checkbox" />
      <FieldContent>
        <FieldLabel htmlFor="updates">업데이트 소식 받기</FieldLabel>
        <FieldDescription id="updates-description">언제든 변경할 수 있습니다.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const DisabledContext: Story = {
  render: () => (
    <Field data-disabled orientation="horizontal">
      <input disabled id="disabled-notifications" type="checkbox" />
      <FieldContent>
        <FieldLabel htmlFor="disabled-notifications">알림 활성화</FieldLabel>
        <FieldDescription>현재 사용할 수 없습니다.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const Invalid: Story = {
  render: () => (
    <Field>
      <Input aria-describedby="email-description email-error" aria-invalid="true" id="email" />
      <FieldContent>
        <FieldLabel htmlFor="email">이메일</FieldLabel>
        <FieldDescription id="email-description">알림 수신에 사용합니다.</FieldDescription>
        <FieldError id="email-error">올바른 이메일 주소를 입력하세요.</FieldError>
      </FieldContent>
    </Field>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Field orientation="horizontal">
      <input id="long-content" type="checkbox" />
      <FieldContent>
        <FieldLabel htmlFor="long-content">
          중요한 서비스 변경 사항과 보안 관련 공지를 포함한 긴 알림 수신 설정
        </FieldLabel>
        <FieldDescription>설명도 여러 줄로 자연스럽게 표시됩니다.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const InputField: Story = {
  render: () => (
    <Field>
      <Input id="name" />
      <FieldContent>
        <FieldLabel htmlFor="name">이름</FieldLabel>
      </FieldContent>
    </Field>
  ),
}

export const TextareaField: Story = {
  render: () => (
    <Field>
      <Textarea id="message" />
      <FieldContent>
        <FieldLabel htmlFor="message">메시지</FieldLabel>
        <FieldDescription>문의 내용을 자세히 입력하세요.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}
