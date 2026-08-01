import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Drawer as PublicDrawer,
  DrawerClose as PublicDrawerClose,
  DrawerContent as PublicDrawerContent,
  DrawerDescription as PublicDrawerDescription,
  DrawerTitle as PublicDrawerTitle,
  DrawerTrigger as PublicDrawerTrigger,
  type DrawerProps as PublicDrawerProps,
} from "../index.js"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
} from "./Drawer.js"

const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", "") })
const close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open") })

beforeEach(() => {
  if (!("showModal" in HTMLDialogElement.prototype)) {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: () => {} })
  }
  if (!("close" in HTMLDialogElement.prototype)) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: () => {} })
  }
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(showModal)
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(close)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("Drawer", () => {
  it("package entry에서 Drawer API를 export한다", () => {
    expect(PublicDrawer).toBe(Drawer)
    expect(PublicDrawerTrigger).toBe(DrawerTrigger)
    expect(PublicDrawerContent).toBe(DrawerContent)
    expect(PublicDrawerTitle).toBe(DrawerTitle)
    expect(PublicDrawerDescription).toBe(DrawerDescription)
    expect(PublicDrawerClose).toBe(DrawerClose)
    expectTypeOf<PublicDrawerProps>().toEqualTypeOf<DrawerProps>()
  })

  it("기본 right side와 전달받은 side를 Content에 노출한다", () => {
    const { rerender } = render(<Drawer><DrawerContent aria-label="메뉴" data-testid="drawer" /></Drawer>)
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-side", "right")

    rerender(<Drawer><DrawerContent aria-label="메뉴" data-testid="drawer" side="left" /></Drawer>)
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-side", "left")
  })

  it("Trigger가 Drawer를 열고 Close가 상태 변경을 요청한다", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger>메뉴 열기</DrawerTrigger>
        <DrawerContent aria-label="메뉴"><DrawerClose aria-label="닫기">×</DrawerClose></DrawerContent>
      </Drawer>
    )

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }))
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open")
    expect(showModal).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("button", { name: "닫기" }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("native props와 ref를 Content에 전달한다", () => {
    const ref = createRef<HTMLDialogElement>()
    render(<Drawer><DrawerContent aria-label="메뉴" data-testid="drawer" ref={ref} side="bottom" /></Drawer>)

    expect(ref.current).toBe(screen.getByTestId("drawer"))
    expect(ref.current).toHaveClass("jds-drawer-content")
    expect(ref.current).toHaveAttribute("data-side", "bottom")
  })
})
