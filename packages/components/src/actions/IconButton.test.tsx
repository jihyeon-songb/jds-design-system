import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { IconButton as PublicIconButton } from "../index.js"
import { IconButton } from "./IconButton.js"

afterEach(cleanup)

describe("IconButton", () => {
  it("forwards its ref and native props while exposing its accessible name", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<IconButton ref={ref} aria-label="알림 닫기" name="dismiss" type="submit"><svg data-testid="icon" /></IconButton>)

    expect(screen.getByRole("button", { name: "알림 닫기" })).toBe(ref.current)
    expect(ref.current).toHaveAttribute("name", "dismiss")
    expect(ref.current).toHaveAttribute("type", "submit")
    expect(ref.current).toHaveAttribute("data-variant", "outline")
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true")
  })

  it("disables and preserves its accessible name while loading", () => {
    const onClick = vi.fn()
    render(<IconButton aria-label="저장" loading onClick={onClick}><svg /></IconButton>)

    const button = screen.getByRole("button", { name: "저장" })
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("data-state", "loading")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("uses native keyboard activation", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton aria-label="메뉴 열기" onClick={onClick}><svg /></IconButton>)

    const button = screen.getByRole("button", { name: "메뉴 열기" })
    button.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("exports the public IconButton", () => {
    render(<PublicIconButton aria-label="메뉴 열기"><svg /></PublicIconButton>)

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveClass("jdsb-icon-button")
  })
})
