import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar } from "@jds/components"

const meta = {
  title: "Feedback/Avatar",
  component: Avatar,
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
export const Empty: Story = { args: { "aria-label": "알 수 없는 사용자" } }

export const Sizes: Story = {
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--jds-space-button-gap)" }}>
      <Avatar name="김지현" size="sm" />
      <Avatar name="김지현" size="md" />
      <Avatar name="김지현" size="lg" />
      <Avatar name="김지현" size="xl" />
    </div>
  ),
}
