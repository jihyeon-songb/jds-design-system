import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Field as PublicField, Label as PublicLabel } from "../index.js"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Label,
} from "./Field.js"

afterEach(cleanup)

describe("Field", () => {
  it("connects a native label to a checkbox", async () => {
    const user = userEvent.setup()
    render(
      <>
        <input id="terms" type="checkbox" />
        <Label htmlFor="terms">약관 동의</Label>
      </>
    )

    await user.click(screen.getByText("약관 동의"))

    expect(screen.getByRole("checkbox", { name: "약관 동의" })).toBeChecked()
  })

  it("renders documented Field slots", () => {
    render(
      <FieldGroup>
        <Field orientation="horizontal">
          <input id="notice" type="checkbox" />
          <FieldContent>
            <FieldLabel htmlFor="notice">알림</FieldLabel>
            <FieldDescription id="notice-help">언제든 변경할 수 있습니다.</FieldDescription>
            <FieldError id="notice-error">오류</FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>
    )

    expect(screen.getByText("알림").tagName).toBe("LABEL")
    expect(screen.getByText("언제든 변경할 수 있습니다.").tagName).toBe("DIV")
    expect(screen.getByText("오류")).not.toHaveAttribute("role", "alert")
    expect(screen.getByText("알림").closest("[data-orientation]")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    )
  })

  it("forwards refs and native props", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Field ref={ref} data-disabled data-testid="field" />)

    expect(ref.current).toBe(screen.getByTestId("field"))
    expect(screen.getByTestId("field")).toHaveAttribute("data-disabled", "true")
    expect(ref.current).toHaveAttribute("data-orientation", "vertical")
  })

  it("forwards refs and native props on every slot", () => {
    const labelRef = createRef<HTMLLabelElement>()
    const groupRef = createRef<HTMLDivElement>()
    const contentRef = createRef<HTMLDivElement>()
    const fieldLabelRef = createRef<HTMLLabelElement>()
    const titleRef = createRef<HTMLDivElement>()
    const descriptionRef = createRef<HTMLDivElement>()
    const errorRef = createRef<HTMLDivElement>()

    render(
      <>
        <Label ref={labelRef} htmlFor="control">Label</Label>
        <FieldGroup ref={groupRef} title="group" />
        <FieldContent ref={contentRef} title="content" />
        <FieldLabel ref={fieldLabelRef} htmlFor="control">Field label</FieldLabel>
        <FieldTitle ref={titleRef} title="title">Title</FieldTitle>
        <FieldDescription ref={descriptionRef} title="description">Description</FieldDescription>
        <FieldError ref={errorRef} title="error">Error</FieldError>
      </>
    )

    expect(labelRef.current?.tagName).toBe("LABEL")
    expect(labelRef.current).toHaveAttribute("for", "control")
    expect(groupRef.current).toHaveAttribute("title", "group")
    expect(contentRef.current).toHaveAttribute("title", "content")
    expect(fieldLabelRef.current?.tagName).toBe("LABEL")
    expect(fieldLabelRef.current).toHaveAttribute("for", "control")
    expect(titleRef.current).toHaveAttribute("title", "title")
    expect(descriptionRef.current).toHaveAttribute("title", "description")
    expect(errorRef.current).toHaveAttribute("title", "error")
  })

  it("preserves explicit description and error connections", () => {
    render(
      <Field>
        <input id="email" type="checkbox" aria-describedby="email-help email-error" aria-invalid="false" />
        <FieldContent>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <FieldDescription id="email-help">알림 수신에 사용합니다.</FieldDescription>
          <FieldError id="email-error">올바른 주소를 입력하세요.</FieldError>
        </FieldContent>
      </Field>
    )

    const control = screen.getByRole("checkbox", { name: "이메일" })
    expect(control).toHaveAttribute("aria-describedby", "email-help email-error")
    expect(control).toHaveAttribute("aria-invalid", "false")
  })

  it("exports Field and Label from the public package entry", () => {
    expect(PublicField).toBe(Field)
    expect(PublicLabel).toBe(Label)
  })
})
