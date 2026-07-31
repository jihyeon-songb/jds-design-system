import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
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

const groupedSelectParts = (
  <>
    <SelectTrigger aria-label="국가">
      <SelectValue placeholder="선택" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>아시아</SelectLabel>
        <SelectItem value="kr">대한민국</SelectItem>
        <SelectItem value="jp">일본</SelectItem>
      </SelectGroup>
    </SelectContent>
  </>
)

const selectPartsWithDisabledItem = (
  <>
    <SelectTrigger aria-label="국가">
      <SelectValue placeholder="선택" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="kr">대한민국</SelectItem>
      <SelectItem value="jp" disabled>일본</SelectItem>
      <SelectItem value="us">미국</SelectItem>
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

  it("renders the selected item text in server markup", () => {
    const html = renderToString(
      <Select defaultValue="kr">
        <SelectTrigger aria-label="국가"><SelectValue placeholder="선택" /></SelectTrigger>
        <SelectContent><SelectItem value="kr">대한민국</SelectItem></SelectContent>
      </Select>
    )
    const document = new DOMParser().parseFromString(html, "text/html")

    expect(document.querySelector('[data-slot="value"]')?.textContent).toBe("대한민국")
  })

  it("does not render a hidden input without name", () => {
    render(<Select>{selectParts}</Select>)

    expect(document.querySelector('input[type="hidden"]')).not.toBeInTheDocument()
  })

  it("omits a disabled Select from form data", () => {
    render(
      <form aria-label="국가 양식">
        <Select name="country" defaultValue="kr" disabled>{selectParts}</Select>
      </form>
    )

    const form = screen.getByRole<HTMLFormElement>("form", { name: "국가 양식" })
    expect(new FormData(form).has("country")).toBe(false)
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

  it("moves active options with the keyboard and selects with Enter", async () => {
    const user = userEvent.setup()
    render(<Select defaultValue="kr">{groupedSelectParts}</Select>)
    const trigger = screen.getByRole("combobox", { name: "국가" })

    await user.click(trigger)
    await user.keyboard("{ArrowDown}")
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "일본" }).id
    )
    await user.keyboard("{Enter}")

    expect(trigger).toHaveTextContent("일본")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveFocus()
  })

  it("skips disabled options and closes without changing value on Escape", async () => {
    const user = userEvent.setup()
    render(<Select defaultValue="kr">{selectPartsWithDisabledItem}</Select>)
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    await user.keyboard("{ArrowDown}")
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "미국" }).id
    )
    await user.keyboard("{Escape}")

    expect(trigger).toHaveTextContent("대한민국")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("exposes combobox, listbox, group, label, and option semantics", async () => {
    const user = userEvent.setup()
    render(<Select>{groupedSelectParts}</Select>)
    const trigger = screen.getByRole("combobox")

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox")
    expect(trigger).toHaveAttribute("aria-controls")
    await user.click(trigger)

    const listbox = screen.getByRole("listbox")
    expect(listbox).toHaveAttribute("id", trigger.getAttribute("aria-controls"))
    expect(screen.getByRole("group", { name: "아시아" })).toBeInTheDocument()
    expect(screen.getByText("아시아")).toHaveAttribute("id")
    expect(screen.getByRole("option", { name: "대한민국" })).toHaveAttribute(
      "aria-selected",
      "false"
    )
  })

  it("keeps supplied content and label ids in ARIA associations", () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="국가"><SelectValue /></SelectTrigger>
        <SelectContent id="country-list">
          <SelectGroup>
            <SelectLabel id="asia-label">아시아</SelectLabel>
            <SelectItem value="kr">대한민국</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-controls", "country-list")
    expect(screen.getByRole("listbox")).toHaveAttribute("id", "country-list")
    expect(screen.getByRole("group")).toHaveAttribute("aria-labelledby", "asia-label")
    expect(screen.getByText("아시아")).toHaveAttribute("id", "asia-label")
  })

  it("renders supplied ARIA associations in server markup", () => {
    const html = renderToString(
      <Select defaultOpen>
        <SelectTrigger aria-label="국가"><SelectValue /></SelectTrigger>
        <SelectContent id="country-list">
          <SelectGroup>
            <SelectLabel id="asia-label">아시아</SelectLabel>
            <SelectItem value="kr">대한민국</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
    const document = new DOMParser().parseFromString(html, "text/html")

    expect(document.querySelector('[data-slot="trigger"]')?.getAttribute("aria-controls"))
      .toBe("country-list")
    expect(document.querySelector('[data-slot="group"]')?.getAttribute("aria-labelledby"))
      .toBe("asia-label")
  })

  it("omits ARIA relationships without matching server markup targets", () => {
    const html = renderToString(
      <Select defaultOpen>
        <SelectTrigger aria-label="국가"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="kr">대한민국</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
    const document = new DOMParser().parseFromString(html, "text/html")

    expect(document.querySelector('[data-slot="group"]')?.hasAttribute("aria-labelledby"))
      .toBe(false)

    const triggerOnlyHtml = renderToString(
      <Select><SelectTrigger aria-label="국가"><SelectValue /></SelectTrigger></Select>
    )
    const triggerOnlyDocument = new DOMParser().parseFromString(triggerOnlyHtml, "text/html")
    expect(triggerOnlyDocument.querySelector('[data-slot="trigger"]')
      ?.hasAttribute("aria-controls")).toBe(false)
  })

  it("uses boundaries without wrapping and opens ArrowUp on the last option", async () => {
    const user = userEvent.setup()
    render(<Select>{selectPartsWithDisabledItem}</Select>)
    const trigger = screen.getByRole("combobox")

    trigger.focus()
    await user.keyboard("{ArrowUp}")
    const firstOption = screen.getByRole("option", { name: "대한민국" })
    const lastOption = screen.getByRole("option", { name: "미국" })
    expect(trigger).toHaveAttribute("aria-activedescendant", lastOption.id)

    await user.keyboard("{ArrowDown}")
    expect(trigger).toHaveAttribute("aria-activedescendant", lastOption.id)
    await user.keyboard("{Home}")
    expect(trigger).toHaveAttribute("aria-activedescendant", firstOption.id)
    await user.keyboard("{ArrowUp}")
    expect(trigger).toHaveAttribute("aria-activedescendant", firstOption.id)
    await user.keyboard("{End}")
    expect(trigger).toHaveAttribute("aria-activedescendant", lastOption.id)
  })

  it("keeps DOM navigation order after an item registration updates", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Select>
        <SelectTrigger aria-label="항목"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
          <SelectItem value="c">C</SelectItem>
        </SelectContent>
      </Select>
    )

    rerender(
      <Select>
        <SelectTrigger aria-label="항목"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B updated</SelectItem>
          <SelectItem value="c">C</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByRole("combobox")
    await user.click(trigger)
    await user.keyboard("{ArrowDown}")

    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "B updated" }).id
    )
  })

  it("moves to the first matching option with typeahead", async () => {
    const user = userEvent.setup()
    render(<Select>{selectParts}</Select>)
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    await user.keyboard("ㅇ")

    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "일본" }).id
    )
  })

  it("opens and selects the first option with Space", async () => {
    const user = userEvent.setup()
    render(<Select>{selectParts}</Select>)
    const trigger = screen.getByRole("combobox")

    trigger.focus()
    await user.keyboard(" ")
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "대한민국" }).id
    )
    await user.keyboard(" ")

    expect(trigger).toHaveTextContent("대한민국")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("closes on trigger blur without changing the value", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Select defaultValue="kr">{selectParts}</Select>
        <button type="button">다음</button>
      </div>
    )
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    await user.tab()

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(trigger).toHaveTextContent("대한민국")
  })

  it("requests controlled open changes without replacing the supplied state", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Select open onOpenChange={onOpenChange}>{selectParts}</Select>)

    await user.click(screen.getByRole("combobox"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("uses the latest open change listener for an outside pointerdown", async () => {
    const user = userEvent.setup()
    const firstOnOpenChange = vi.fn()
    const latestOnOpenChange = vi.fn()
    const { rerender } = render(
      <div>
        <Select defaultOpen onOpenChange={firstOnOpenChange}>{selectParts}</Select>
        <button type="button">바깥</button>
      </div>
    )

    rerender(
      <div>
        <Select defaultOpen onOpenChange={latestOnOpenChange}>{selectParts}</Select>
        <button type="button">바깥</button>
      </div>
    )
    await user.pointer({
      target: screen.getByRole("button", { name: "바깥" }),
      keys: "[MouseLeft>]",
    })

    expect(firstOnOpenChange).not.toHaveBeenCalled()
    expect(latestOnOpenChange).toHaveBeenCalledWith(false)
  })

  it("selects by pointer without moving focus and closes on outside pointerdown", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Select>{selectParts}</Select>
        <button type="button">바깥</button>
      </div>
    )
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    await user.click(screen.getByRole("option", { name: "일본" }))
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveTextContent("일본")

    await user.click(trigger)
    await user.pointer({
      target: screen.getByRole("button", { name: "바깥" }),
      keys: "[MouseLeft>]",
    })
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("keeps the list open and trigger focused when a disabled option is clicked", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Select defaultValue="kr" onValueChange={onValueChange}>
        {selectPartsWithDisabledItem}
      </Select>
    )
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    await user.click(screen.getByRole("option", { name: "일본" }))

    expect(screen.getByRole("listbox")).toBeVisible()
    expect(trigger).toHaveTextContent("대한민국")
    expect(trigger).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("does not open or submit a value while disabled", async () => {
    const user = userEvent.setup()
    render(<Select disabled name="country">{selectParts}</Select>)

    await user.click(screen.getByRole("combobox"))

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(document.querySelector('input[name="country"]')).toBeDisabled()
  })

  it("exposes open and invalid states for token styles", async () => {
    const user = userEvent.setup()
    render(<Select invalid>{selectParts}</Select>)
    const trigger = screen.getByRole("combobox")

    expect(trigger).toHaveAttribute("data-state", "invalid")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("data-state", "open")
  })

  it("exposes active, selected, disabled, and idle item states", async () => {
    const user = userEvent.setup()
    render(<Select defaultValue="kr">{selectPartsWithDisabledItem}</Select>)
    const trigger = screen.getByRole("combobox")

    await user.click(trigger)
    expect(screen.getByRole("option", { name: "대한민국" })).toHaveAttribute("data-state", "active")
    expect(screen.getByRole("option", { name: "일본" })).toHaveAttribute("data-state", "disabled")
    expect(screen.getByRole("option", { name: "미국" })).toHaveAttribute("data-state", "idle")

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("option", { name: "대한민국" })).toHaveAttribute("data-state", "selected")
    expect(screen.getByRole("option", { name: "미국" })).toHaveAttribute("data-state", "active")
  })
})
