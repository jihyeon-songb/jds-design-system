import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Separator as PublicSeparator,
  type SeparatorOrientation as PublicSeparatorOrientation,
  type SeparatorProps as PublicSeparatorProps,
} from "../index.js"
import { Separator } from "./Separator.js"

afterEach(cleanup)

describe("Separator", () => {
  it("exports Separator and its public types from the package entry", () => {
    const horizontalProps: PublicSeparatorProps = { "aria-label": "구획" }
    const verticalProps: PublicSeparatorProps = { orientation: "vertical", "aria-label": "도구 모음 구획" }
    const orientation: PublicSeparatorOrientation = "vertical"
    render(<PublicSeparator {...horizontalProps} />)

    expect(PublicSeparator).toBe(Separator)
    expect(verticalProps.orientation).toBe(orientation)
    expect(screen.getByRole("separator", { name: "구획" }).tagName).toBe("HR")
  })

  it("renders a horizontal hr by default and forwards its props and ref", () => {
    const ref = createRef<HTMLHRElement>()
    render(<Separator aria-label="내용 구획" className="consumer-separator" id="content-separator" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole("separator", { name: "내용 구획" }))
    expect(ref.current?.tagName).toBe("HR")
    expect(ref.current).toHaveAttribute("id", "content-separator")
    expect(ref.current).toHaveClass("jdsb-separator", "consumer-separator")
  })

  it("renders a vertical separator and forwards its event and ref", () => {
    const ref = createRef<HTMLDivElement>()
    const onClick = vi.fn()
    render(<Separator aria-label="도구 모음 구획" onClick={onClick} orientation="vertical" ref={ref} />)

    const separator = screen.getByRole("separator", { name: "도구 모음 구획" })
    expect(ref.current).toBe(separator)
    expect(separator.tagName).toBe("DIV")
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
    fireEvent.click(separator)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
