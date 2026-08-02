import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
} from "@jds/components"

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component:
          "DialogContent에는 DialogTitle 또는 aria-label로 접근 가능한 이름을 제공하세요. Trigger는 Enter와 Space로 열리고, 열린 dialog에서는 Tab과 Shift+Tab이 모달 안에서 이동합니다. Escape와 backdrop 클릭은 기본적으로 닫지만 각 이벤트에서 preventDefault()로 막을 수 있으며, 이때는 명시적인 닫기 또는 취소 버튼을 제공해야 합니다.",
      },
    },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

function ControlledDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>편집 열기</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로필 편집</DialogTitle>
          <DialogDescription>여기에서 프로필 정보를 수정할 수 있습니다. 변경을 마치면 저장을 눌러주세요.</DialogDescription>
          <DialogClose aria-label="닫기" variant="ghost">×</DialogClose>
        </DialogHeader>
        <Field>
          <label htmlFor="profile-name">이름</label>
          <Input defaultValue="김지수" id="profile-name" />
        </Field>
        <Field>
          <label htmlFor="profile-username">사용자 이름</label>
          <Input defaultValue="@jisoo" id="profile-username" />
        </Field>
        <DialogFooter>
          <DialogClose aria-label="취소">취소</DialogClose>
          <Button>변경사항 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>계정 삭제</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계정을 삭제할까요?</DialogTitle>
          <DialogDescription>삭제한 계정은 복구할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose aria-label="취소">취소</DialogClose>
          <Button variant="destructive">계정 삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "계정 삭제" }))
    expect(within(document.body).getByRole("dialog", { name: "계정을 삭제할까요?" })).toBeVisible()
  },
}

export const Controlled: Story = {
  render: () => <ControlledDialog />,
}

export const LongContent: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger>이용 약관 보기</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>이용 약관</DialogTitle></DialogHeader>
        <DialogDescription>서비스를 이용하면 관련 법령과 운영 정책을 준수하는 데 동의하게 됩니다. 서비스는 안정적인 제공을 위해 필요한 경우 사전 안내 후 약관을 변경할 수 있으며, 변경된 약관은 공지한 날부터 적용됩니다. 중요한 변경 사항은 별도로 안내합니다.</DialogDescription>
        <DialogFooter><DialogClose aria-label="닫기">닫기</DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const AriaLabelOnly: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger>알림 설정 열기</DialogTrigger>
      <DialogContent aria-label="알림 설정">
        <p>새 알림을 받을 방법을 선택하세요.</p>
        <DialogFooter><DialogClose aria-label="닫기">닫기</DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const PreventOutsideClose: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger>결제 확인 열기</DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader><DialogTitle>결제를 완료할까요?</DialogTitle><DialogDescription>계속하려면 취소 또는 결제 완료를 선택하세요.</DialogDescription></DialogHeader>
        <DialogFooter><DialogClose aria-label="취소">취소</DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Autofocus: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger>비밀번호 변경 열기</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>비밀번호를 변경할까요?</DialogTitle><DialogDescription>새 비밀번호를 입력하세요.</DialogDescription></DialogHeader>
        <input aria-label="새 비밀번호" autoFocus type="password" />
        <DialogFooter><DialogClose aria-label="취소">취소</DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const DestructiveConfirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>프로젝트 삭제</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>프로젝트를 삭제할까요?</DialogTitle><DialogDescription>삭제한 프로젝트와 데이터는 복구할 수 없습니다.</DialogDescription></DialogHeader>
        <DialogFooter><DialogClose aria-label="취소">취소</DialogClose><Button variant="destructive">프로젝트 삭제</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
