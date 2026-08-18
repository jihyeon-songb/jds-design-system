import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Calendar, type CalendarProps } from "@jdsb/components"

const basicArgs: CalendarProps = {
  "aria-label": "예약 날짜",
  defaultMonth: "2026-08",
  defaultValue: "2026-08-13",
  locale: "ko-KR",
}

const meta = {
  title: "Inputs/Calendar",
  component: Calendar,
  args: basicArgs,
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

function ControlledCalendar() {
  const [value, setValue] = useState("2026-08-13")
  const [month, setMonth] = useState("2026-08")

  return <Calendar aria-label="예약 날짜" month={month} onMonthChange={setMonth} value={value} onValueChange={setValue} />
}

export const Basic: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const day13 = within(canvas.getByRole("gridcell", { name: /2026년 8월 13일/ })).getByRole("button")
    day13.focus()
    await userEvent.keyboard("{ArrowRight}{Enter}")
    expect(canvas.getByRole("gridcell", { name: /2026년 8월 14일/ })).toHaveAttribute("aria-selected", "true")
  },
}

export const Bounded: Story = {
  args: { min: "2026-08-10", max: "2026-08-20" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(within(canvas.getByRole("gridcell", { name: /2026년 8월 9일/ })).getByRole("button")).toBeDisabled()
  },
}

export const Controlled: Story = { render: () => <ControlledCalendar /> }

export const KoreanLocale: Story = { args: { locale: "ko-KR" } }

export const LongMonthLabel: Story = {
  args: { "aria-label": "예약 가능한 날짜를 선택하는 달력", defaultMonth: "2026-09", locale: "en-US" },
}
