import type { Meta, StoryObj } from "@storybook/react-vite"
import { IconButton, Tooltip, TooltipContent, TooltipTrigger, type TooltipSide } from "@jdsb/components"

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  args: { children: null },
  parameters: {
    docs: {
      description: {
        component:
          "TooltipTrigger는 접근 가능한 이름을 가진 단일 요소여야 합니다. Tooltip은 focus 또는 pointer 진입 후 300ms에 표시되고 Escape로 닫힙니다. TooltipContent는 상호작용할 수 없는 보조 설명에만 사용하세요.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

function SideTooltip({ side }: { side: TooltipSide }) {
  return (
    <Tooltip>
      <TooltipTrigger><IconButton aria-label={`${side} Tooltip`}>☆</IconButton></TooltipTrigger>
      <TooltipContent side={side}>{side} Tooltip</TooltipContent>
    </Tooltip>
  )
}

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger><IconButton aria-label="즐겨찾기에 추가">☆</IconButton></TooltipTrigger>
      <TooltipContent>즐겨찾기에 추가</TooltipContent>
    </Tooltip>
  ),
}

export const AllSides: Story = {
  render: () => (
    <div>
      <SideTooltip side="top" />
      <SideTooltip side="right" />
      <SideTooltip side="bottom" />
      <SideTooltip side="left" />
    </div>
  ),
}

export const ExistingDescription: Story = {
  render: () => (
    <>
      <span id="existing-description">이미 연결된 설명입니다.</span>
      <Tooltip>
        <TooltipTrigger><IconButton aria-describedby="existing-description" aria-label="추가 설명">☆</IconButton></TooltipTrigger>
        <TooltipContent>추가 설명</TooltipContent>
      </Tooltip>
    </>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger><IconButton aria-label="배송 안내">☆</IconButton></TooltipTrigger>
      <TooltipContent>평일 오후 2시 이전 결제 완료 주문은 당일 출고되며, 배송 지역에 따라 1~3일이 소요될 수 있습니다.</TooltipContent>
    </Tooltip>
  ),
}
