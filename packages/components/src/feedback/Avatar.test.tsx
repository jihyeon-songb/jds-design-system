import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Avatar } from "./Avatar.js"

afterEach(cleanup)

describe("Avatar", () => {
  it("uses md by default and forwards span props and its ref", () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Avatar aria-label="작성자" className="consumer-avatar" id="author" ref={ref} />)

    expect(ref.current).toBe(screen.getByLabelText("작성자"))
    expect(ref.current).toHaveAttribute("id", "author")
    expect(ref.current).toHaveClass("jds-avatar", "consumer-avatar")
    expect(ref.current).toHaveAttribute("data-size", "md")
  })

  it("renders an image with explicit alt text", () => {
    render(<Avatar alt="프로필 사진" name="김지현" src="/jihyeon.png" />)

    expect(screen.getByRole("img", { name: "프로필 사진" })).toHaveAttribute("src", "/jihyeon.png")
  })

  it("uses the name as image alt text when alt is absent", () => {
    render(<Avatar name="김지현" src="/jihyeon.png" />)

    expect(screen.getByRole("img", { name: "김지현" })).toHaveAttribute("src", "/jihyeon.png")
  })

  it("renders the first Unicode name character as an accessible fallback", () => {
    render(<Avatar name="😀지현" />)

    expect(screen.getByRole("img", { name: "😀지현" })).toHaveTextContent("😀")
    expect(screen.getByText("😀")).toHaveAttribute("aria-hidden", "true")
  })

  it("falls back after an image error and retries a different src", () => {
    const { rerender } = render(<Avatar name="김지현" src="/broken.png" />)
    fireEvent.error(screen.getByRole("img", { name: "김지현" }))

    expect(screen.getByRole("img", { name: "김지현" })).toHaveTextContent("김")

    rerender(<Avatar name="김지현" src="/replaced.png" />)
    expect(screen.getByRole("img", { name: "김지현" })).toHaveAttribute("src", "/replaced.png")
  })

  it.each(["sm", "md", "lg", "xl"] as const)("renders the %s size", (size) => {
    render(<Avatar aria-label={`${size} avatar`} size={size} />)

    expect(screen.getByLabelText(`${size} avatar`)).toHaveAttribute("data-size", size)
  })

  it("keeps consumer-provided ARIA semantics for an empty avatar", () => {
    render(<Avatar aria-label="알 수 없는 사용자" role="status" />)

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "알 수 없는 사용자")
  })
})
