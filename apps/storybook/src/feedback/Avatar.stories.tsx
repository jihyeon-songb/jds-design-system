import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar } from "@jdsb/components"

const meta = {
  title: "Feedback/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          "Avatar는 사람이나 계정 등의 엔터티를 나타내는 비상호작용 표현 요소입니다. 상호작용이 필요하면 Button 또는 링크로 감싸세요.",
      },
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Image: Story = {
  args: {
    alt: "김지현",
    name: "김지현",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
  },
}

export const NameFallback: Story = { args: { name: "김지현" } }
export const ImageErrorFallback: Story = { args: { name: "김지현", src: "/avatar-does-not-exist.png" } }
export const Empty: Story = { args: {} }

export const Sizes: Story = {
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--jdsb-space-button-gap)" }}>
      <Avatar name="김지현" size="sm" />
      <Avatar name="김지현" size="md" />
      <Avatar name="김지현" size="lg" />
      <Avatar name="김지현" size="xl" />
    </div>
  ),
}
