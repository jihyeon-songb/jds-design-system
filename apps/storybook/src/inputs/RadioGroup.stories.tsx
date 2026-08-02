import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
} from "@jds/components"

const deliveryOptions = (
  <>
    <Field orientation="horizontal">
      <RadioGroupItem id="standard" value="standard" />
      <FieldLabel htmlFor="standard">일반 배송</FieldLabel>
    </Field>
    <Field orientation="horizontal">
      <RadioGroupItem id="express" value="express" />
      <FieldLabel htmlFor="express">빠른 배송</FieldLabel>
    </Field>
  </>
)

const meta = {
  title: "Inputs/RadioGroup",
  component: RadioGroup,
  args: { "aria-label": "배송 방식", children: deliveryOptions, name: "delivery" },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

function ControlledRadioGroup() {
  const [value, setValue] = useState("standard")

  return <RadioGroup aria-label="배송 방식" name="delivery" value={value} onValueChange={setValue}>{deliveryOptions}</RadioGroup>
}

export const Default: Story = {
  args: { defaultValue: "standard" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText("빠른 배송"))
    const express = canvas.getByRole("radio", { name: "빠른 배송" })

    expect(express).toBeChecked()
    express.focus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(canvas.getByRole("radio", { name: "일반 배송" })).toBeChecked()
  },
}

export const Unselected: Story = {}

export const Horizontal: Story = {
  args: { defaultValue: "standard", orientation: "horizontal" },
}

export const DisabledItem: Story = {
  render: () => (
    <RadioGroup aria-label="배송 방식" defaultValue="standard" name="delivery">
      <Field orientation="horizontal">
        <RadioGroupItem id="standard" value="standard" />
        <FieldLabel htmlFor="standard">일반 배송</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem disabled id="express" value="express" />
        <FieldLabel htmlFor="express">빠른 배송</FieldLabel>
      </Field>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  args: { defaultValue: "standard", disabled: true },
}

export const Invalid: Story = {
  render: () => (
    <Field>
      <RadioGroup
        aria-describedby="delivery-description delivery-error"
        aria-label="배송 방식"
        invalid
        name="delivery"
      >
        {deliveryOptions}
      </RadioGroup>
      <FieldDescription id="delivery-description">배송 방식을 선택하세요.</FieldDescription>
      <FieldError id="delivery-error">배송 방식은 필수입니다.</FieldError>
    </Field>
  ),
}

export const Required: Story = {
  args: { required: true },
}

export const Controlled: Story = {
  render: () => <ControlledRadioGroup />,
}

export const LongLabel: Story = {
  render: () => (
    <RadioGroup aria-label="배송 방식" name="delivery">
      <Field orientation="horizontal">
        <RadioGroupItem id="long-delivery" value="long-delivery" />
        <FieldLabel htmlFor="long-delivery">
          영업일 기준 3일에서 5일 사이에 도착하는 긴 이름의 일반 배송 옵션
        </FieldLabel>
      </Field>
    </RadioGroup>
  ),
}
