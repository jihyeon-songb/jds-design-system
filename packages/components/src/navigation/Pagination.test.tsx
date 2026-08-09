import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Pagination } from "./Pagination.js"

afterEach(cleanup)

describe("Pagination", () => {
  it("renders a named native navigation landmark and forwards its ref", () => {
    const ref = createRef<HTMLElement>()
    render(<Pagination ref={ref} aria-label="검색 결과" defaultPage={2} totalPages={3} className="custom" />)
    expect(ref.current).toHaveClass("jdsb-pagination", "custom")
    expect(screen.getByRole("navigation", { name: "검색 결과" })).toBe(ref.current)
    expect(screen.getByRole("button", { name: "2 페이지, 현재 페이지" })).toHaveAttribute("aria-current", "page")
  })

  it("updates an uncontrolled page once and only notifies controlled selection", async () => {
    const user = userEvent.setup()
    const changed = vi.fn()
    const { rerender } = render(<Pagination aria-label="검색 결과" defaultPage={1} totalPages={3} onPageChange={changed} />)
    await user.click(screen.getByRole("button", { name: "2 페이지" }))
    await user.click(screen.getByRole("button", { name: "2 페이지, 현재 페이지" }))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenLastCalledWith(2)
    rerender(<Pagination aria-label="검색 결과" page={1} totalPages={3} onPageChange={changed} />)
    await user.click(screen.getByRole("button", { name: "다음 페이지" }))
    expect(changed).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole("button", { name: "1 페이지, 현재 페이지" })).toBeInTheDocument()
  })
})
