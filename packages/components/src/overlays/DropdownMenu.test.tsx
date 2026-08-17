import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  DropdownMenu as PublicDropdownMenu,
  DropdownMenuContent as PublicDropdownMenuContent,
  DropdownMenuItem as PublicDropdownMenuItem,
  DropdownMenuSeparator as PublicDropdownMenuSeparator,
  DropdownMenuTrigger as PublicDropdownMenuTrigger,
  type DropdownMenuContentProps as PublicDropdownMenuContentProps,
  type DropdownMenuItemProps as PublicDropdownMenuItemProps,
  type DropdownMenuProps as PublicDropdownMenuProps,
  type DropdownMenuSeparatorProps as PublicDropdownMenuSeparatorProps,
  type DropdownMenuTriggerProps as PublicDropdownMenuTriggerProps,
} from "../index.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuTriggerProps,
} from "./DropdownMenu.js"

afterEach(cleanup)

function Menu({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>편집</DropdownMenuItem>
        <DropdownMenuItem disabled>복제</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenu", () => {
  it("package entry에서 DropdownMenu API를 export한다", () => {
    expect(PublicDropdownMenu).toBe(DropdownMenu)
    expect(PublicDropdownMenuTrigger).toBe(DropdownMenuTrigger)
    expect(PublicDropdownMenuContent).toBe(DropdownMenuContent)
    expect(PublicDropdownMenuItem).toBe(DropdownMenuItem)
    expect(PublicDropdownMenuSeparator).toBe(DropdownMenuSeparator)
    expectTypeOf<PublicDropdownMenuProps>().toEqualTypeOf<DropdownMenuProps>()
    expectTypeOf<PublicDropdownMenuTriggerProps>().toEqualTypeOf<DropdownMenuTriggerProps>()
    expectTypeOf<PublicDropdownMenuContentProps>().toEqualTypeOf<DropdownMenuContentProps>()
    expectTypeOf<PublicDropdownMenuItemProps>().toEqualTypeOf<DropdownMenuItemProps>()
    expectTypeOf<PublicDropdownMenuSeparatorProps>().toEqualTypeOf<DropdownMenuSeparatorProps>()
  })

  it("Trigger가 menu를 열고 표준 ARIA 의미를 연결한다", async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole("button", { name: "더 보기" })

    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    await user.click(trigger)

    const menu = screen.getByRole("menu")
    expect(trigger).toHaveAttribute("type", "button")
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(menu).toHaveAttribute("id", trigger.getAttribute("aria-controls"))
    expect(screen.getByRole("menuitem", { name: "편집" })).toHaveAttribute("type", "button")
    expect(screen.getByRole("separator")).toBeVisible()
  })

  it("Arrow key가 disabled item을 건너뛰고 Home과 End가 양 끝 항목으로 이동한다", async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const trigger = screen.getByRole("button", { name: "더 보기" })
    trigger.focus()

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "편집" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveFocus()
    await user.keyboard("{Home}")
    expect(screen.getByRole("menuitem", { name: "편집" })).toHaveFocus()
    await user.keyboard("{End}")
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveFocus()
  })

  it("Enter가 item을 실행하고 메뉴를 닫은 뒤 Trigger에 focus를 복귀한다", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem onClick={onClick}>편집</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    )
    const trigger = screen.getByRole("button", { name: "더 보기" })
    trigger.focus()

    await user.keyboard("{ArrowDown}{Enter}")

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("Escape와 바깥 pointerdown은 controlled menu에 close를 요청한다", () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <DropdownMenu open onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>더 보기</DropdownMenuTrigger>
          <DropdownMenuContent><DropdownMenuItem>편집</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
        <button type="button">외부</button>
      </>
    )
    const trigger = screen.getByRole("button", { name: "더 보기" })

    fireEvent.keyDown(screen.getByRole("menuitem"), { key: "Escape" })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole("menu")).toBeVisible()
    expect(trigger).toHaveFocus()
    fireEvent.pointerDown(screen.getByRole("button", { name: "외부" }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("취소된 item click은 메뉴를 닫지 않고 native props와 refs를 전달한다", async () => {
    const user = userEvent.setup()
    const triggerRef = createRef<HTMLButtonElement>()
    const contentRef = createRef<HTMLDivElement>()
    render(
      <DropdownMenu className="consumer-root" defaultOpen>
        <DropdownMenuTrigger className="consumer-trigger" ref={triggerRef}>더 보기</DropdownMenuTrigger>
        <DropdownMenuContent className="consumer-content" ref={contentRef} title="명령">
          <DropdownMenuItem onClick={(event) => event.preventDefault()}>편집</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByRole("menuitem", { name: "편집" }))

    expect(screen.getByRole("menu")).toBeVisible()
    expect(triggerRef.current).toHaveClass("jdsb-dropdown-menu-trigger", "consumer-trigger")
    expect(contentRef.current).toHaveClass("jdsb-dropdown-menu-content", "consumer-content")
    expect(contentRef.current).toHaveAttribute("title", "명령")
    expect(contentRef.current?.parentElement).toHaveClass("jdsb-dropdown-menu", "consumer-root")
  })

  it("compound part가 DropdownMenu 밖에서 렌더링되면 명확히 실패한다", () => {
    expect(() => render(<DropdownMenuTrigger>더 보기</DropdownMenuTrigger>)).toThrow(
      "DropdownMenu compound components must be used within DropdownMenu"
    )
    expect(() => render(<DropdownMenuContent>내용</DropdownMenuContent>)).toThrow(
      "DropdownMenu compound components must be used within DropdownMenu"
    )
  })
})
