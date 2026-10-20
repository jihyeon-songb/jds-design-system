import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Card as PublicCard,
  CardContent as PublicCardContent,
  CardDescription as PublicCardDescription,
  CardFooter as PublicCardFooter,
  CardHeader as PublicCardHeader,
  CardTitle as PublicCardTitle,
  type CardContentProps as PublicCardContentProps,
  type CardDescriptionProps as PublicCardDescriptionProps,
  type CardFooterProps as PublicCardFooterProps,
  type CardHeaderProps as PublicCardHeaderProps,
  type CardProps as PublicCardProps,
  type CardTitleProps as PublicCardTitleProps,
} from "../index.js"
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
  it("exports all Card primitives and prop types from the package entry", () => {
    const props: PublicCardProps = { children: "사용량" }
    const headerProps: PublicCardHeaderProps = { children: "제목" }
    const titleProps: PublicCardTitleProps<"h2"> = { as: "h2", children: "제목" }
    const descriptionProps: PublicCardDescriptionProps = { children: "설명" }
    const contentProps: PublicCardContentProps = { children: "본문" }
    const footerProps: PublicCardFooterProps = { children: "동작" }
    render(<PublicCard {...props} />)

    expect(PublicCard).toBe(Card)
    expect(PublicCardHeader).toBe(CardHeader)
    expect(PublicCardTitle).toBe(CardTitle)
    expect(PublicCardDescription).toBe(CardDescription)
    expect(PublicCardContent).toBe(CardContent)
    expect(PublicCardFooter).toBe(CardFooter)
    expect(headerProps.children).toBe("제목")
    expect(titleProps.as).toBe("h2")
    expect(descriptionProps.children).toBe("설명")
    expect(contentProps.children).toBe("본문")
    expect(footerProps.children).toBe("동작")
    expect(screen.getByText("사용량")).toHaveClass("jdsb-card")
  })

  it("forwards Card div props and its ref", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card aria-label="월간 사용량" className="consumer-card" id="usage" ref={ref} />)

    expect(ref.current).toBe(screen.getByLabelText("월간 사용량"))
    expect(ref.current).toHaveAttribute("id", "usage")
    expect(ref.current).toHaveClass("jdsb-card", "consumer-card")
  })

  it("forwards props, events, and refs for structural primitives", () => {
    const headerRef = createRef<HTMLDivElement>()
    const descriptionRef = createRef<HTMLDivElement>()
    const contentRef = createRef<HTMLDivElement>()
    const footerRef = createRef<HTMLDivElement>()
    const onClick = vi.fn()
    render(
      <Card>
        <CardHeader className="consumer-header" data-testid="header" id="card-header" ref={headerRef}>
          <CardDescription className="consumer-description" data-testid="description" ref={descriptionRef}>설명</CardDescription>
        </CardHeader>
        <CardContent className="consumer-content" data-testid="content" onClick={onClick} ref={contentRef}>본문</CardContent>
        <CardFooter className="consumer-footer" data-testid="footer" ref={footerRef}>동작</CardFooter>
      </Card>
    )

    expect(headerRef.current).toBe(screen.getByTestId("header"))
    expect(headerRef.current).toHaveAttribute("id", "card-header")
    expect(headerRef.current).toHaveClass("jdsb-card-header", "consumer-header")
    expect(descriptionRef.current).toBe(screen.getByTestId("description"))
    expect(descriptionRef.current).toHaveClass("jdsb-card-description", "consumer-description")
    expect(contentRef.current).toBe(screen.getByTestId("content"))
    expect(contentRef.current).toHaveClass("jdsb-card-content", "consumer-content")
    expect(footerRef.current).toBe(screen.getByTestId("footer"))
    expect(footerRef.current).toHaveClass("jdsb-card-footer", "consumer-footer")
    fireEvent.click(screen.getByTestId("content"))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("uses h3 by default and supports a native heading override", () => {
    const ref = createRef<HTMLHeadingElement>()
    const { rerender } = render(<CardTitle>기본 제목</CardTitle>)
    expect(screen.getByRole("heading", { level: 3, name: "기본 제목" })).toHaveClass("jdsb-card-title")

    rerender(<CardTitle as="h2" className="consumer-title" id="section-title" ref={ref}>섹션 제목</CardTitle>)
    expect(ref.current).toBe(screen.getByRole("heading", { level: 2, name: "섹션 제목" }))
    expect(ref.current).toHaveAttribute("id", "section-title")
    expect(ref.current).toHaveClass("jdsb-card-title", "consumer-title")
  })
})
