import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Button, Separator } from "@jdsb/components"

const meta = {
  title: "Layout/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { "aria-label": "내용 구획", orientation: "horizontal" },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "내용 구획" })
    expect(separator.tagName).toBe("HR")
  },
}

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--jdsb-space-button-gap)" }}>
      <Button>복사</Button>
      <Separator aria-label="도구 모음 구획" orientation="vertical" />
      <Button>붙여넣기</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator", { name: "도구 모음 구획" })
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
  },
}
