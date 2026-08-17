import { createRef, type MouseEvent } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Breadcrumb as PublicBreadcrumb,
  BreadcrumbItem as PublicBreadcrumbItem,
  BreadcrumbLink as PublicBreadcrumbLink,
  BreadcrumbList as PublicBreadcrumbList,
  BreadcrumbPage as PublicBreadcrumbPage,
  BreadcrumbSeparator as PublicBreadcrumbSeparator,
  type BreadcrumbProps as PublicBreadcrumbProps,
} from "../index.js"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbProps,
} from "./Breadcrumb.js"

afterEach(cleanup)

describe("Breadcrumb", () => {
  it("exports every primitive and public props type", () => {
    expect(PublicBreadcrumb).toBe(Breadcrumb)
    expect(PublicBreadcrumbList).toBe(BreadcrumbList)
    expect(PublicBreadcrumbItem).toBe(BreadcrumbItem)
    expect(PublicBreadcrumbLink).toBe(BreadcrumbLink)
    expect(PublicBreadcrumbPage).toBe(BreadcrumbPage)
    expect(PublicBreadcrumbSeparator).toBe(BreadcrumbSeparator)
    expectTypeOf<PublicBreadcrumbProps>().toEqualTypeOf<BreadcrumbProps>()
  })

  it("renders named native navigation with a current page and hidden separator", () => {
    render(
      <Breadcrumb aria-label="현재 위치">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">홈</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>상세</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(screen.getByRole("navigation", { name: "현재 위치" })).toContainElement(screen.getByRole("list"))
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/")
    expect(screen.getByText("상세")).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("/")).toHaveAttribute("aria-hidden", "true")
  })

  it("forwards native props, events, classes, and refs while retaining forced ARIA", () => {
    const navRef = createRef<HTMLElement>()
    const linkRef = createRef<HTMLAnchorElement>()
    const pageRef = createRef<HTMLSpanElement>()
    const separatorRef = createRef<HTMLSpanElement>()
    const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault())

    render(
      <Breadcrumb aria-label="경로" className="consumer-nav" id="path" ref={navRef}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/products" className="consumer-link" onClick={onClick} ref={linkRef}>
              상품
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="consumer-separator" ref={separatorRef}>
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="consumer-page" ref={pageRef}>
              상세
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(navRef.current).toBe(screen.getByRole("navigation", { name: "경로" }))
    expect(navRef.current).toHaveAttribute("id", "path")
    expect(navRef.current).toHaveClass("jdsb-breadcrumb", "consumer-nav")
    expect(linkRef.current).toHaveClass("jdsb-breadcrumb-link", "consumer-link")
    expect(pageRef.current).toHaveClass("jdsb-breadcrumb-page", "consumer-page")
    expect(pageRef.current).toHaveAttribute("aria-current", "page")
    expect(separatorRef.current).toHaveClass("jdsb-breadcrumb-separator", "consumer-separator")
    expect(separatorRef.current).toHaveAttribute("aria-hidden", "true")
    fireEvent.click(linkRef.current!)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("keeps native Enter activation for a link", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Breadcrumb aria-label="경로">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/"
              onClick={(event) => {
                event.preventDefault()
                onClick()
              }}
            >
              홈
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    screen.getByRole("link", { name: "홈" }).focus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledOnce()
  })
})
