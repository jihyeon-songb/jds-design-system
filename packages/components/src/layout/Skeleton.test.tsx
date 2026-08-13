import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Skeleton as PublicSkeleton,
  type SkeletonProps as PublicSkeletonProps,
} from "../index.js"
import { Skeleton } from "./Skeleton.js"

afterEach(cleanup)

describe("Skeleton", () => {
  it("exports Skeleton and its prop type from the package entry", () => {
    const props: PublicSkeletonProps = { className: "text-placeholder" }
    render(<PublicSkeleton {...props} data-testid="public-skeleton" />)

    expect(PublicSkeleton).toBe(Skeleton)
    expect(screen.getByTestId("public-skeleton")).toHaveClass("jdsb-skeleton", "text-placeholder")
  })

  it("renders a decorative span and forces aria-hidden", () => {
    render(<Skeleton aria-hidden={false} data-testid="skeleton" />)

    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton.tagName).toBe("SPAN")
    expect(skeleton).toHaveAttribute("aria-hidden", "true")
  })

  it("forwards native props, events, and its span ref", () => {
    const ref = createRef<HTMLSpanElement>()
    const onClick = vi.fn()
    render(<Skeleton className="consumer-skeleton" id="profile-name" onClick={onClick} ref={ref} data-testid="skeleton" />)

    const skeleton = screen.getByTestId("skeleton")
    expect(ref.current).toBe(skeleton)
    expect(skeleton).toHaveAttribute("id", "profile-name")
    expect(skeleton).toHaveClass("jdsb-skeleton", "consumer-skeleton")
    fireEvent.click(skeleton)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
