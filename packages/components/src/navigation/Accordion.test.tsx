import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Accordion as PublicAccordion,
  AccordionContent as PublicAccordionContent,
  AccordionHeader as PublicAccordionHeader,
  AccordionItem as PublicAccordionItem,
  AccordionTrigger as PublicAccordionTrigger,
  type AccordionProps as PublicAccordionProps,
} from "../index.js"
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
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

  it("controlled single은 요청만 알리고 owner가 바꾸기 전에는 상태를 유지한다", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Accordion onValueChange={onValueChange} type="single" value="shipping">
        <Item value="shipping">배송 안내</Item>
        <Item value="returns">반품 안내</Item>
      </Accordion>
    )

    await user.click(screen.getByRole("button", { name: "returns" }))

    expect(onValueChange).toHaveBeenLastCalledWith("returns")
    expect(screen.getByRole("button", { name: "shipping" })).toHaveAttribute("aria-expanded", "true")

    rerender(
      <Accordion onValueChange={onValueChange} type="single" value="returns">
        <Item value="shipping">배송 안내</Item>
        <Item value="returns">반품 안내</Item>
      </Accordion>
    )

    expect(screen.getByRole("button", { name: "returns" })).toHaveAttribute("aria-expanded", "true")
  })

  it("open인 disabled Item을 보존하고 상태 변경 요청을 막는다", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Accordion defaultValue="shipping" onValueChange={onValueChange} type="single">
        <Item disabled value="shipping">배송 안내</Item>
      </Accordion>
    )

    const trigger = screen.getByRole("button", { name: "shipping" })
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger.closest("div")).toHaveAttribute("data-state", "disabled")

    await user.click(trigger)

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("요청한 heading과 native button 기본 동작을 사용한다", () => {
    const headerRef = createRef<HTMLHeadingElement>()
    render(
      <Accordion headingLevel={2} type="single">
        <AccordionItem value="shipping">
          <AccordionHeader ref={headerRef}><AccordionTrigger>배송</AccordionTrigger></AccordionHeader>
          <AccordionContent>배송 안내</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    const trigger = screen.getByRole("button", { name: "배송" })
    expect(headerRef.current?.tagName).toBe("H2")
    expect(trigger).toHaveAttribute("type", "button")
    expect(fireEvent.keyDown(trigger, { key: "Tab" })).toBe(true)
  })

  it("preventDefault를 존중한다", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Accordion defaultValue="shipping" onValueChange={onValueChange} type="single">
        <AccordionItem value="shipping">
          <AccordionHeader><AccordionTrigger onClick={(event) => event.preventDefault()}>배송</AccordionTrigger></AccordionHeader>
          <AccordionContent>배송 안내</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    await user.click(screen.getByRole("button", { name: "배송" }))

    expect(screen.getByRole("button", { name: "배송" })).toHaveAttribute("aria-expanded", "true")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("public API를 export하고 잘못된 compound 위치에는 오류를 낸다", () => {
    expect(PublicAccordion).toBe(Accordion)
    expect(PublicAccordionItem).toBe(AccordionItem)
    expect(PublicAccordionHeader).toBe(AccordionHeader)
    expect(PublicAccordionTrigger).toBe(AccordionTrigger)
    expect(PublicAccordionContent).toBe(AccordionContent)
    expectTypeOf<PublicAccordionProps>().toEqualTypeOf<AccordionProps>()
    expect(() => render(<AccordionItem value="shipping">배송</AccordionItem>)).toThrow(
      "Accordion compound components must be used within Accordion"
    )
    expect(() => render(<Accordion type="single"><AccordionTrigger>배송</AccordionTrigger></Accordion>)).toThrow(
      "Accordion item components must be used within AccordionItem"
    )
  })

  it("중복 Item value에도 고유한 ARIA ID를 만든다", () => {
    render(
      <Accordion defaultValue="shipping" type="single">
        <Item value="shipping">첫 배송 안내</Item>
        <Item value="shipping">두 번째 배송 안내</Item>
      </Accordion>
    )

    const [firstTrigger, secondTrigger] = screen.getAllByRole("button", { name: "shipping" })
    const firstContent = screen.getByText("첫 배송 안내")
    const secondContent = screen.getByText("두 번째 배송 안내")
    expect(firstTrigger.id).not.toBe(secondTrigger.id)
    expect(firstContent.id).not.toBe(secondContent.id)
    expect(firstTrigger).toHaveAttribute("aria-controls", firstContent.id)
    expect(secondTrigger).toHaveAttribute("aria-controls", secondContent.id)
  })

  it("Trigger는 AccordionHeader 안에서만 렌더링한다", () => {
    expect(() => render(
      <Accordion type="single">
        <AccordionItem value="shipping"><AccordionTrigger>배송</AccordionTrigger></AccordionItem>
      </Accordion>
    )).toThrow("Accordion triggers must be used within AccordionHeader")
  })
})
