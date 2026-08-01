import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
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

function ConditionalDeliveryGroup({ showStandard }: { showStandard: boolean }) {
  return (
    <form>
      <RadioGroup aria-label="배송 방식" name="delivery" defaultValue="standard">
        {showStandard ? <RadioGroupItem aria-label="일반 배송" value="standard" /> : null}
        <RadioGroupItem aria-label="빠른 배송" value="express" />
      </RadioGroup>
    </form>
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

  it("keeps the controlled value as the source of truth", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<DeliveryGroup value="standard" onValueChange={onValueChange} />)

    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))
    expect(onValueChange).toHaveBeenCalledWith("express")
    expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).not.toBeChecked()

    rerender(<DeliveryGroup value="express" onValueChange={onValueChange} />)
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toBeChecked()
  })

  it("skips value changes when the consumer prevents the change", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RadioGroup aria-label="배송 방식" defaultValue="standard" onValueChange={onValueChange}>
        <RadioGroupItem aria-label="일반 배송" value="standard" />
        <RadioGroupItem aria-label="빠른 배송" value="express" onChange={(event) => event.preventDefault()} />
      </RadioGroup>
    )

    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))

    expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).not.toBeChecked()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("keeps form reset synchronization when a sibling item unmounts", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ConditionalDeliveryGroup showStandard />)
    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))

    rerender(<ConditionalDeliveryGroup showStandard={false} />)
    screen.getByRole("radio", { name: "빠른 배송" }).closest("form")!.reset()
    rerender(<ConditionalDeliveryGroup showStandard />)

    expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).not.toBeChecked()
  })

  it("applies root and item state priority", () => {
    const { rerender } = render(<DeliveryGroup defaultValue="standard" />)

    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-state", "enabled")
    expect(screen.getByRole("radio", { name: "일반 배송" })).toHaveAttribute("data-state", "checked")
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toHaveAttribute("data-state", "unchecked")

    rerender(<DeliveryGroup defaultValue="standard" invalid />)
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-state", "invalid")
    expect(screen.getByRole("radio", { name: "일반 배송" })).toHaveAttribute("data-state", "invalid")

    rerender(<DeliveryGroup defaultValue="standard" invalid disabled />)
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-state", "disabled")
    expect(screen.getByRole("radio", { name: "일반 배송" })).toHaveAttribute("data-state", "disabled")
  })
})
