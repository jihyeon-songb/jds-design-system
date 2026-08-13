import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card.js"

afterEach(cleanup)

describe("Card", () => {
  it("forwards Card div props and its ref", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card aria-label="월간 사용량" className="consumer-card" id="usage" ref={ref} />)

    expect(ref.current).toBe(screen.getByLabelText("월간 사용량"))
    expect(ref.current).toHaveAttribute("id", "usage")
    expect(ref.current).toHaveClass("jdsb-card", "consumer-card")
  })

  it("renders the structural primitives as div elements", () => {
    render(
      <Card>
        <CardHeader data-testid="header"><CardDescription>설명</CardDescription></CardHeader>
        <CardContent data-testid="content">본문</CardContent>
        <CardFooter data-testid="footer">동작</CardFooter>
      </Card>
    )

    expect(screen.getByTestId("header").tagName).toBe("DIV")
    expect(screen.getByText("설명").tagName).toBe("DIV")
    expect(screen.getByTestId("content").tagName).toBe("DIV")
    expect(screen.getByTestId("footer").tagName).toBe("DIV")
  })

  it("uses h3 by default and supports a native heading override", () => {
    const { rerender } = render(<CardTitle>기본 제목</CardTitle>)
    expect(screen.getByRole("heading", { level: 3, name: "기본 제목" })).toHaveClass("jdsb-card-title")

    rerender(<CardTitle as="h2">섹션 제목</CardTitle>)
    expect(screen.getByRole("heading", { level: 2, name: "섹션 제목" })).toHaveClass("jdsb-card-title")
  })
})
