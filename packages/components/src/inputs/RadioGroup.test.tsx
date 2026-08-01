import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { RadioGroup, RadioGroupItem } from "./RadioGroup.js"

afterEach(cleanup)

function DeliveryGroup(props: Partial<React.ComponentProps<typeof RadioGroup>> = {}) {
  return (
    <RadioGroup aria-label="배송 방식" name="delivery" {...props}>
      <RadioGroupItem id="standard" value="standard" />
      <label htmlFor="standard">일반 배송</label>
      <RadioGroupItem id="express" value="express" />
      <label htmlFor="express">빠른 배송</label>
    </RadioGroup>
  )
}

describe("RadioGroup", () => {
  it("renders fixed native radios and forwards ref and form props", () => {
    const ref = createRef<HTMLInputElement>()
    render(<RadioGroup aria-label="배송 방식" name="delivery" required><RadioGroupItem ref={ref} id="standard" value="standard" form="checkout" /></RadioGroup>)
    expect(ref.current).toHaveAttribute("type", "radio")
    expect(ref.current).toHaveAttribute("name", "delivery")
    expect(ref.current).toHaveAttribute("value", "standard")
    expect(ref.current).toHaveAttribute("form", "checkout")
    expect(ref.current).toBeRequired()
  })

  it("updates uncontrolled value and native FormData", async () => {
    const user = userEvent.setup()
    render(<form><DeliveryGroup defaultValue="standard" /></form>)
    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))
    expect(screen.getByRole("radio", { name: "일반 배송" })).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toBeChecked()
    expect(new FormData(screen.getByRole("radio", { name: "빠른 배송" }).closest("form")!).get("delivery")).toBe("express")
  })
})
