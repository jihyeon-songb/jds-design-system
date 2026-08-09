import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Alert as PublicAlert, type AlertProps as PublicAlertProps } from "../index.js"
import { Alert } from "./Alert.js"

afterEach(cleanup)

describe("Alert", () => {
  it("exports Alert from the package entry", () => {
    const props: PublicAlertProps = { children: "저장했습니다." }
    expect(PublicAlert).toBe(Alert)
    expect(props.variant).toBeUndefined()
  })

  it("uses the default info status semantics and forwards div props", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Alert className="consumer-alert" ref={ref} id="save-result">저장했습니다.</Alert>)

    expect(ref.current).toHaveAttribute("id", "save-result")
    expect(ref.current).toHaveClass("jdsb-alert", "consumer-alert")
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

  it("does not render when defaultOpen is false", () => {
    render(<Alert defaultOpen={false}>기본으로 닫힘</Alert>)

    expect(screen.queryByText("기본으로 닫힘")).not.toBeInTheDocument()
  })

  it("does not render when controlled open is false", () => {
    render(<Alert open={false}>제어된 닫힘</Alert>)

    expect(screen.queryByText("제어된 닫힘")).not.toBeInTheDocument()
  })

  it("closes an uncontrolled dismissible alert and reports the state change", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Alert closeLabel="알림 닫기" dismissible onOpenChange={onOpenChange}>저장했습니다.</Alert>)

    await user.click(screen.getByRole("button", { name: "알림 닫기" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("requests close but leaves controlled visibility to its owner", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Alert closeLabel="알림 닫기" dismissible onOpenChange={onOpenChange} open>저장했습니다.</Alert>)

    await user.click(screen.getByRole("button", { name: "알림 닫기" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("requests close from the focused button with Enter and Space", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Alert closeLabel="알림 닫기" dismissible onOpenChange={onOpenChange} open>저장했습니다.</Alert>)

    await user.tab()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")

    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false)
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false)
  })

  it("renders again when its controlled open value changes back to true", () => {
    const { rerender } = render(<Alert open>저장했습니다.</Alert>)

    rerender(<Alert open={false}>저장했습니다.</Alert>)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    rerender(<Alert open>저장했습니다.</Alert>)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
