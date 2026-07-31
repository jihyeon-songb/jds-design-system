import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it } from "vitest"
import {
  Checkbox as PublicCheckbox,
  type CheckboxProps as PublicCheckboxProps,
} from "../index.js"
import { Checkbox, type CheckboxProps } from "./Checkbox.js"

afterEach(cleanup)

describe("Checkbox", () => {
  it("exports the public component and props type", () => {
    expect(PublicCheckbox).toBe(Checkbox)
    expectTypeOf<PublicCheckboxProps>().toEqualTypeOf<CheckboxProps>()
  })

  it("fixes the native type and forwards the ref and form props", () => {
    const ref = createRef<HTMLInputElement>()
    render(
      <Checkbox
        ref={ref}
        aria-label="약관 동의"
        name="terms"
        required
        value="accepted"
      />
    )

    expect(ref.current).toHaveAttribute("type", "checkbox")
    expect(ref.current).toHaveAttribute("name", "terms")
    expect(ref.current).toHaveAttribute("value", "accepted")
    expect(ref.current).toBeRequired()
  })

  it("updates uncontrolled data-state after a native change", async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="약관 동의" defaultChecked />)
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")

    await user.click(control)

    expect(control).not.toBeChecked()
    expect(control).toHaveAttribute("data-state", "unchecked")
  })

  it("keeps uncontrolled data-state aligned when onChange prevents the change", async () => {
    const user = userEvent.setup()
    render(
      <Checkbox
        aria-label="약관 동의"
        onChange={(event) => event.preventDefault()}
      />
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    await user.click(control)

    expect(control).not.toBeChecked()
    expect(control).toHaveAttribute("data-state", "unchecked")
  })

  it("keeps uncontrolled data-state aligned after its form resets", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Checkbox aria-label="약관 동의" defaultChecked />
        <button type="reset">초기화</button>
      </form>
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    await user.click(control)
    await user.click(screen.getByRole("button", { name: "초기화" }))

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("preserves controlled checked state after a native change", async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="약관 동의" checked onChange={() => undefined} />)
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    await user.click(control)

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("keeps disabled values unchanged and excludes them from FormData", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Checkbox
          aria-label="약관 동의"
          defaultChecked
          disabled
          name="terms"
          value="accepted"
        />
      </form>
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    await user.click(control)
    await user.keyboard(" ")

    expect(control).toBeChecked()
    expect(new FormData(control.closest("form")!).has("terms")).toBe(false)
  })

  it("makes invalid ARIA explicit and gives disabled state precedence", () => {
    const { rerender } = render(
      <Checkbox aria-label="약관 동의" checked invalid onChange={() => undefined} />
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control).toHaveAttribute("data-state", "invalid")

    rerender(
      <Checkbox
        aria-label="약관 동의"
        checked
        disabled
        invalid
        onChange={() => undefined}
      />
    )

    expect(control).toHaveAttribute("data-state", "disabled")
  })

  it("preserves caller aria-invalid unless invalid is true", () => {
    const { rerender } = render(
      <Checkbox aria-invalid="false" aria-label="약관 동의" />
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    expect(control).toHaveAttribute("aria-invalid", "false")

    rerender(
      <Checkbox aria-invalid="false" aria-label="약관 동의" invalid />
    )

    expect(control).toHaveAttribute("aria-invalid", "true")
  })

  it("uses a native label as its accessible name and submits its checked value", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <label>
          <Checkbox name="terms" value="accepted" />
          약관 동의
        </label>
      </form>
    )
    const control = screen.getByRole("checkbox", { name: "약관 동의" })

    await user.click(screen.getByText("약관 동의"))

    expect(control).toBeChecked()
    expect(new FormData(control.closest("form")!).get("terms")).toBe("accepted")
  })
})
