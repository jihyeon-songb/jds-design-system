import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Button, ToastProvider, useToast } from "@jdsb/components"

const meta = {
  title: "Feedback/Toast",
  component: ToastProvider,
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component:
          "ToastProvider 안에서 useToast()를 사용하세요. success·info·warning은 5초 뒤 닫히고 error는 사용자가 닫을 때까지 유지됩니다. 최대 세 개까지 표시하며 상호작용 콘텐츠는 넣지 않습니다.",
      },
    },
  },
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

function ToastButtons() {
  const toast = useToast()

  return (
    <>
      <Button onClick={() => toast.success({ message: "저장했습니다." })}>성공 알림</Button>
      <Button onClick={() => toast.info({ message: "새 버전을 사용할 수 있습니다." })}>정보 알림</Button>
      <Button onClick={() => toast.warning({ message: "입력한 내용을 다시 확인해 주세요." })}>경고 알림</Button>
      <Button onClick={() => toast.error({ message: "저장에 실패했습니다." })}>오류 알림</Button>
    </>
  )
}

function StackButton() {
  const toast = useToast()

  return (
    <Button
      onClick={() => {
        toast.success({ message: "저장했습니다." })
        toast.info({ message: "새 버전을 사용할 수 있습니다." })
        toast.warning({ message: "입력한 내용을 다시 확인해 주세요." })
      }}
    >
      세 개 알림 표시
    </Button>
  )
}

export const Success: Story = {
  render: () => (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "성공 알림" }))
    await userEvent.click(canvas.getByRole("button", { name: "닫기" }))
    expect(canvas.queryByRole("status")).not.toBeInTheDocument()
  },
}

export const AllVariants: Story = {
  render: () => (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  ),
}

export const Stack: Story = {
  render: () => (
    <ToastProvider>
      <StackButton />
    </ToastProvider>
  ),
}

export const PersistentError: Story = {
  render: () => (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  ),
}
