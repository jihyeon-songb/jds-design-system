import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./Dialog.js"

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

describe("Dialog", () => {
  it("uncontrolled Trigger와 Close가 modal state를 바꾼다", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>열기</DialogTrigger>
        <DialogContent><DialogTitle>제목</DialogTitle><DialogClose aria-label="닫기">×</DialogClose></DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole("button", { name: "열기" }))
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open")
    expect(showModal).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("button", { name: "닫기" }))
    expect(close).toHaveBeenCalledOnce()
  })

  it("controlled Dialog은 close를 요청하고 상태를 직접 바꾸지 않는다", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogTrigger>열기</DialogTrigger>
        <DialogContent aria-label="확인"><DialogClose aria-label="닫기">×</DialogClose></DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole("button", { name: "닫기" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open")
  })

  it("Escape와 backdrop은 취소되지 않을 때만 close를 요청한다", () => {
    const onOpenChange = vi.fn()
    render(<Dialog open onOpenChange={onOpenChange}><DialogContent aria-label="확인" /></Dialog>)
    const dialog = screen.getByRole("dialog")

    fireEvent(dialog, new Event("cancel", { cancelable: true }))
    fireEvent.click(dialog)

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false)
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false)
  })

  it("preventDefault된 Trigger, Close, Escape, backdrop 요청을 막는다", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogTrigger onClick={(event) => event.preventDefault()}>열기</DialogTrigger>
        <DialogContent
          aria-label="확인"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogClose aria-label="닫기" onClick={(event) => event.preventDefault()}>×</DialogClose>
        </DialogContent>
      </Dialog>
    )
    const dialog = screen.getByRole("dialog")

    await user.click(screen.getByRole("button", { name: "열기" }))
    await user.click(screen.getByRole("button", { name: "닫기" }))
    fireEvent(dialog, new Event("cancel", { cancelable: true }))
    fireEvent.click(dialog)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("Content 내부 click은 close를 요청하지 않는다", () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent aria-label="확인"><button type="button">내부</button></DialogContent>
      </Dialog>
    )

    fireEvent.click(screen.getByRole("button", { name: "내부" }))

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("title/description을 연결하고 close 뒤 Trigger로 복귀한다", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>열기</DialogTrigger>
        <DialogContent>
          <DialogTitle>제목</DialogTitle>
          <DialogDescription>설명</DialogDescription>
          <DialogClose aria-label="닫기">×</DialogClose>
        </DialogContent>
      </Dialog>
    )
    const trigger = screen.getByRole("button", { name: "열기" })

    await user.click(trigger)
    expect(screen.getByRole("dialog", { name: "제목" })).toHaveAttribute(
      "aria-describedby", screen.getByText("설명").id
    )

    await user.click(screen.getByRole("button", { name: "닫기" }))
    expect(trigger).toHaveFocus()
  })

  it("열릴 때 autofocus, enabled focusable, Content 순으로 focus를 둔다", () => {
    const { rerender } = render(
      <Dialog open={false}><DialogContent aria-label="확인"><button autoFocus type="button">자동</button><button type="button">다음</button></DialogContent></Dialog>
    )
    rerender(
      <Dialog open><DialogContent aria-label="확인"><button autoFocus type="button">자동</button><button type="button">다음</button></DialogContent></Dialog>
    )
    expect(screen.getByRole("button", { name: "자동" })).toHaveFocus()

    cleanup()
    render(<Dialog defaultOpen><DialogContent aria-label="확인"><button disabled type="button">비활성</button><button type="button">다음</button></DialogContent></Dialog>)
    expect(screen.getByRole("button", { name: "다음" })).toHaveFocus()

    cleanup()
    render(<Dialog defaultOpen><DialogContent aria-label="확인" /></Dialog>)
    expect(screen.getByRole("dialog")).toHaveFocus()
  })

  it("disabled 또는 제거된 Trigger에는 focus를 복귀하지 않는다", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Dialog defaultOpen>
        <DialogTrigger disabled>열기</DialogTrigger>
        <DialogContent aria-label="확인"><DialogClose aria-label="닫기">×</DialogClose></DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole("button", { name: "닫기" }))
    expect(screen.getByRole("button", { name: "열기" })).not.toHaveFocus()

    rerender(
      <Dialog defaultOpen={false}>
        <DialogContent aria-label="확인" data-testid="dialog" />
      </Dialog>
    )
    expect(screen.getByTestId("dialog")).toHaveAttribute("data-state", "closed")
  })

  it("native props와 ref를 전달하고 Context 밖 compound에는 오류를 낸다", () => {
    const ref = createRef<HTMLDialogElement>()
    render(<Dialog><DialogContent aria-label="확인" data-testid="dialog" ref={ref} /></Dialog>)

    expect(ref.current).toBe(screen.getByTestId("dialog"))
    expect(screen.getByTestId("dialog")).toHaveAttribute("data-state", "closed")
    expect(() => render(<DialogTrigger>열기</DialogTrigger>)).toThrow(
      "Dialog compound components must be used within Dialog"
    )
  })
})
