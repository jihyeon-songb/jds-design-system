import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Progress } from "@jdsb/components"

const meta = {
  title: "Feedback/Progress",
  component: Progress,
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Determinate: Story = {
  args: { label: "파일 업로드", max: 100, value: 40 },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("progressbar", { name: "파일 업로드" })).toHaveValue(40)
  },
}

export const Indeterminate: Story = {
  args: { label: "파일 업로드 진행 중" },
}
