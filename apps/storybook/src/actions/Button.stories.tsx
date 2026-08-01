import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@jds/components"

const meta = {
  title: "Actions/Button",
  component: Button,
  args: { children: "저장", type: "button" }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Primary: Story = { args: { variant: "primary" } }
export const Variants: Story = {
  render: () => <div><Button variant="primary">저장</Button><Button variant="secondary">미리 보기</Button><Button variant="outline">취소</Button><Button variant="ghost">나중에</Button><Button variant="destructive">삭제</Button></div>
}
export const Sizes: Story = {
  render: () => <div><Button size="sm">작게</Button><Button size="md">기본</Button><Button size="lg">크게</Button><Button size="xl">가장 크게</Button></div>
}
export const WithIcons: Story = {
  args: { startIcon: <span>←</span>, endIcon: <span>→</span>, children: "계속" }
}
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { loading: true, children: "저장 중" } }
export const LongLabel: Story = { args: { children: "이 변경 사항을 저장하고 다음 단계로 계속하기" } }
