import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Tabs as PublicTabs,
  TabsContent as PublicTabsContent,
  TabsList as PublicTabsList,
  TabsTrigger as PublicTabsTrigger,
  type TabsContentProps as PublicTabsContentProps,
  type TabsListProps as PublicTabsListProps,
  type TabsProps as PublicTabsProps,
  type TabsTriggerProps as PublicTabsTriggerProps,
} from "../index.js"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsContentProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
} from "./Tabs.js"

afterEach(cleanup)

function AccountTabs(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  return (
    <Tabs {...({ defaultValue: "overview", ...props } as TabsProps)}>
      <TabsList aria-label="계정 정보">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="security">보안</TabsTrigger>
        <TabsTrigger disabled value="billing">결제</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">계정 개요</TabsContent>
      <TabsContent value="security">보안 설정</TabsContent>
      <TabsContent value="billing">결제 내역</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("exports the public components and props types", () => {
    expect(PublicTabs).toBe(Tabs)
    expect(PublicTabsList).toBe(TabsList)
    expect(PublicTabsTrigger).toBe(TabsTrigger)
    expect(PublicTabsContent).toBe(TabsContent)
    expectTypeOf<PublicTabsProps>().toEqualTypeOf<TabsProps>()
    expectTypeOf<PublicTabsListProps>().toEqualTypeOf<TabsListProps>()
    expectTypeOf<PublicTabsTriggerProps>().toEqualTypeOf<TabsTriggerProps>()
    expectTypeOf<PublicTabsContentProps>().toEqualTypeOf<TabsContentProps>()
  })

  it("renders linked native tab semantics and forwards refs", () => {
    const rootRef = createRef<HTMLDivElement>()
    const listRef = createRef<HTMLDivElement>()
    const triggerRef = createRef<HTMLButtonElement>()
    const contentRef = createRef<HTMLDivElement>()
    render(
      <Tabs ref={rootRef} defaultValue="overview" className="custom-tabs">
        <TabsList ref={listRef} aria-label="계정 정보" className="custom-list">
          <TabsTrigger ref={triggerRef} value="overview" className="custom-trigger">개요</TabsTrigger>
        </TabsList>
        <TabsContent ref={contentRef} value="overview" className="custom-content">계정 개요</TabsContent>
      </Tabs>
    )

    const tab = screen.getByRole("tab", { name: "개요" })
    const panel = screen.getByRole("tabpanel")
    expect(rootRef.current).toHaveClass("jds-tabs", "custom-tabs")
    expect(rootRef.current).toHaveAttribute("data-state", "enabled")
    expect(listRef.current).toHaveAttribute("aria-orientation", "horizontal")
    expect(listRef.current).toHaveClass("jds-tabs-list", "custom-list")
    expect(triggerRef.current).toHaveAttribute("type", "button")
    expect(triggerRef.current).toHaveClass("jds-tabs-trigger", "custom-trigger")
    expect(tab).toHaveAttribute("aria-selected", "true")
    expect(tab).toHaveAttribute("aria-controls", panel.id)
    expect(panel).toHaveAttribute("aria-labelledby", tab.id)
    expect(contentRef.current).toHaveClass("jds-tabs-content", "custom-content")
    expect(contentRef.current).toHaveAttribute("tabindex", "0")
  })

  it("updates uncontrolled selection and ignores duplicate or prevented requests", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<AccountTabs onValueChange={onValueChange} />)

    await user.click(screen.getByRole("tab", { name: "보안" }))
    expect(screen.getByRole("tab", { name: "보안" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("계정 개요").closest("div")).toHaveAttribute("hidden")
    expect(onValueChange).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("tab", { name: "보안" }))
    expect(onValueChange).toHaveBeenCalledTimes(1)

    render(
      <Tabs defaultValue="overview" onValueChange={onValueChange}>
        <TabsList aria-label="계정 정보">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="security" onClick={(event) => event.preventDefault()}>보안</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">계정 개요</TabsContent>
        <TabsContent value="security">보안 설정</TabsContent>
      </Tabs>
    )
    await user.click(screen.getAllByRole("tab", { name: "보안" })[1])
    expect(screen.getAllByRole("tab", { name: "개요" })[1]).toHaveAttribute("aria-selected", "true")
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it("notifies controlled selection without changing it", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<AccountTabs value="overview" onValueChange={onValueChange} />)

    await user.click(screen.getByRole("tab", { name: "보안" }))
    expect(onValueChange).toHaveBeenCalledWith("security")
    expect(screen.getByRole("tab", { name: "개요" })).toHaveAttribute("aria-selected", "true")

    rerender(<AccountTabs value="security" onValueChange={onValueChange} />)
    expect(screen.getByRole("tab", { name: "보안" })).toHaveAttribute("aria-selected", "true")
  })

  it("moves focus and selection with horizontal keyboard navigation while skipping disabled tabs", async () => {
    const user = userEvent.setup()
    render(<AccountTabs />)
    const overview = screen.getByRole("tab", { name: "개요" })
    const security = screen.getByRole("tab", { name: "보안" })

    overview.focus()
    await user.keyboard("{ArrowLeft}")
    expect(security).toHaveFocus()
    expect(security).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{End}")
    expect(security).toHaveFocus()
    await user.keyboard("{Home}")
    expect(overview).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(security).toHaveFocus()
  })

  it("keeps Tab default behavior and rejects compound parts outside Tabs", () => {
    render(<AccountTabs />)
    const event = fireEvent.keyDown(screen.getByRole("tab", { name: "개요" }), { key: "Tab" })
    expect(event).toBe(true)
    expect(() => render(<TabsList />)).toThrow("Tabs compound components must be used within Tabs")
    expect(() => render(<TabsTrigger value="overview">개요</TabsTrigger>)).toThrow("Tabs compound components must be used within Tabs")
    expect(() => render(<TabsContent value="overview">개요</TabsContent>)).toThrow("Tabs compound components must be used within Tabs")
  })
})
