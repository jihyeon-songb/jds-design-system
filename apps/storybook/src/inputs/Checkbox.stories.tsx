import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@jdsb/components"

const meta = {
  title: "Inputs/Checkbox",
  component: Checkbox,
  args: {},
  render: (args) => (
    <label>
      <Checkbox {...args} /> 약관 동의
    </label>
  ),
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

function ControlledCheckbox() {
  const [checked, setChecked] = useState(false)

  return (
    <label>
      <Checkbox
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />{" "}
      상태 제어 체크박스
    </label>
  )
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = canvas.getByRole("checkbox", { name: "약관 동의" })

    await userEvent.click(canvas.getByText("약관 동의"))
    expect(control).toBeChecked()

    control.focus()
    await userEvent.keyboard(" ")
    expect(control).not.toBeChecked()
  },
}
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = { args: { invalid: true } }
export const Controlled: Story = {
  render: () => <ControlledCheckbox />,
}
export const WithDescriptionAndError: Story = {
  render: (args) => (
    <Field orientation="horizontal">
      <Checkbox
        {...args}
        aria-describedby="terms-description terms-error"
        id="terms"
        invalid
      />
      <FieldContent>
        <FieldLabel htmlFor="terms">필수 약관 동의</FieldLabel>
        <FieldDescription id="terms-description">
          서비스 이용 전에 확인해 주세요.
        </FieldDescription>
        <FieldError id="terms-error">약관에 동의해야 합니다.</FieldError>
      </FieldContent>
    </Field>
  ),
}
export const LongLabel: Story = {
  render: (args) => (
    <Field orientation="horizontal">
      <Checkbox
        {...args}
        aria-describedby="long-terms-description"
        id="long-terms"
      />
      <FieldContent>
        <FieldLabel htmlFor="long-terms">
          서비스 이용약관과 개인정보 처리방침의 긴 내용을 모두 확인하고 동의합니다
        </FieldLabel>
        <FieldDescription id="long-terms-description">
          선택하기 전에 각 정책의 주요 내용을 확인해 주세요.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}
