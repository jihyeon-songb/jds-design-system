import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@jdsb/components"

const meta = {
  title: "Navigation/Breadcrumb",
  component: Breadcrumb,
  args: { "aria-label": "현재 위치", children: null },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

function Path({ label = "현재 위치" }: { label?: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#home">홈</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbLink href="#products">상품</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbPage>상세</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const Default: Story = {
  render: () => <Path />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole("link", { name: "홈" })

    expect(canvas.getByRole("navigation", { name: "현재 위치" })).toBeInTheDocument()
    expect(canvas.getByText("상세")).toHaveAttribute("aria-current", "page")
    expect(canvas.getAllByText("/")[0]).toHaveAttribute("aria-hidden", "true")
    await userEvent.tab()
    expect(link).toHaveFocus()
  },
}

export const LongPath: Story = {
  render: () => (
    <Breadcrumb aria-label="현재 위치">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#home">홈</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbLink href="#catalog">매우 긴 카탈로그 이름</BreadcrumbLink><BreadcrumbSeparator>/</BreadcrumbSeparator></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbPage>매우 긴 현재 페이지 이름</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const LocalizedLabel: Story = { render: () => <Path label="You are here" /> }
