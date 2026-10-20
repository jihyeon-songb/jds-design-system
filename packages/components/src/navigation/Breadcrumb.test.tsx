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
  type BreadcrumbItemProps as PublicBreadcrumbItemProps,
  type BreadcrumbLinkProps as PublicBreadcrumbLinkProps,
  type BreadcrumbListProps as PublicBreadcrumbListProps,
  type BreadcrumbPageProps as PublicBreadcrumbPageProps,
  type BreadcrumbProps as PublicBreadcrumbProps,
  type BreadcrumbSeparatorProps as PublicBreadcrumbSeparatorProps,
} from "../index.js"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type BreadcrumbListProps,
  type BreadcrumbPageProps,
  type BreadcrumbProps,
  type BreadcrumbSeparatorProps,
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
    expectTypeOf<PublicBreadcrumbListProps>().toEqualTypeOf<BreadcrumbListProps>()
    expectTypeOf<PublicBreadcrumbItemProps>().toEqualTypeOf<BreadcrumbItemProps>()
    expectTypeOf<PublicBreadcrumbLinkProps>().toEqualTypeOf<BreadcrumbLinkProps>()
    expectTypeOf<PublicBreadcrumbPageProps>().toEqualTypeOf<BreadcrumbPageProps>()
    expectTypeOf<PublicBreadcrumbSeparatorProps>().toEqualTypeOf<BreadcrumbSeparatorProps>()
  })

  it("renders named native navigation with a current page and hidden separator", () => {
    render(
      <Breadcrumb aria-label="현재 위치">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">홈</BreadcrumbLink>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
          </BreadcrumbItem>
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
    expect([...screen.getByRole("list").children].every((child) => child.tagName === "LI")).toBe(true)
  })

  it("forwards native props, events, classes, and refs while retaining forced ARIA", () => {
    const navRef = createRef<HTMLElement>()
    const listRef = createRef<HTMLOListElement>()
    const itemRef = createRef<HTMLLIElement>()
    const linkRef = createRef<HTMLAnchorElement>()
    const pageRef = createRef<HTMLSpanElement>()
    const separatorRef = createRef<HTMLSpanElement>()
    const onNavClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())
    const onListClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())
    const onItemClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())
    const onLinkClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())
    const onPageClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())
    const onSeparatorClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault())

    render(
      <Breadcrumb aria-label="경로" className="consumer-nav" id="path" onClick={onNavClick} ref={navRef}>
        <BreadcrumbList className="consumer-list" data-root="list" onClick={onListClick} ref={listRef}>
          <BreadcrumbItem className="consumer-item" data-root="item" onClick={onItemClick} ref={itemRef}>
            <BreadcrumbLink data-root="link" href="/products" className="consumer-link" onClick={onLinkClick} ref={linkRef}>
              상품
            </BreadcrumbLink>
            <BreadcrumbSeparator className="consumer-separator" data-root="separator" onClick={onSeparatorClick} ref={separatorRef}>
              /
            </BreadcrumbSeparator>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage className="consumer-page" data-root="page" onClick={onPageClick} ref={pageRef}>
              상세
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(navRef.current).toBe(screen.getByRole("navigation", { name: "경로" }))
    expect(navRef.current?.tagName).toBe("NAV")
    expect(navRef.current).toHaveAttribute("id", "path")
    expect(navRef.current).toHaveClass("jdsb-breadcrumb", "consumer-nav")
    expect(listRef.current).toHaveAttribute("data-root", "list")
    expect(listRef.current?.tagName).toBe("OL")
    expect(listRef.current).toHaveClass("jdsb-breadcrumb-list", "consumer-list")
    expect(itemRef.current).toHaveAttribute("data-root", "item")
    expect(itemRef.current?.tagName).toBe("LI")
    expect(itemRef.current).toHaveClass("jdsb-breadcrumb-item", "consumer-item")
    expect(linkRef.current).toHaveAttribute("data-root", "link")
    expect(linkRef.current?.tagName).toBe("A")
    expect(linkRef.current).toHaveClass("jdsb-breadcrumb-link", "consumer-link")
    expect(pageRef.current).toHaveClass("jdsb-breadcrumb-page", "consumer-page")
    expect(pageRef.current?.tagName).toBe("SPAN")
    expect(pageRef.current).toHaveAttribute("data-root", "page")
    expect(pageRef.current).toHaveAttribute("aria-current", "page")
    expect(separatorRef.current).toHaveClass("jdsb-breadcrumb-separator", "consumer-separator")
    expect(separatorRef.current?.tagName).toBe("SPAN")
    expect(separatorRef.current).toHaveAttribute("data-root", "separator")
    expect(separatorRef.current).toHaveAttribute("aria-hidden", "true")
    for (const element of [navRef.current, listRef.current, itemRef.current, linkRef.current, pageRef.current, separatorRef.current]) {
      fireEvent.click(element!)
    }
    expect(onNavClick).toHaveBeenCalled()
    expect(onListClick).toHaveBeenCalled()
    expect(onItemClick).toHaveBeenCalled()
    expect(onLinkClick).toHaveBeenCalledOnce()
    expect(onPageClick).toHaveBeenCalledOnce()
    expect(onSeparatorClick).toHaveBeenCalledOnce()
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
