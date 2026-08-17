import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "./Combobox.js"

afterEach(cleanup)

const cityOptions = (
  <>
    <ComboboxInput aria-label="도시" />
    <ComboboxList>
      <ComboboxOption value="seoul">서울</ComboboxOption>
      <ComboboxOption value="busan">부산</ComboboxOption>
      <ComboboxOption value="jeju" disabled>제주</ComboboxOption>
      <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
    </ComboboxList>
  </>
)

describe("Combobox", () => {
  it("links the input to its listbox", () => {
    render(<Combobox defaultOpen>{cityOptions}</Combobox>)

    const input = screen.getByRole("combobox", { name: "도시" })
    expect(input).toHaveAttribute("aria-haspopup", "listbox")
    expect(input).toHaveAttribute("aria-autocomplete", "list")
    expect(input).toHaveAttribute("aria-expanded", "true")
    expect(input).toHaveAttribute("aria-controls")
    expect(input.getAttribute("aria-controls")).not.toBe("")
    expect(screen.getByRole("listbox")).toHaveAttribute("id", input.getAttribute("aria-controls"))
  })

  it("filters text case-insensitively and submits the selected value", async () => {
    const user = userEvent.setup()
    render(
      <form aria-label="도시 양식">
        <Combobox name="city" defaultValue="seoul">{cityOptions}</Combobox>
      </form>
    )
    const input = screen.getByRole("combobox", { name: "도시" })

    await user.clear(input)
    await user.type(input, "부")

    expect(screen.getByRole("option", { name: "부산" })).toBeVisible()
    expect(screen.queryByRole("option", { name: "서울" })).not.toBeInTheDocument()
    expect(new FormData(screen.getByRole("form", { name: "도시 양식" }) as HTMLFormElement).get("city")).toBe("seoul")

    await user.clear(input)
    await user.type(input, "서울")
    expect(screen.getByRole("option", { name: "서울" })).toBeVisible()
  })

  it("filters option labels case-insensitively", async () => {
    const user = userEvent.setup()
    render(
      <Combobox>
        <ComboboxInput aria-label="도시" />
        <ComboboxList><ComboboxOption value="daejeon">Daejeon</ComboboxOption></ComboboxList>
      </Combobox>
    )

    const input = screen.getByRole("combobox", { name: "도시" })
    await user.click(input)
    await user.type(input, "DAE")

    expect(screen.getByRole("option", { name: "Daejeon" })).toBeVisible()
  })

  it("shows the empty message when the full Korean query has no match", async () => {
    const user = userEvent.setup()
    render(<Combobox>{cityOptions}</Combobox>)

    await user.click(screen.getByRole("combobox", { name: "도시" }))
    await user.type(screen.getByRole("combobox", { name: "도시" }), "인천광역시")

    expect(screen.getByText("검색 결과가 없습니다.")).toBeVisible()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("does not submit a hidden value without a name", () => {
    render(<form aria-label="도시 양식"><Combobox defaultValue="seoul">{cityOptions}</Combobox></form>)

    expect(new FormData(screen.getByRole("form", { name: "도시 양식" }) as HTMLFormElement).entries().next().done).toBe(true)
  })

  it("omits disabled values from FormData and makes the input required", () => {
    render(
      <form aria-label="도시 양식">
        <Combobox name="city" defaultValue="seoul" disabled required>{cityOptions}</Combobox>
      </form>
    )

    const input = screen.getByRole("combobox", { name: "도시" })
    expect(input).toBeDisabled()
    expect(input).toBeRequired()
    expect(new FormData(screen.getByRole("form", { name: "도시 양식" }) as HTMLFormElement).has("city")).toBe(false)
  })

  it("requests controlled value and open changes without replacing supplied state", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <Combobox value="seoul" open onValueChange={onValueChange} onOpenChange={onOpenChange}>
        {cityOptions}
      </Combobox>
    )

    await user.click(screen.getByRole("option", { name: "부산" }))
    await user.click(screen.getByRole("combobox", { name: "도시" }))

    expect(onValueChange).toHaveBeenCalledWith("busan")
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("combobox", { name: "도시" })).toHaveValue("서울")
    expect(screen.getByRole("listbox")).toBeVisible()
  })

  it("keeps focus on input and selects the active enabled option", async () => {
    const user = userEvent.setup()
    render(<Combobox>{cityOptions}</Combobox>)
    const input = screen.getByRole("combobox", { name: "도시" })

    await user.click(input)
    await user.keyboard("{ArrowDown}{Enter}")

    expect(input).toHaveFocus()
    expect(input).toHaveValue("부산")
    expect(input).toHaveAttribute("aria-expanded", "false")
  })

  it("skips disabled options and stops at keyboard boundaries", async () => {
    const user = userEvent.setup()
    render(<Combobox>{cityOptions}</Combobox>)
    const input = screen.getByRole("combobox", { name: "도시" })

    await user.click(input)
    await user.keyboard("{ArrowDown}")
    const busan = screen.getByRole("option", { name: "부산" })
    expect(input).toHaveAttribute("aria-activedescendant", busan.id)
    await user.keyboard("{ArrowDown}{End}")
    expect(input).toHaveAttribute("aria-activedescendant", busan.id)
    await user.keyboard("{Home}{ArrowUp}")
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "서울" }).id
    )
  })

  it("restores the selected text and closes on Escape", async () => {
    const user = userEvent.setup()
    render(<Combobox defaultValue="seoul">{cityOptions}</Combobox>)
    const input = screen.getByRole("combobox", { name: "도시" })

    await user.clear(input)
    await user.type(input, "부")
    await user.keyboard("{Escape}")

    expect(input).toHaveFocus()
    expect(input).toHaveValue("서울")
    expect(input).toHaveAttribute("aria-expanded", "false")
  })

  it("selects an option by click while keeping focus on the input", async () => {
    const user = userEvent.setup()
    render(<Combobox>{cityOptions}</Combobox>)
    const input = screen.getByRole("combobox", { name: "도시" })

    await user.click(input)
    await user.click(screen.getByRole("option", { name: "서울" }))

    expect(input).toHaveFocus()
    expect(input).toHaveValue("서울")
    expect(input).toHaveAttribute("aria-expanded", "false")
  })

  it.each([
    ["input", <ComboboxInput aria-label="도시" />],
    ["list", <ComboboxList />],
    ["option", <ComboboxOption value="seoul">서울</ComboboxOption>],
    ["empty", <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>],
  ])("rejects a %s compound part outside Combobox", (_part, child) => {
    expect(() => render(child)).toThrow("Combobox compound components must be used within Combobox")
  })
})
