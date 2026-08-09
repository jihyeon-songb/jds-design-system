import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  RadioGroup as PublicRadioGroup,
  RadioGroupItem as PublicRadioGroupItem,
  type RadioGroupItemProps as PublicRadioGroupItemProps,
  type RadioGroupProps as PublicRadioGroupProps,
} from "../index.js"
import {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupProps,
} from "./RadioGroup.js"

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
  it("exports the public components and props types", () => {
    expect(PublicRadioGroup).toBe(RadioGroup)
    expect(PublicRadioGroupItem).toBe(RadioGroupItem)
    expectTypeOf<PublicRadioGroupProps>().toEqualTypeOf<RadioGroupProps>()
    expectTypeOf<PublicRadioGroupItemProps>().toEqualTypeOf<RadioGroupItemProps>()
  })

  it("renders the root CSS class while preserving consumer className", () => {
    render(
      <RadioGroup aria-label="배송 방식" name="delivery" className="custom-group" orientation="horizontal">
        <RadioGroupItem aria-label="일반 배송" value="standard" />
      </RadioGroup>
    )

    const group = screen.getByRole("radiogroup", { name: "배송 방식" })
    expect(group).toHaveClass("jdsb-radio-group", "custom-group")
    expect(group).toHaveAttribute("data-orientation", "horizontal")
  })

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
    expect(screen.getByRole("radio", { name: "일반 배송" })).toHaveAttribute("data-state", "unchecked")
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toHaveAttribute("data-state", "checked")
    expect(new FormData(screen.getByRole("radio", { name: "빠른 배송" }).closest("form")!).get("delivery")).toBe("express")
  })

  it("keeps controlled value and does not notify after a prevented change", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender, unmount } = render(<DeliveryGroup value="standard" onValueChange={onValueChange} />)

    await user.click(screen.getByRole("radio", { name: "빠른 배송" }))
    expect(onValueChange).toHaveBeenCalledWith("express")
    expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "빠른 배송" })).not.toBeChecked()

    rerender(<DeliveryGroup value="express" onValueChange={onValueChange} />)
    expect(screen.getByRole("radio", { name: "빠른 배송" })).toBeChecked()

    unmount()
    render(
      <RadioGroup aria-label="배송 방식" name="delivery" onValueChange={onValueChange}>
        <RadioGroupItem aria-label="일반 배송" value="standard" onChange={(event) => event.preventDefault()} />
      </RadioGroup>
    )

    await user.click(screen.getByRole("radio", { name: "일반 배송" }))
    expect(screen.getByRole("radio", { name: "일반 배송" })).not.toBeChecked()
    expect(onValueChange).not.toHaveBeenCalledWith("standard")
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

  it("aligns data-state after form reset and preserves native keyboard behavior", async () => {
    const user = userEvent.setup()
    render(<form><DeliveryGroup defaultValue="standard" /><button type="reset">초기화</button></form>)
    const standard = screen.getByRole("radio", { name: "일반 배송" })
    const express = screen.getByRole("radio", { name: "빠른 배송" })

    standard.focus()
    await user.keyboard("{ArrowRight}")
    expect(express).toBeChecked()
    expect(express).toHaveAttribute("data-state", "checked")

    await user.click(screen.getByRole("button", { name: "초기화" }))
    expect(standard).toBeChecked()
    expect(standard).toHaveAttribute("data-state", "checked")
  })

  it("applies group and item disabled, invalid, required state precedence", () => {
    const { rerender } = render(<DeliveryGroup defaultValue="standard" invalid required />)
    const group = screen.getByRole("radiogroup", { name: "배송 방식" })
    const standard = screen.getByRole("radio", { name: "일반 배송" })

    expect(group).toHaveAttribute("aria-invalid", "true")
    expect(standard).toBeRequired()
    expect(standard).toHaveAttribute("data-state", "invalid")

    rerender(<DeliveryGroup defaultValue="standard" disabled invalid />)
    expect(group).toHaveAttribute("data-state", "disabled")
    expect(standard).toBeDisabled()
    expect(standard).toHaveAttribute("data-state", "disabled")
  })

  it("checks an item when its native label is clicked", async () => {
    const user = userEvent.setup()
    render(<DeliveryGroup />)

    await user.click(screen.getByText("일반 배송"))

    expect(screen.getByRole("radio", { name: "일반 배송" })).toBeChecked()
  })

  it("rejects items outside a RadioGroup", () => {
    expect(() => render(<RadioGroupItem value="standard" />)).toThrow(
      "RadioGroupItem must be used within RadioGroup"
    )
  })
})
