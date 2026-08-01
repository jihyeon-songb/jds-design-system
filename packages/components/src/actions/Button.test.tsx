import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button } from "./Button.js"

afterEach(cleanup)

describe("Button", () => {
  it("disables and preserves the accessible name while loading", () => {
    render(<Button loading>Save changes</Button>)

    const button = screen.getByRole("button", { name: "Save changes" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("data-state", "loading")
    expect(button.querySelector('[data-slot="spinner"]')?.compareDocumentPosition(screen.getByText("Save changes"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it("forwards the ref and native button props", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref} name="save" type="submit">Save</Button>)

    expect(ref.current).toHaveAttribute("name", "save")
    expect(ref.current).toHaveAttribute("type", "submit")
  })

  it("does not invoke click handlers while loading", () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders icons around its label", () => {
    render(<Button startIcon={<svg data-testid="start" />} endIcon={<svg data-testid="end" />}>Save</Button>)

    expect(screen.getByRole("button").textContent).toBe("Save")
    expect(screen.getByTestId("start").parentElement?.compareDocumentPosition(screen.getByText("Save"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText("Save").compareDocumentPosition(screen.getByTestId("end").parentElement!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
