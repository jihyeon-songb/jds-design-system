import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jds/components"

const meta = {
  title: "Forms/Field",
  component: Field,
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Field>
      <FieldTitle>결제 수단</FieldTitle>
      <FieldDescription>모든 거래는 안전하게 암호화됩니다.</FieldDescription>
    </Field>
  ),
}

export const SelectField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="country">국가</FieldLabel>
      <Select defaultValue="kr">
        <SelectTrigger id="country">
          <SelectValue placeholder="국가 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="kr">대한민국</SelectItem>
          <SelectItem value="jp">일본</SelectItem>
          <SelectItem value="us">미국</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
}

export const CheckboxField: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="notifications" />
      <FieldContent>
        <FieldLabel htmlFor="notifications">알림 활성화</FieldLabel>
        <FieldDescription>언제든 변경할 수 있습니다.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const InputField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">이메일</FieldLabel>
      <Input aria-describedby="email-description" id="email" name="email" type="email" />
      <FieldDescription id="email-description">알림 수신에 사용합니다.</FieldDescription>
    </Field>
  ),
}
