import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Textarea } from "./Textarea.js"

afterEach(cleanup)

describe("Textarea", () => {
  it("forwards the ref, native props, and merges aria-describedby with the counter", () => {
    const ref = createRef<HTMLTextAreaElement>()

    render(
      <Textarea
        ref={ref}
        aria-describedby="hint-id"
        aria-label="소개"
        defaultValue="안녕"
        maxLength={10}
        name="bio"
        required
      />
    )

    expect(ref.current).toHaveAttribute("name", "bio")
    expect(ref.current).toBeRequired()
    expect(ref.current).toHaveAttribute("aria-describedby")
    expect(ref.current?.getAttribute("aria-describedby")?.split(" ")).toEqual(
      expect.arrayContaining(["hint-id"])
    )
    const counter = screen.getByText("2 / 10")
    expect(counter).toHaveAttribute("data-slot", "counter")
    expect(ref.current?.getAttribute("aria-describedby")?.split(" ")).toContain(counter.id)
  })

  it("shows and updates a counter only when maxLength is set for uncontrolled usage", () => {
    render(<Textarea aria-label="소개" defaultValue="안녕" maxLength={10} />)

    const control = screen.getByRole("textbox", { name: "소개" })
    expect(screen.getByText("2 / 10")).toBeInTheDocument()

    fireEvent.change(control, { target: { value: "반갑습니다" } })
    expect(screen.getByText("5 / 10")).toBeInTheDocument()
  })

  it("recalculates the counter from the controlled value and omits it without maxLength", () => {
    const onChange = vi.fn()
    const { rerender } = render(<Textarea aria-label="메모" value="하나" onChange={onChange} />)

    expect(screen.queryByText(/\/\s*\d+/)).not.toBeInTheDocument()

    rerender(<Textarea aria-label="메모" maxLength={10} value="하나" onChange={onChange} />)
    expect(screen.getByText("2 / 10")).toBeInTheDocument()

    fireEvent.change(screen.getByRole("textbox", { name: "메모" }), { target: { value: "바뀐 값" } })
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.getByText("2 / 10")).toBeInTheDocument()

    rerender(<Textarea aria-label="메모" maxLength={10} value="하나둘셋넷" onChange={onChange} />)
    expect(screen.getByText("5 / 10")).toBeInTheDocument()
  })

  it("reflects invalid, disabled, and readOnly states on the rendered control", () => {
    const { rerender } = render(<Textarea aria-label="소개" invalid />)

    const control = screen.getByRole("textbox", { name: "소개" })
    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control.closest(".jdsb-textarea")).toHaveAttribute("data-state", "invalid")

    rerender(<Textarea aria-label="소개" disabled invalid readOnly />)
    expect(control).toBeDisabled()
    expect(control.closest(".jdsb-textarea")).toHaveAttribute("data-state", "disabled")

    rerender(<Textarea aria-label="소개" readOnly />)
    expect(control).toHaveAttribute("readonly")
    expect(control.closest(".jdsb-textarea")).toHaveAttribute("data-state", "readonly")
  })
})
