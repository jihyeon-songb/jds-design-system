import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "@jdsb/components"

const meta = {
  title: "Inputs/Input",
  component: Input,
  args: { "aria-label": "입력값", defaultValue: "" }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, defaultValue: "수정할 수 없습니다" } }
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "읽기 전용 값" } }
export const Invalid: Story = { args: { invalid: true } }
export const Password: Story = { args: { type: "password", defaultValue: "secret" } }
export const LongValue: Story = {
  args: { defaultValue: "긴 입력값도 native input에서 그대로 표시됩니다" }
}
export const Sizes: Story = {
  render: () => (
    <div>
      <Input aria-label="작은 입력값" size="sm" defaultValue="작은 크기" />
      <Input aria-label="기본 입력값" size="md" defaultValue="기본 크기" />
      <Input aria-label="큰 입력값" size="lg" defaultValue="큰 크기" />
      <Input aria-label="가장 큰 입력값" size="xl" defaultValue="가장 큰 크기" />
    </div>
  )
}
