import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion.js"

afterEach(cleanup)

function Item({ children, disabled = false, value }: { children: string; disabled?: boolean; value: string }) {
  return (
    <AccordionItem disabled={disabled} value={value}>
      <AccordionHeader><AccordionTrigger>{value}</AccordionTrigger></AccordionHeader>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  )
}

describe("Accordion", () => {
  it("single Trigger와 Content를 연결하고 다시 닫는다", async () => {
    const user = userEvent.setup()
    render(
      <Accordion defaultValue="shipping" type="single">
        <Item value="shipping">배송 안내</Item>
        <Item value="returns">반품 안내</Item>
      </Accordion>
    )

    const shipping = screen.getByRole("button", { name: "shipping" })
    const content = screen.getByText("배송 안내")
    expect(shipping).toHaveAttribute("aria-expanded", "true")
    expect(shipping).toHaveAttribute("aria-controls", content.id)
    expect(content).toHaveAttribute("aria-labelledby", shipping.id)
    expect(content).not.toHaveAttribute("hidden")

    await user.click(shipping)

    expect(shipping).toHaveAttribute("aria-expanded", "false")
    expect(content).toHaveAttribute("hidden")
  })

  it("multiple은 기존 열린 항목을 유지하고 요청한 value만 전환한다", async () => {
    const user = userEvent.setup()
    render(
      <Accordion defaultValue={["shipping", "returns"]} type="multiple">
        <Item value="shipping">배송 안내</Item>
        <Item value="returns">반품 안내</Item>
        <Item value="payment">결제 안내</Item>
      </Accordion>
    )

    await user.click(screen.getByRole("button", { name: "payment" }))

    expect(screen.getByRole("button", { name: "shipping" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("button", { name: "payment" })).toHaveAttribute("aria-expanded", "true")

    await user.click(screen.getByRole("button", { name: "returns" }))

    expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "false")
  })
})
