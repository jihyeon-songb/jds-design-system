import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "@jdsb/components"

const meta = {
  title: "Feedback/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = { args: { children: "초안" } }
export const Info: Story = { args: { children: "업데이트됨", variant: "info" } }
export const Success: Story = { args: { children: "배포 완료", variant: "success" } }
export const Warning: Story = { args: { children: "확인 필요", variant: "warning" } }
export const Error: Story = { args: { children: "실패", variant: "error" } }
