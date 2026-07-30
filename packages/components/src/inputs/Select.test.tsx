import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./Select.js"

afterEach(cleanup)

const selectParts = (
  <>
    <SelectTrigger aria-label="국가">
      <SelectValue placeholder="선택" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="kr">대한민국</SelectItem>
      <SelectItem value="jp">일본</SelectItem>
    </SelectContent>
  </>
)

describe("Select", () => {
  it("renders the compound parts", () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="국가">
          <SelectValue placeholder="선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup aria-label="동아시아">
            <SelectLabel>지역</SelectLabel>
            <SelectItem value="kr">대한민국</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole("combobox", { name: "국가" })).toHaveTextContent("선택")
    expect(screen.getByRole("listbox")).toBeVisible()
    expect(screen.getByRole("group", { name: "동아시아" })).toBeVisible()
    expect(screen.getByText("지역")).toBeVisible()
    expect(screen.getByRole("option", { name: "대한민국" })).toBeVisible()
  })

  it("renders the selected item text and submits its value through name", () => {
    render(
      <form>
        <Select name="country" defaultValue="kr">
          <SelectTrigger aria-label="국가"><SelectValue placeholder="선택" /></SelectTrigger>
          <SelectContent><SelectItem value="kr">대한민국</SelectItem></SelectContent>
        </Select>
      </form>
    )

    expect(screen.getByRole("combobox", { name: "국가" })).toHaveTextContent("대한민국")
    expect(document.querySelector('input[type="hidden"]')).toHaveAttribute("name", "country")
    expect(document.querySelector('input[type="hidden"]')).toHaveValue("kr")
  })

  it("updates an uncontrolled value after selection", async () => {
    const user = userEvent.setup()
    render(<Select name="country">{selectParts}</Select>)

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "일본" }))

    expect(screen.getByRole("combobox")).toHaveTextContent("일본")
    expect(document.querySelector('input[type="hidden"]')).toHaveValue("jp")
  })

  it("requests controlled changes without replacing the supplied value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Select value="kr" onValueChange={onValueChange}>{selectParts}</Select>)

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: "일본" }))

    expect(onValueChange).toHaveBeenCalledWith("jp")
    expect(screen.getByRole("combobox")).toHaveTextContent("대한민국")
  })
})
