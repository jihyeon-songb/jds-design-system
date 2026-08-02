import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Alert } from "@jds/components"

const meta = {
  title: "Feedback/Alert",
  component: Alert,
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

function ControlledAlert() {
  const [open, setOpen] = useState(true)

  return (
    <Alert
      closeLabel="알림 닫기"
      dismissible
      onOpenChange={setOpen}
      open={open}
      title="업데이트 안내"
    >
      새로운 버전을 사용할 수 있습니다.
    </Alert>
  )
}

export const Info: Story = {
  args: { title: "업데이트 안내", children: "새로운 버전을 사용할 수 있습니다." },
}

export const Success: Story = {
  args: { variant: "success", title: "저장 완료", children: "변경 사항을 저장했습니다." },
}

export const Warning: Story = {
  args: { variant: "warning", title: "확인 필요", children: "입력한 내용을 다시 확인해 주세요." },
}

export const Error: Story = {
  args: { variant: "error", title: "저장 실패", children: "잠시 후 다시 시도해 주세요." },
}

export const DescriptionOnly: Story = {
  args: { children: "예정된 점검은 오늘 오후 11시에 시작합니다." },
}

export const Dismissible: Story = {
  args: { closeLabel: "알림 닫기", dismissible: true, title: "저장 완료", children: "변경 사항을 저장했습니다." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "알림 닫기" }))
    expect(canvas.queryByRole("status")).not.toBeInTheDocument()
  },
}

export const Controlled: Story = {
  render: () => <ControlledAlert />,
}

export const LongContent: Story = {
  args: {
    title: "서비스 이용 안내",
    children: "안정적인 서비스 제공을 위한 시스템 점검이 오늘 오후 11시부터 내일 오전 2시까지 진행됩니다. 점검 중에는 일부 기능의 이용이 제한될 수 있습니다.",
  },
}
