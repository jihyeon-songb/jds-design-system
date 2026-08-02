import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it } from "vitest"
import {
  Switch as PublicSwitch,
  type SwitchProps as PublicSwitchProps,
  type SwitchSize as PublicSwitchSize,
} from "../index.js"
import { Switch, type SwitchProps, type SwitchSize } from "./Switch.js"

afterEach(cleanup)

describe("Switch", () => {
  it("exports the public component and types", () => {
    expect(PublicSwitch).toBe(Switch)
    expectTypeOf<PublicSwitchProps>().toEqualTypeOf<SwitchProps>()
    expectTypeOf<PublicSwitchSize>().toEqualTypeOf<SwitchSize>()
  })

  it("uses fixed native switch semantics", () => {
    const ref = createRef<HTMLInputElement>()
    render(
      <Switch
        ref={ref}
        aria-label="마케팅 정보 수신"
        name="marketing"
        required
        value="enabled"
      />
    )

    expect(ref.current).toHaveAttribute("type", "checkbox")
    expect(ref.current).toHaveAttribute("role", "switch")
    expect(ref.current).toHaveAttribute("data-size", "md")
    expect(ref.current).toBeRequired()
  })

  it("updates uncontrolled state and FormData", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Switch
          aria-label="마케팅 정보 수신"
          name="marketing"
          value="enabled"
        />
      </form>
    )
    const control = screen.getByRole("switch", { name: "마케팅 정보 수신" })

    await user.click(control)

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")
    expect(new FormData(control.closest("form")!).get("marketing")).toBe("enabled")
  })

  it("aligns uncontrolled state after form reset", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Switch aria-label="알림" defaultChecked />
        <button type="reset">초기화</button>
      </form>
    )
    const control = screen.getByRole("switch", { name: "알림" })

    await user.click(control)
    await user.click(screen.getByRole("button", { name: "초기화" }))

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("preserves controlled state after native changes", async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="알림" checked onChange={() => undefined} />)
    const control = screen.getByRole("switch", { name: "알림" })

    await user.click(control)

    expect(control).toBeChecked()
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("does not update uncontrolled state after a prevented change", async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="알림" onChange={(event) => event.preventDefault()} />)
    const control = screen.getByRole("switch", { name: "알림" })

    await user.click(control)

    expect(control).not.toBeChecked()
    expect(control).toHaveAttribute("data-state", "unchecked")
  })

  it("uses a native label and excludes disabled values", async () => {
    const user = userEvent.setup()
    render(
      <form>
        <label htmlFor="alert">알림</label>
        <Switch
          defaultChecked
          disabled
          id="alert"
          name="alert"
          value="on"
        />
      </form>
    )
    const control = screen.getByRole("switch", { name: "알림" })

    await user.click(screen.getByText("알림"))
    control.focus()
    await user.keyboard(" ")

    expect(control).toBeChecked()
    expect(new FormData(control.closest("form")!).has("alert")).toBe(false)
  })

  it("gives disabled precedence over invalid", () => {
    const { rerender } = render(
      <Switch aria-label="알림" checked invalid onChange={() => undefined} />
    )
    const control = screen.getByRole("switch", { name: "알림" })

    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control).toHaveAttribute("data-state", "invalid")

    rerender(
      <Switch
        aria-label="알림"
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
      <Switch aria-invalid="false" aria-label="알림" />
    )
    const control = screen.getByRole("switch", { name: "알림" })

    expect(control).toHaveAttribute("aria-invalid", "false")

    rerender(<Switch aria-invalid="false" aria-label="알림" invalid />)

    expect(control).toHaveAttribute("aria-invalid", "true")
  })

  it.each(["sm", "md", "lg", "xl"] as const)("exposes %s size", (size) => {
    render(<Switch aria-label={`${size} 스위치`} size={size} />)

    expect(screen.getByRole("switch", { name: `${size} 스위치` })).toHaveAttribute(
      "data-size",
      size
    )
  })
})
