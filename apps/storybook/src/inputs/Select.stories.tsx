import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@jdsb/components"

const countries = (
  <>
    <SelectTrigger aria-label="국가">
      <SelectValue placeholder="국가 선택" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="kr">대한민국</SelectItem>
      <SelectItem value="jp">일본</SelectItem>
      <SelectItem value="us">미국</SelectItem>
    </SelectContent>
  </>
)

const meta = {
  title: "Inputs/Select",
  component: Select,
  args: { children: countries },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

function ControlledSelect() {
  const [value, setValue] = useState("kr")

  return (
    <Select value={value} onValueChange={setValue}>
      {countries}
    </Select>
  )
}

export const Basic: Story = {
  render: () => <Select defaultValue="kr">{countries}</Select>,
}

export const Placeholder: Story = {
  render: () => <Select>{countries}</Select>,
}

export const Groups: Story = {
  render: () => (
    <Select defaultValue="kr">
      <SelectTrigger aria-label="국가"><SelectValue placeholder="국가 선택" /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>아시아</SelectLabel>
          <SelectItem value="kr">대한민국</SelectItem>
          <SelectItem value="jp">일본</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>북아메리카</SelectLabel>
          <SelectItem value="us">미국</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const DisabledItem: Story = {
  render: () => (
    <Select defaultValue="kr">
      <SelectTrigger aria-label="국가"><SelectValue placeholder="국가 선택" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="kr">대한민국</SelectItem>
        <SelectItem value="jp" disabled>일본</SelectItem>
        <SelectItem value="us">미국</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => <Select defaultValue="kr" disabled>{countries}</Select>,
}

export const Invalid: Story = {
  render: () => <Select invalid>{countries}</Select>,
}

export const Controlled: Story = {
  render: () => <ControlledSelect />,
}

export const ClosedTypeahead: Story = {
  tags: ["select-regression"],
  render: () => <Select>{countries}</Select>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("combobox", { name: "국가" })

    trigger.focus()
    await userEvent.keyboard("ㅇ")

    expect(canvas.getByRole("listbox")).toBeVisible()
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      canvas.getByRole("option", { name: "일본" }).id
    )
  },
}

export const LongText: Story = {
  render: () => (
    <Select defaultValue="long">
      <SelectTrigger aria-label="배송 옵션"><SelectValue placeholder="배송 옵션 선택" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="long">
          영업일 기준 3일에서 5일 사이에 도착하는 긴 이름의 일반 배송 옵션
        </SelectItem>
      </SelectContent>
    </Select>
  ),
}
