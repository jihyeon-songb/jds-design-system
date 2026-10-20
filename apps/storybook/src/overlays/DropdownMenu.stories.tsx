import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@jdsb/components"

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
  tags: ["dropdown-menu-regression"],
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component: "DropdownMenu는 명령 목록입니다. 방향키로 항목을 이동하고 Enter 또는 Space로 실행합니다.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

function ControlledDropdownMenu() {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>편집</DropdownMenuItem>
        <DropdownMenuItem>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>편집</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "더 보기" })
    await userEvent.click(trigger)
    expect(within(document.body).getByRole("menu")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    expect(trigger).toHaveFocus()
  },
}

export const Controlled: Story = {
  render: () => <ControlledDropdownMenu />,
}

export const DisabledItem: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>편집</DropdownMenuItem>
        <DropdownMenuItem disabled>복제</DropdownMenuItem>
        <DropdownMenuItem>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
