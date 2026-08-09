import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  type DrawerSide,
} from "@jdsb/components"

const meta = {
  title: "Overlays/Drawer",
  component: Drawer,
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component:
          "DrawerContent에는 DrawerTitle 또는 aria-label로 접근 가능한 이름을 제공하세요. Trigger는 Enter와 Space로 열리며, 열린 Drawer에서는 Tab과 Shift+Tab이 모달 안에서 이동합니다. Escape와 backdrop 클릭은 기본적으로 닫지만 각 이벤트에서 preventDefault()로 막을 수 있습니다.",
      },
    },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

function ControlledDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger>필터 열기</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>필터</DrawerTitle>
        <DrawerDescription>원하는 조건을 선택하세요.</DrawerDescription>
        <DrawerClose aria-label="필터 닫기">닫기</DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

function SideDrawer({ side }: { side: DrawerSide }) {
  return (
    <Drawer>
      <DrawerTrigger>{side} Drawer 열기</DrawerTrigger>
      <DrawerContent side={side}>
        <DrawerTitle>{side} Drawer</DrawerTitle>
        <DrawerClose aria-label={`${side} Drawer 닫기`}>닫기</DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger>메뉴 열기</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>메뉴</DrawerTitle>
        <DrawerDescription>이동할 메뉴를 선택하세요.</DrawerDescription>
        <DrawerClose aria-label="메뉴 닫기">닫기</DrawerClose>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "메뉴 열기" }))
    expect(within(document.body).getByRole("dialog", { name: "메뉴" })).toBeVisible()
  },
}

export const Controlled: Story = {
  render: () => <ControlledDrawer />,
}

export const AllSides: Story = {
  render: () => (
    <>
      <SideDrawer side="left" />
      <SideDrawer side="right" />
      <SideDrawer side="top" />
      <SideDrawer side="bottom" />
    </>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger>이용 약관 열기</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>이용 약관</DrawerTitle>
        <DrawerDescription>
          서비스를 이용하면 관련 법령과 운영 정책을 준수하는 데 동의하게 됩니다. 서비스는 안정적인 제공을 위해 필요한 경우 사전 안내 후 약관을 변경할 수 있으며, 변경된 약관은 공지한 날부터 적용됩니다. 중요한 변경 사항은 별도로 안내합니다.
        </DrawerDescription>
        <DrawerClose aria-label="약관 닫기">닫기</DrawerClose>
      </DrawerContent>
    </Drawer>
  ),
}

export const AriaLabelOnly: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger>알림 설정 열기</DrawerTrigger>
      <DrawerContent aria-label="알림 설정" side="bottom">
        <p>새 알림을 받을 방법을 선택하세요.</p>
        <DrawerClose aria-label="알림 설정 닫기">닫기</DrawerClose>
      </DrawerContent>
    </Drawer>
  ),
}
