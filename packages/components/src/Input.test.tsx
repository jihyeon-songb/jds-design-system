import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, expectTypeOf, it } from "vitest"
import { Input, type InputProps, type InputSize } from "./Input.js"

afterEach(cleanup)

describe("Input", () => {
  it("exposes only InputSize strings for size", () => {
    expectTypeOf<InputProps["size"]>().toEqualTypeOf<InputSize | undefined>()
  })

  it("forwards the ref and native input props", () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} aria-label="이메일" name="email" required type="email" />)

    expect(ref.current).toHaveAttribute("name", "email")
    expect(ref.current).toHaveAttribute("type", "email")
    expect(ref.current).toBeRequired()
  })

  it("preserves uncontrolled values", () => {
    render(<Input aria-label="이름" defaultValue="하나" />)
    const control = screen.getByRole("textbox", { name: "이름" })
    fireEvent.change(control, { target: { value: "둘" } })
    expect(control).toHaveValue("둘")
  })

  it("preserves controlled values", () => {
    render(<Input aria-label="이름" value="셋" onChange={() => undefined} />)

    expect(screen.getByRole("textbox", { name: "이름" })).toHaveValue("셋")
  })

  it("reflects invalid, disabled, and readOnly states in priority order", () => {
    const { rerender } = render(<Input aria-label="이름" invalid />)
    const control = screen.getByRole("textbox", { name: "이름" })

    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control).toHaveAttribute("data-state", "invalid")

    rerender(<Input aria-label="이름" disabled invalid readOnly />)
    expect(control).toBeDisabled()
    expect(control).toHaveAttribute("data-state", "disabled")

    rerender(<Input aria-label="이름" invalid readOnly />)
    expect(control).toHaveAttribute("readonly")
    expect(control).toHaveAttribute("data-state", "readonly")
  })

  it("preserves caller aria-invalid unless invalid is true", () => {
    const { rerender } = render(<Input aria-invalid="false" aria-label="이름" />)
    const control = screen.getByRole("textbox", { name: "이름" })

    expect(control).toHaveAttribute("aria-invalid", "false")

    rerender(<Input aria-invalid="false" aria-label="이름" invalid />)
    expect(control).toHaveAttribute("aria-invalid", "true")
  })

  it.each(["sm", "md", "lg", "xl"] as const)("accepts and sets the %s string size", (size) => {
    const props: InputProps = { size }
    expectTypeOf<{ size?: "sm" | "md" | "lg" | "xl" }>().toMatchTypeOf<InputProps>()

    render(<Input aria-label="이름" {...props} />)

    expect(screen.getByRole("textbox", { name: "이름" })).toHaveAttribute("data-size", size)
  })
})
