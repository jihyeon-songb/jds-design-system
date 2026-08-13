import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Skeleton } from "@jdsb/components"

const meta = { title: "Layout/Skeleton", component: Skeleton } satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = {
  render: () => (
    <div aria-busy="true" aria-label="프로필을 불러오는 중" role="status">
      <Skeleton data-testid="title" style={{ blockSize: "var(--jdsb-size-control-button-md-height)", inlineSize: "var(--jdsb-space-field-group)" }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByTestId("title")).toHaveAttribute("aria-hidden", "true")
  },
}

export const Avatar: Story = {
  render: () => (
    <div aria-busy="true" aria-label="사용자 정보를 불러오는 중" role="status">
      <Skeleton style={{ blockSize: "var(--jdsb-size-avatar-md)", borderRadius: "var(--jdsb-radius-avatar)", inlineSize: "var(--jdsb-size-avatar-md)" }} />
    </div>
  ),
}
