import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@jdsb/components"

const cityOptions = (
  <>
    <ComboboxInput aria-label="도시" />
    <ComboboxList>
      <ComboboxOption value="seoul">서울</ComboboxOption>
      <ComboboxOption value="busan">부산</ComboboxOption>
      <ComboboxOption value="jeju">제주</ComboboxOption>
      <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
    </ComboboxList>
  </>
)

const meta = {
  title: "Inputs/Combobox",
  component: Combobox,
  args: { children: cityOptions },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

function ControlledCombobox() {
  const [value, setValue] = useState("seoul")

  return (
    <Combobox value={value} onValueChange={setValue}>
      {cityOptions}
    </Combobox>
  )
}

export const Basic: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "도시" })

    await userEvent.click(input)
    await userEvent.keyboard("{ArrowDown}{Enter}{Escape}")

    expect(input).toHaveValue("부산")
    expect(input).toHaveAttribute("aria-expanded", "false")
  },
}

export const Controlled: Story = {
  render: () => <ControlledCombobox />,
}

export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole("combobox", { name: "도시" }), "인천")

    expect(canvas.getByText("검색 결과가 없습니다.")).toBeVisible()
  },
}

export const DisabledOption: Story = {
  render: () => (
    <Combobox defaultOpen>
      <ComboboxInput aria-label="도시" />
      <ComboboxList>
        <ComboboxOption value="seoul">서울</ComboboxOption>
        <ComboboxOption value="busan" disabled>부산</ComboboxOption>
        <ComboboxOption value="jeju">제주</ComboboxOption>
      </ComboboxList>
    </Combobox>
  ),
}
