import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Popover, PopoverContent, PopoverTrigger, type PopoverSide } from "@jdsb/components"

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  tags: ["popover-regression"],
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component:
          "Popover는 클릭으로 여는 비모달 콘텐츠입니다. 키보드 포커스는 Content에 갇히지 않으며 Escape와 바깥 클릭으로 닫힙니다.",
      },
    },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

function ControlledPopover() {
  const [open, setOpen] = useState(false)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>정렬</PopoverTrigger>
      <PopoverContent aria-label="정렬 옵션">
        <label><input defaultChecked name="sort" type="radio" /> 최신순</label>
        <label><input name="sort" type="radio" /> 가격순</label>
      </PopoverContent>
    </Popover>
  )
}

function SidePopover({ label, side }: { label: string; side: PopoverSide }) {
  return (
    <Popover>
      <PopoverTrigger>{label} 방향</PopoverTrigger>
      <PopoverContent aria-label={`${label} 방향 옵션`} side={side}>
        {label}에 표시되는 내용
      </PopoverContent>
    </Popover>
  )
}

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>표시 옵션</PopoverTrigger>
      <PopoverContent aria-label="표시 옵션">
        <label><input type="checkbox" /> 품절 상품 숨기기</label>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("button", { name: "표시 옵션" })
    await userEvent.click(trigger)
    const content = within(document.body).getByLabelText("표시 옵션")

    expect(content).toBeVisible()
    await userEvent.keyboard("{Escape}")
    expect(trigger).toHaveFocus()
  },
}

export const Controlled: Story = {
  render: () => <ControlledPopover />,
}

export const AllSides: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--jdsb-space-field-content)",
      }}
    >
      <SidePopover label="위쪽" side="top" />
      <SidePopover label="오른쪽" side="right" />
      <SidePopover label="아래쪽" side="bottom" />
      <SidePopover label="왼쪽" side="left" />
    </div>
  ),
}

export const FormContent: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger>알림 설정</PopoverTrigger>
      <PopoverContent aria-label="알림 설정">
        <label htmlFor="popover-email">이메일</label>
        <input id="popover-email" type="email" />
      </PopoverContent>
    </Popover>
  ),
}
