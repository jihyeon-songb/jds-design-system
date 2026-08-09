import { createRef } from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip.js"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("Tooltip", () => {
  it("opens 300ms after focus and closes immediately on blur", () => {
    render(
      <Tooltip>
        <TooltipTrigger><button>도움말</button></TooltipTrigger>
        <TooltipContent>추가 정보를 표시합니다.</TooltipContent>
      </Tooltip>
    )
    const trigger = screen.getByRole("button", { name: "도움말" })
    const content = screen.getByRole("tooltip", { hidden: true })

    fireEvent.focus(trigger)
    expect(content).toHaveAttribute("data-state", "closed")
    act(() => vi.advanceTimersByTime(300))
    expect(content).toHaveAttribute("data-state", "open")
    expect(trigger).toHaveAttribute("aria-describedby", content.id)

    fireEvent.blur(trigger)
    expect(content).toHaveAttribute("data-state", "closed")
    expect(content).toHaveAttribute("hidden")
  })

  it("keeps open while moving from trigger to content and closes on Escape", () => {
    render(
      <Tooltip>
        <TooltipTrigger><button>설명</button></TooltipTrigger>
        <TooltipContent>보조 설명</TooltipContent>
      </Tooltip>
    )
    const trigger = screen.getByRole("button", { name: "설명" })
    const content = screen.getByRole("tooltip", { hidden: true })

    trigger.focus()
    fireEvent.pointerEnter(trigger)
    act(() => vi.advanceTimersByTime(300))
    const leaveEvent = new Event("pointerout", { bubbles: true })
    Object.defineProperty(leaveEvent, "relatedTarget", { value: content })
    fireEvent(trigger, leaveEvent)
    expect(content).toHaveAttribute("data-state", "open")

    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(content).toHaveAttribute("data-state", "closed")
    expect(trigger).toHaveFocus()
  })

  it("merges an existing description with the content ID once", () => {
    render(
      <Tooltip>
        <TooltipTrigger><button aria-describedby="existing-description">설명</button></TooltipTrigger>
        <TooltipContent>보조 설명</TooltipContent>
      </Tooltip>
    )
    const trigger = screen.getByRole("button", { name: "설명" })
    const content = screen.getByRole("tooltip", { hidden: true })

    expect(trigger.getAttribute("aria-describedby")).toBe(`existing-description ${content.id}`)
  })

  it("forwards native click behavior and lets consumer Escape cancellation win", () => {
    const onClick = vi.fn()
    render(
      <Tooltip>
        <TooltipTrigger>
          <button onClick={onClick} onKeyDown={(event) => {
            if (event.key === "Escape") event.preventDefault()
          }}>설명</button>
        </TooltipTrigger>
        <TooltipContent>보조 설명</TooltipContent>
      </Tooltip>
    )
    const trigger = screen.getByRole("button", { name: "설명" })
    const content = screen.getByRole("tooltip", { hidden: true })

    fireEvent.click(trigger)
    expect(onClick).toHaveBeenCalledOnce()
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(300))
    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(content).toHaveAttribute("data-state", "open")
  })

  it("forwards refs and native props and exposes the requested side", () => {
    const triggerRef = createRef<HTMLButtonElement>()
    const contentRef = createRef<HTMLSpanElement>()
    render(
      <Tooltip title="wrapper title">
        <TooltipTrigger ref={triggerRef}><button disabled>설명</button></TooltipTrigger>
        <TooltipContent ref={contentRef} side="left" aria-label="추가 설명">보조 설명</TooltipContent>
      </Tooltip>
    )

    expect(triggerRef.current).toBe(screen.getByRole("button", { name: "설명" }))
    expect(triggerRef.current).toBeDisabled()
    expect(contentRef.current).toHaveAttribute("data-side", "left")
    expect(contentRef.current).toHaveAttribute("aria-label", "추가 설명")
    expect(contentRef.current?.parentElement).toHaveAttribute("title", "wrapper title")
  })

  it("throws when a compound part is rendered outside Tooltip", () => {
    expect(() => render(<TooltipTrigger><button>설명</button></TooltipTrigger>)).toThrow(
      "Tooltip compound components must be used within Tooltip"
    )
    expect(() => render(<TooltipContent>보조 설명</TooltipContent>)).toThrow(
      "Tooltip compound components must be used within Tooltip"
    )
  })

  it("clears a pending open timer when unmounted", () => {
    const { unmount } = render(
      <Tooltip>
        <TooltipTrigger><button>설명</button></TooltipTrigger>
        <TooltipContent>보조 설명</TooltipContent>
      </Tooltip>
    )

    fireEvent.focus(screen.getByRole("button", { name: "설명" }))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
