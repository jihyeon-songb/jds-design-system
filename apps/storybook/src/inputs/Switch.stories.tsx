import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Switch,
} from "@jdsb/components"

const meta = {
  title: "Inputs/Switch",
  component: Switch,
  args: {},
  render: (args) => (
    <label>
      <Switch {...args} /> 마케팅 정보 수신
    </label>
  ),
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

function ControlledSwitch() {
  const [checked, setChecked] = useState(false)

  return (
    <label>
      <Switch
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />{" "}
      상태 제어 스위치
    </label>
  )
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = canvas.getByRole("switch", { name: "마케팅 정보 수신" })

    await userEvent.click(canvas.getByText("마케팅 정보 수신"))
    expect(control).toBeChecked()

    control.focus()
    await userEvent.keyboard(" ")
    expect(control).not.toBeChecked()
  },
}

export const Small: Story = { args: { size: "sm" } }
export const Medium: Story = { args: { size: "md" } }
export const Large: Story = { args: { size: "lg" } }
export const ExtraLarge: Story = { args: { size: "xl" } }
export const Checked: Story = { args: { defaultChecked: true } }
export const Controlled: Story = { render: () => <ControlledSwitch /> }
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = { args: { invalid: true } }
export const Required: Story = { args: { required: true } }

export const WithDescriptionAndError: Story = {
  render: (args) => (
    <Field orientation="horizontal">
      <Switch
        {...args}
        aria-describedby="marketing-description marketing-error"
        id="marketing"
        invalid
      />
      <FieldContent>
        <FieldLabel htmlFor="marketing">마케팅 정보 수신</FieldLabel>
        <FieldDescription id="marketing-description">
          새로운 혜택과 소식을 받을 수 있습니다.
        </FieldDescription>
        <FieldError id="marketing-error">수신 설정을 확인해 주세요.</FieldError>
      </FieldContent>
    </Field>
  ),
}

export const LongLabel: Story = {
  render: (args) => (
    <Field orientation="horizontal">
      <Switch
        {...args}
        aria-describedby="long-marketing-description"
        id="long-marketing"
      />
      <FieldContent>
        <FieldLabel htmlFor="long-marketing">
          새로운 상품과 서비스 혜택에 대한 마케팅 정보를 이메일과 알림으로 받습니다
        </FieldLabel>
        <FieldDescription id="long-marketing-description">
          이 설정은 언제든지 다시 변경할 수 있습니다.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}
