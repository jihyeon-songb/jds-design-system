import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@jds/components"

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

function ExampleTabs({ disabled = false, long = false }: { disabled?: boolean; long?: boolean }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="계정 정보">
        <TabsTrigger value="overview">{long ? "계정의 현재 상태와 주요 활동을 확인하는 긴 개요 탭" : "개요"}</TabsTrigger>
        <TabsTrigger value="security">보안</TabsTrigger>
        <TabsTrigger disabled={disabled} value="billing">결제</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">계정 개요</TabsContent>
      <TabsContent value="security">보안 설정</TabsContent>
      <TabsContent value="billing">결제 내역</TabsContent>
    </Tabs>
  )
}

function ControlledTabs() {
  const [value, setValue] = useState("overview")
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="계정 정보"><TabsTrigger value="overview">개요</TabsTrigger><TabsTrigger value="security">보안</TabsTrigger></TabsList>
      <TabsContent value="overview">계정 개요</TabsContent><TabsContent value="security">보안 설정</TabsContent>
    </Tabs>
  )
}

export const Default: Story = {
  args: { children: null, defaultValue: "overview" },
  render: () => <ExampleTabs disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const overview = canvas.getByRole("tab", { name: "개요" })
    overview.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(canvas.getByRole("tab", { name: "보안" })).toHaveFocus()
    expect(canvas.getByText("보안 설정")).toBeInTheDocument()
  },
}

export const Controlled: Story = { args: { children: null, defaultValue: "overview" }, render: () => <ControlledTabs /> }
export const DisabledTrigger: Story = { args: { children: null, defaultValue: "overview" }, render: () => <ExampleTabs disabled /> }
export const LongLabel: Story = { args: { children: null, defaultValue: "overview" }, render: () => <ExampleTabs long /> }
export const LongPanelContent: Story = {
  args: { children: null, defaultValue: "overview" },
  render: () => <Tabs defaultValue="overview"><TabsList aria-label="계정 정보"><TabsTrigger value="overview">개요</TabsTrigger></TabsList><TabsContent value="overview">계정 설정과 최근 활동, 보안 상태를 한 화면에서 확인할 수 있는 긴 패널 내용입니다. 필요한 세부 정보와 안내 문구도 이 영역에 표시됩니다.</TabsContent></Tabs>,
}
