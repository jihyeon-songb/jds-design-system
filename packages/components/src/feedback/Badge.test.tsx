import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Badge } from "./Badge.js"

afterEach(cleanup)

describe("Badge", () => {
  it("uses neutral by default and forwards span props and its ref", () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Badge aria-label="문서 상태" className="consumer-badge" id="document-state" ref={ref}>초안</Badge>)

    expect(ref.current).toBe(screen.getByLabelText("문서 상태"))
    expect(ref.current).toHaveAttribute("id", "document-state")
    expect(ref.current).toHaveClass("jds-badge", "consumer-badge")
    expect(ref.current).toHaveAttribute("data-variant", "neutral")
  })

  it.each(["neutral", "info", "success", "warning", "error"] as const)("renders the %s variant", (variant) => {
    render(<Badge variant={variant}>상태</Badge>)

    expect(screen.getByText("상태")).toHaveAttribute("data-variant", variant)
  })

  it("preserves consumer-provided ARIA semantics", () => {
    render(<Badge role="status">배포 완료</Badge>)

    expect(screen.getByRole("status")).toHaveTextContent("배포 완료")
  })
})
