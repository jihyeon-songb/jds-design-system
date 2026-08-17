import { cleanup, render, screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Calendar } from "./Calendar.js"

afterEach(cleanup)

describe("Calendar", () => {
  it("renders the labelled grid with its selected day as the tab stop", () => {
    render(
      <Calendar
        aria-label="예약 날짜"
        defaultMonth="2026-08"
        defaultValue="2026-08-13"
        locale="ko-KR"
      />
    )

    const grid = screen.getByRole("grid", { name: "예약 날짜" })
    const selected = screen.getByRole("gridcell", { name: /2026년 8월 13일/ })

    expect(grid).toBeVisible()
    expect(selected).toHaveAttribute("aria-selected", "true")
    expect(within(selected).getByRole("button")).toHaveAttribute("tabindex", "0")
  })

  it("selects the arrow-key focus target with Enter", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" defaultValue="2026-08-13" locale="ko-KR" />)
    const day13 = within(screen.getByRole("gridcell", { name: /2026년 8월 13일/ }))
      .getByRole("button")

    day13.focus()
    await user.keyboard("{ArrowRight}{Enter}")

    expect(screen.getByRole("gridcell", { name: /2026년 8월 14일/ })).toHaveAttribute("aria-selected", "true")
  })

  it("disables days outside the inclusive range", () => {
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" min="2026-08-10" max="2026-08-20" />)

    expect(within(screen.getByRole("gridcell", { name: /2026년 8월 9일/ })).getByRole("button"))
      .toBeDisabled()
    expect(within(screen.getByRole("gridcell", { name: /2026년 8월 20일/ })).getByRole("button"))
      .not.toBeDisabled()
  })

  it("moves to the start and end of the current week", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" defaultValue="2026-08-13" locale="ko-KR" />)
    const day13 = within(screen.getByRole("gridcell", { name: /2026년 8월 13일/ })).getByRole("button")

    day13.focus()
    await user.keyboard("{Home}")
    expect(within(screen.getByRole("gridcell", { name: /2026년 8월 9일/ })).getByRole("button")).toHaveFocus()

    await user.keyboard("{End}")
    expect(within(screen.getByRole("gridcell", { name: /2026년 8월 15일/ })).getByRole("button")).toHaveFocus()
  })

  it("moves by month and year with PageUp and PageDown", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" defaultValue="2026-08-13" locale="ko-KR" />)
    const day13 = within(screen.getByRole("gridcell", { name: /2026년 8월 13일/ })).getByRole("button")

    day13.focus()
    await user.keyboard("{PageDown}")
    expect(within(screen.getByRole("gridcell", { name: /2026년 9월 13일/ })).getByRole("button")).toHaveFocus()

    await user.keyboard("{Shift>}{PageUp}{/Shift}")
    expect(within(screen.getByRole("gridcell", { name: /2025년 9월 13일/ })).getByRole("button")).toHaveFocus()
  })

  it("clamps keyboard navigation to range boundaries", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" defaultValue="2026-08-10" locale="ko-KR" min="2026-08-10" max="2026-08-20" />)
    const day10 = within(screen.getByRole("gridcell", { name: /2026년 8월 10일/ })).getByRole("button")

    day10.focus()
    await user.keyboard("{ArrowLeft}")

    expect(day10).toHaveFocus()
  })

  it("changes months with labelled previous and next controls", async () => {
    const user = userEvent.setup()
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" />)

    await user.click(screen.getByRole("button", { name: "다음 달" }))
    expect(screen.getByRole("gridcell", { name: /2026년 9월 1일/ })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "이전 달" }))
    expect(screen.getByRole("gridcell", { name: /2026년 8월 1일/ })).toBeVisible()
  })

  it("localizes month controls for a non-Korean locale", () => {
    render(<Calendar aria-label="Booking date" defaultMonth="2026-08" locale="en-US" />)

    expect(screen.getByRole("button", { name: "last month" })).toBeVisible()
    expect(screen.getByRole("button", { name: "next month" })).toBeVisible()
  })

  it("disables month controls with no selectable days", () => {
    render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" min="2026-08-10" max="2026-08-20" />)

    expect(screen.getByRole("button", { name: "이전 달" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "다음 달" })).toBeDisabled()
  })

  it("requests controlled value and month changes without replacing supplied props", async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    const onValueChange = vi.fn()
    render(<Calendar aria-label="예약 날짜" month="2026-08" value="2026-08-13" locale="ko-KR" onMonthChange={onMonthChange} onValueChange={onValueChange} />)

    await user.click(within(screen.getByRole("gridcell", { name: /2026년 8월 14일/ })).getByRole("button"))
    await user.click(screen.getByRole("button", { name: "다음 달" }))

    expect(onValueChange).toHaveBeenCalledWith("2026-08-14")
    expect(screen.getByRole("gridcell", { name: /2026년 8월 13일/ })).toHaveAttribute("aria-selected", "true")
    expect(onMonthChange).toHaveBeenCalledWith("2026-09")
    expect(screen.queryByRole("gridcell", { name: /2026년 9월 1일/ })).not.toBeInTheDocument()
  })

  it("rejects malformed dates", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" defaultValue="2026-02-30" />)).toThrow(
      "defaultValue must be a valid date"
    )
  })

  it("rejects a malformed minimum date", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" min="2026-02-30" />)).toThrow(
      "min must be a valid date"
    )
  })

  it("rejects a malformed maximum date", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" max="2026-02-30" />)).toThrow(
      "max must be a valid date"
    )
  })

  it("rejects malformed months", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" defaultMonth="2026-13" />)).toThrow(
      "defaultMonth must be a valid month"
    )
  })

  it("rejects ranges where min is after max", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" min="2026-08-21" max="2026-08-20" />)).toThrow(
      "min must not be after max"
    )
  })

  it("rejects an uncontrolled selected date outside the range", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" defaultValue="2026-08-09" min="2026-08-10" />)).toThrow(
      "defaultValue must be within min and max"
    )
  })

  it("rejects a controlled selected date outside the range", () => {
    expect(() => render(<Calendar aria-label="예약 날짜" value="2026-08-21" max="2026-08-20" />)).toThrow(
      "value must be within min and max"
    )
  })

  it("moves focus to the first enabled day when the range changes", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" />)
    const day1 = within(screen.getByRole("gridcell", { name: /2026년 8월 1일/ })).getByRole("button")

    day1.focus()
    await user.keyboard("{ArrowRight}")
    rerender(<Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" min="2026-08-10" />)

    expect(within(screen.getByRole("gridcell", { name: /2026년 8월 10일/ })).getByRole("button")).toHaveFocus()
  })

  it("preserves existing focus when the calendar first renders", () => {
    const { rerender } = render(<button type="button">날짜 선택 열기</button>)
    const trigger = screen.getByRole("button", { name: "날짜 선택 열기" })
    trigger.focus()

    rerender(
      <>
        <button type="button">날짜 선택 열기</button>
        <Calendar aria-label="예약 날짜" defaultMonth="2026-08" locale="ko-KR" />
      </>
    )

    expect(trigger).toHaveFocus()
  })
})
