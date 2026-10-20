import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Progress as PublicProgress, type ProgressProps as PublicProgressProps } from "../index.js"
import { Progress } from "./Progress.js"

afterEach(cleanup)

describe("Progress", () => {
  it("exports Progress and its prop type from the package entry", () => {
    const props: PublicProgressProps = { label: "파일 업로드", max: 100, value: 40 }
    render(<PublicProgress {...props} data-testid="public-progress" />)

    expect(PublicProgress).toBe(Progress)
    expect(screen.getByTestId("public-progress")).toHaveClass("jdsb-progress")
  })

  it("renders a named determinate native progressbar", () => {
    render(<Progress label="파일 업로드" max={100} value={40} />)

    expect(screen.getByRole("progressbar", { name: "파일 업로드" })).toHaveValue(40)
  })

  it("keeps the native indeterminate state when value is absent", () => {
    render(<Progress label="파일 업로드 진행 중" max={100} />)

    expect(screen.getByRole("progressbar", { name: "파일 업로드 진행 중" })).not.toHaveAttribute("value")
  })

  it("forwards native props, events, and its progress ref", () => {
    const ref = createRef<HTMLProgressElement>()
    const onClick = vi.fn()
    render(<Progress className="consumer-progress" id="upload" label="업로드" onClick={onClick} ref={ref} value={1} />)

    const progress = screen.getByRole("progressbar", { name: "업로드" })
    expect(ref.current).toBe(progress)
    expect(progress).toHaveAttribute("id", "upload")
    expect(progress).toHaveClass("jdsb-progress", "consumer-progress")
    fireEvent.click(progress)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
