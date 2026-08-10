import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Pagination } from "@jdsb/components"

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  args: { "aria-label": "검색 결과 페이지", defaultPage: 1, totalPages: 10 },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

function ControlledPagination() {
  const [page, setPage] = useState(3)
  return <Pagination aria-label="검색 결과 페이지" page={page} totalPages={10} onPageChange={setPage} />
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "다음 페이지" }))
    expect(canvas.getByRole("button", { name: "2 페이지, 현재 페이지" })).toHaveAttribute("aria-current", "page")
  },
}

export const Controlled: Story = { render: () => <ControlledPagination /> }
export const FirstPage: Story = { args: { defaultPage: 1, totalPages: 5 } }
export const LastPage: Story = { args: { defaultPage: 5, totalPages: 5 } }
export const Ellipsis: Story = { args: { defaultPage: 5, totalPages: 10 } }
export const NarrowEllipsis: Story = {
  render: (args) => <div style={{ inlineSize: 320, maxInlineSize: "100%" }}><Pagination {...args} /></div>,
  args: { defaultPage: 5, totalPages: 10 },
  play: async ({ canvasElement }) => {
    const navigation = within(canvasElement).getByRole("navigation")
    expect(navigation.scrollWidth).toBeLessThanOrEqual(navigation.clientWidth)
  },
}
export const LocalizedLabels: Story = {
  args: {
    "aria-label": "Search results pagination with localized control names",
    defaultPage: 1,
    getPageLabel: (page) => `Page ${page}`,
    nextLabel: "Next",
    previousLabel: "Previous",
    totalPages: 5,
  },
}
