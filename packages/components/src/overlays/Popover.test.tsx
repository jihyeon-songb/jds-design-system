import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Popover as PublicPopover,
  PopoverContent as PublicPopoverContent,
  PopoverTrigger as PublicPopoverTrigger,
  type PopoverContentProps as PublicPopoverContentProps,
  type PopoverProps as PublicPopoverProps,
  type PopoverSide as PublicPopoverSide,
  type PopoverTriggerProps as PublicPopoverTriggerProps,
} from "../index.js"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
  type PopoverSide,
  type PopoverTriggerProps,
} from "./Popover.js"

afterEach(cleanup)

describe("Popover", () => {
  it("package entry에서 Popover API를 export한다", () => {
    expect(PublicPopover).toBe(Popover)
    expect(PublicPopoverTrigger).toBe(PopoverTrigger)
    expect(PublicPopoverContent).toBe(PopoverContent)
    expectTypeOf<PublicPopoverProps>().toEqualTypeOf<PopoverProps>()
    expectTypeOf<PublicPopoverTriggerProps>().toEqualTypeOf<PopoverTriggerProps>()
    expectTypeOf<PublicPopoverContentProps>().toEqualTypeOf<PopoverContentProps>()
    expectTypeOf<PublicPopoverSide>().toEqualTypeOf<PopoverSide>()
  })

  it("uncontrolled Trigger가 popover를 열고 Escape 뒤 focus를 복귀한다", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Popover><PopoverTrigger>설정</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>)
    const trigger = screen.getByRole("button", { name: "설정" })
    const content = screen.getByText("내용")

    expect(trigger).toHaveAttribute("type", "button")
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
    expect(content).toHaveAttribute("data-state", "closed")
    expect(content).toHaveAttribute("hidden")
    expect(content).toHaveAttribute("popover", "auto")
    expect(content).toHaveAttribute("data-side", "bottom")
    const contentId = content.id
    expect(contentId).not.toBe("")
    rerender(<Popover><PopoverTrigger>설정</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>)
    expect(screen.getByText("내용")).toHaveAttribute("id", contentId)
    await user.click(trigger)
    expect(content).toHaveAttribute("data-state", "open")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger).toHaveAttribute("aria-controls", content.id)
    expect(trigger).toHaveAttribute("popovertarget", content.id)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(content).toHaveAttribute("data-state", "closed")
    expect(trigger).toHaveFocus()
  })

  it("controlled Popover는 close를 요청하고 상태를 직접 바꾸지 않는다", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Popover open onOpenChange={onOpenChange}><PopoverTrigger>설정</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByText("내용")).toHaveAttribute("data-state", "open")

    await user.click(screen.getByRole("button", { name: "설정" }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("controlled native Popover는 close 요청 뒤 open prop을 DOM source로 유지한다", () => {
    const showPopoverDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "showPopover")
    Object.defineProperty(HTMLElement.prototype, "showPopover", {
      configurable: true,
      value(this: HTMLElement) {
        this.setAttribute("data-native-open", "")
      },
    })

    try {
      const onOpenChange = vi.fn()
      render(<Popover open onOpenChange={onOpenChange}><PopoverTrigger>설정</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>)
      const content = screen.getByText("내용")
      const toggleEvent = new Event("toggle")
      Object.defineProperties(toggleEvent, {
        newState: { value: "closed" },
        oldState: { value: "open" },
      })

      content.removeAttribute("data-native-open")
      fireEvent(content, toggleEvent)

      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(content).toHaveAttribute("data-native-open")
    } finally {
      if (showPopoverDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "showPopover", showPopoverDescriptor)
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "showPopover")
      }
    }
  })

  it("외부 pointerdown만 닫기를 요청하고 취소된 Trigger click은 무시한다", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Popover defaultOpen onOpenChange={onOpenChange}>
        <PopoverTrigger onClick={(event) => event.preventDefault()}>설정</PopoverTrigger>
        <PopoverContent><button type="button">내부</button></PopoverContent>
      </Popover>
    )

    await user.click(screen.getByRole("button", { name: "설정" }))
    fireEvent.pointerDown(screen.getByRole("button", { name: "내부" }))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.pointerDown(document.body)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("native props, refs, className과 requested side를 전달한다", () => {
    const triggerRef = createRef<HTMLButtonElement>()
    const contentRef = createRef<HTMLDivElement>()
    render(
      <Popover className="consumer-root" title="설정">
        <PopoverTrigger className="consumer-trigger" ref={triggerRef}>설정</PopoverTrigger>
        <PopoverContent aria-label="설정 옵션" className="consumer-content" ref={contentRef} side="left">내용</PopoverContent>
      </Popover>
    )

    expect(triggerRef.current).toHaveClass("jdsb-popover-trigger", "consumer-trigger")
    expect(contentRef.current).toHaveClass("jdsb-popover-content", "consumer-content")
    expect(contentRef.current).toHaveAttribute("data-side", "left")
    expect(contentRef.current).toHaveAttribute("aria-label", "설정 옵션")
    expect(contentRef.current?.parentElement).toHaveClass("jdsb-popover", "consumer-root")
  })

  it.each<PopoverSide>(["top", "right", "bottom", "left"])("%s side를 노출한다", (side) => {
    render(<Popover><PopoverTrigger>설정</PopoverTrigger><PopoverContent side={side}>내용</PopoverContent></Popover>)
    expect(screen.getByText("내용")).toHaveAttribute("data-side", side)
  })

  it("compound part가 Popover 밖에 있으면 명확히 실패한다", () => {
    expect(() => render(<PopoverTrigger>설정</PopoverTrigger>)).toThrow(
      "Popover compound components must be used within Popover"
    )
    expect(() => render(<PopoverContent>내용</PopoverContent>)).toThrow(
      "Popover compound components must be used within Popover"
    )
  })
})
