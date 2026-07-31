import type { Meta, StoryObj } from "@storybook/react-vite"
import { Textarea } from "@jds/components"

const meta = {
  title: "Inputs/Textarea",
  component: Textarea,
  args: { "aria-label": "내용", defaultValue: "" }
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithCounter: Story = {
  args: { maxLength: 100, defaultValue: "소개를 입력하세요" }
}
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "수정할 수 없습니다" }
}
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "읽기 전용 내용" }
}
export const Invalid: Story = { args: { invalid: true } }
export const Sizes: Story = {
  render: () => (
    <div>
      <Textarea aria-label="작은 내용" size="sm" defaultValue="작은 크기" />
      <Textarea aria-label="기본 내용" size="md" defaultValue="기본 크기" />
      <Textarea aria-label="큰 내용" size="lg" defaultValue="큰 크기" />
    </div>
  )
}
export const LongContent: Story = {
  args: { defaultValue: "첫 번째 줄입니다.\n두 번째 줄입니다.\n세 번째 줄입니다." }
}
