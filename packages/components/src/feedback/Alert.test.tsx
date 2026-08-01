import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Alert } from "./Alert.js"

afterEach(cleanup)

describe("Alert", () => {
  it("uses the default info status semantics and forwards div props", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Alert ref={ref} id="save-result">저장했습니다.</Alert>)

    expect(ref.current).toHaveAttribute("id", "save-result")
    expect(ref.current).toHaveAttribute("role", "status")
    expect(ref.current).toHaveAttribute("data-variant", "info")
    expect(ref.current).toHaveAttribute("data-state", "open")
  })

  it("uses alert only for an error", () => {
    const { rerender } = render(<Alert variant="warning">확인 필요</Alert>)
    expect(screen.getByRole("status")).toHaveAttribute("data-variant", "warning")

    rerender(<Alert variant="error">저장 실패</Alert>)
    expect(screen.getByRole("alert")).toHaveAttribute("data-variant", "error")
  })
})
