import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
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

  it("marks boundary controls and preserves native keyboard activation", async () => {
    const user = userEvent.setup()
    const changed = vi.fn()
    render(<Pagination aria-label="검색 결과" defaultPage={1} totalPages={3} onPageChange={changed} />)

    expect(screen.getByRole("button", { name: "이전 페이지" })).toHaveAttribute("data-direction", "previous")
    expect(screen.getByRole("button", { name: "이전 페이지" })).toHaveAttribute("data-state", "disabled")
    expect(screen.getByRole("button", { name: "다음 페이지" })).toHaveAttribute("data-direction", "next")
    expect(screen.getByRole("button", { name: "다음 페이지" })).toHaveAttribute("data-state", "enabled")
    expect(screen.getByRole("button", { name: "1 페이지, 현재 페이지" })).toHaveAttribute("data-state", "current")
    expect(screen.getByRole("button", { name: "2 페이지" })).toHaveAttribute("data-state", "idle")

    screen.getByRole("button", { name: "다음 페이지" }).focus()
    await user.keyboard("{Enter}")
    screen.getByRole("button", { name: "3 페이지" }).focus()
    await user.keyboard(" ")

    expect(changed).toHaveBeenNthCalledWith(1, 2)
    expect(changed).toHaveBeenNthCalledWith(2, 3)
  })

  it("renders the fixed seven-page window at beginning, middle, and end boundaries", () => {
    const cases = [
      { defaultPage: 4, pages: [1, 2, 3, 4, 5, 10], ellipses: 1 },
      { defaultPage: 5, pages: [1, 4, 5, 6, 10], ellipses: 2 },
      { defaultPage: 7, pages: [1, 6, 7, 8, 9, 10], ellipses: 1 },
    ]

    for (const { defaultPage, pages, ellipses } of cases) {
      const { container, unmount } = render(
        <Pagination aria-label="검색 결과" defaultPage={defaultPage} totalPages={10} />
      )
      expect(screen.getAllByRole("button", { name: /페이지/ }).filter((button) =>
        button.classList.contains("jdsb-pagination-page")
      ).map((button) => Number(button.textContent))).toEqual(pages)
      expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(ellipses)
      unmount()
    }
  })

  it("keeps ellipses inert", () => {
    const changed = vi.fn()
    const { container } = render(
      <Pagination aria-label="검색 결과" defaultPage={5} totalPages={10} onPageChange={changed} />
    )

    for (const ellipsis of container.querySelectorAll('span[aria-hidden="true"]')) fireEvent.click(ellipsis)

    expect(changed).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "5 페이지, 현재 페이지" })).toBeInTheDocument()
  })

  it.each([
    ["totalPages", <Pagination aria-label="검색 결과" defaultPage={1} totalPages={0} />],
    ["page", <Pagination aria-label="검색 결과" page={4} totalPages={3} />],
    ["defaultPage", <Pagination aria-label="검색 결과" defaultPage={0} totalPages={3} />],
  ])("rejects an invalid %s", (_, element) => {
    expect(() => render(element)).toThrow(RangeError)
  })
})
