import type { Meta, StoryObj } from "@storybook/react-vite"
import { IconButton } from "@jdsb/components"

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3 3 10 10M13 3 3 13" stroke="currentColor" /></svg>
}

const meta = {
  title: "Actions/IconButton",
  component: IconButton,
  args: { "aria-label": "닫기", children: <CloseIcon />, type: "button" },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Variants: Story = {
  render: () => (
    <div>
      <IconButton aria-label="저장"><CloseIcon /></IconButton>
      <IconButton aria-label="미리 보기" variant="secondary"><CloseIcon /></IconButton>
      <IconButton aria-label="취소" variant="outline"><CloseIcon /></IconButton>
      <IconButton aria-label="메뉴" variant="ghost"><CloseIcon /></IconButton>
      <IconButton aria-label="삭제" variant="destructive"><CloseIcon /></IconButton>
    </div>
  ),
}
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { "aria-label": "저장 중", loading: true } }
export const LongLabel: Story = {
  args: { "aria-label": "현재 편집 중인 문서를 닫고 변경 사항을 저장하지 않습니다" },
}
