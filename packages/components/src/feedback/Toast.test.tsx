import { createRef, useRef } from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import {
  Toast as PublicToast,
  ToastProvider as PublicToastProvider,
  useToast as publicUseToast,
  type ToastApi as PublicToastApi,
} from "../index.js"
import { Toast, ToastProvider, useToast } from "./Toast.js"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function SuccessControl() {
  const toast = useToast()

  return <button onClick={() => toast.success({ message: "저장했습니다." })}>성공</button>
}

function ToastControls() {
  const toast = useToast()

  return (
    <>
      <button onClick={() => toast.info({ message: "정보" })}>정보</button>
      <button onClick={() => toast.warning({ message: "경고" })}>경고</button>
      <button onClick={() => toast.error({ message: "오류" })}>오류</button>
    </>
  )
}

function DismissControl() {
  const toast = useToast()
  const idRef = useRef<string | undefined>(undefined)

  return (
    <>
      <button onClick={() => { idRef.current = toast.info({ message: "제거 대상" }) }}>추가</button>
      <button onClick={() => toast.dismiss(idRef.current ?? "없는 ID")}>제거</button>
    </>
  )
}

describe("ToastProvider", () => {
  it("exports Toast API from the package entry", () => {
    expect(PublicToast).toBe(Toast)
    expect(PublicToastProvider).toBe(ToastProvider)
    expect(publicUseToast).toBe(useToast)
    expectTypeOf<PublicToastApi>().toEqualTypeOf<import("./Toast.js").ToastApi>()
  })

  it("shows a success toast and removes it after five seconds", () => {
    render(
      <ToastProvider>
        <SuccessControl />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "성공" }))

    const toast = screen.getByRole("status")
    expect(toast).toHaveTextContent("저장했습니다.")
    expect(toast).toHaveAttribute("aria-live", "polite")
    expect(toast).toHaveAttribute("data-variant", "success")
    expect(screen.getByRole("region", { name: "알림" })).toContainElement(toast)

    act(() => vi.advanceTimersByTime(5_000))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("keeps an error until its close button is activated", () => {
    render(
      <ToastProvider>
        <ToastControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "오류" }))
    act(() => vi.advanceTimersByTime(5_000))

    expect(screen.getByRole("status")).toHaveTextContent("오류")
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("keeps only three toasts by replacing the oldest dismissible toast", () => {
    render(
      <ToastProvider>
        <SuccessControl />
        <ToastControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "성공" }))
    fireEvent.click(screen.getByRole("button", { name: "정보" }))
    fireEvent.click(screen.getByRole("button", { name: "경고" }))
    fireEvent.click(screen.getByRole("button", { name: "오류" }))

    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument()
    expect(screen.getAllByRole("status")).toHaveLength(3)
    expect(screen.getAllByRole("status").map((toast) => toast.querySelector('[data-slot="message"]')?.textContent)).toEqual(["정보", "경고", "오류"])
  })

  it("does not add a toast when all three visible toasts are errors", () => {
    render(
      <ToastProvider>
        <SuccessControl />
        <ToastControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "오류" }))
    fireEvent.click(screen.getByRole("button", { name: "오류" }))
    fireEvent.click(screen.getByRole("button", { name: "오류" }))
    fireEvent.click(screen.getByRole("button", { name: "성공" }))

    expect(screen.getAllByRole("status")).toHaveLength(3)
    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument()
  })

  it("dismisses only the matching toast ID", () => {
    render(
      <ToastProvider>
        <DismissControl />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "제거" }))
    fireEvent.click(screen.getByRole("button", { name: "추가" }))
    fireEvent.click(screen.getByRole("button", { name: "제거" }))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("forwards Toast div props and ref while retaining status semantics", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Toast data-consumer="value" id="toast-id" message="직접 렌더링" onDismiss={() => undefined} ref={ref} variant="info" />)

    expect(ref.current).toHaveAttribute("id", "toast-id")
    expect(ref.current).toHaveAttribute("data-consumer", "value")
    expect(ref.current).toHaveClass("jdsb-toast")
    expect(ref.current).toHaveAttribute("role", "status")
  })

  it("renders an optional title above the message", () => {
    render(<Toast message="업데이트 내용을 확인하세요." onDismiss={() => undefined} title="업데이트됨" variant="info" />)

    expect(screen.getByText("업데이트됨")).toHaveAttribute("data-slot", "title")
    expect(screen.getByText("업데이트 내용을 확인하세요.")).toHaveAttribute("data-slot", "message")
  })

  it("closes from the focused close button with Enter and Space", async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <ToastControls />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "오류" }))
    screen.getByRole("button", { name: "닫기" }).focus()
    await user.keyboard("{Enter}")

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("throws when useToast is rendered outside a provider", () => {
    expect(() => render(<SuccessControl />)).toThrow("useToast must be used within ToastProvider")
  })
})
