import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "@jds/components"

const meta = {
  title: "Navigation/Accordion",
  component: Accordion,
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

function ShippingItem({ disabled = false, long = false }: { disabled?: boolean; long?: boolean }) {
  return (
    <AccordionItem disabled={disabled} value="shipping">
      <AccordionHeader>
        <AccordionTrigger>{long ? "주문한 상품의 배송 일정과 주소 변경 방법을 확인하는 긴 배송 정보 제목" : "배송 정보"}</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>배송은 영업일 기준 2~3일 걸립니다.</AccordionContent>
    </AccordionItem>
  )
}

function ReturnsItem({ long = false }: { long?: boolean }) {
  return (
    <AccordionItem value="returns">
      <AccordionHeader><AccordionTrigger>반품 정책</AccordionTrigger></AccordionHeader>
      <AccordionContent>
        {long
          ? "상품을 수령한 날부터 7일 이내에 반품을 신청할 수 있습니다. 사용 흔적이 있거나 상품 가치가 훼손된 경우에는 반품이 제한될 수 있으니 신청 전에 상품 상태와 주문 정보를 확인해 주세요."
          : "수령 후 7일 안에 반품할 수 있습니다."}
      </AccordionContent>
    </AccordionItem>
  )
}

function ControlledSingle() {
  const [value, setValue] = useState<string | null>("shipping")
  return <Accordion onValueChange={setValue} type="single" value={value}><ShippingItem /><ReturnsItem /></Accordion>
}

function ControlledMultipleExample() {
  const [value, setValue] = useState(["shipping"])
  return <Accordion onValueChange={setValue} type="multiple" value={value}><ShippingItem /><ReturnsItem /></Accordion>
}

export const Single: Story = {
  args: { children: null, defaultValue: "shipping", type: "single" },
  render: () => <Accordion defaultValue="shipping" type="single"><ShippingItem /><ReturnsItem /></Accordion>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const shipping = canvas.getByRole("button", { name: "배송 정보" })
    shipping.focus()
    await userEvent.keyboard("{Enter}")
    expect(shipping).toHaveAttribute("aria-expanded", "false")
    await userEvent.keyboard(" ")
    expect(shipping).toHaveAttribute("aria-expanded", "true")
  },
}

export const AllCollapsed: Story = {
  args: { children: null, type: "single" },
  render: () => <Accordion type="single"><ShippingItem /><ReturnsItem /></Accordion>,
}

export const Multiple: Story = {
  args: { children: null, defaultValue: ["shipping"], type: "multiple" },
  render: () => <Accordion defaultValue={["shipping"]} type="multiple"><ShippingItem /><ReturnsItem /></Accordion>,
}

export const Controlled: Story = {
  args: { children: null, type: "single", value: "shipping" },
  render: () => <ControlledSingle />,
}

export const ControlledMultiple: Story = {
  args: { children: null, type: "multiple", value: ["shipping"] },
  render: () => <ControlledMultipleExample />,
}

export const DisabledItem: Story = {
  args: { children: null, defaultValue: "shipping", type: "single" },
  render: () => <Accordion defaultValue="shipping" type="single"><ShippingItem disabled /></Accordion>,
}

export const LongTrigger: Story = {
  args: { children: null, defaultValue: "shipping", type: "single" },
  render: () => <Accordion defaultValue="shipping" type="single"><ShippingItem long /></Accordion>,
}

export const LongContent: Story = {
  args: { children: null, defaultValue: "returns", type: "single" },
  render: () => <Accordion defaultValue="returns" type="single"><ShippingItem /><ReturnsItem long /></Accordion>,
}
