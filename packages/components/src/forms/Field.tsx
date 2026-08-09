import { forwardRef, type ComponentPropsWithoutRef } from "react"

export type LabelProps = ComponentPropsWithoutRef<"label">
export type FieldGroupProps = ComponentPropsWithoutRef<"div">
export type FieldProps = ComponentPropsWithoutRef<"div"> & {
  orientation?: "vertical" | "horizontal"
}
export type FieldContentProps = ComponentPropsWithoutRef<"div">
export type FieldLabelProps = ComponentPropsWithoutRef<"label">
export type FieldTitleProps = ComponentPropsWithoutRef<"div">
export type FieldDescriptionProps = ComponentPropsWithoutRef<"div">
export type FieldErrorProps = ComponentPropsWithoutRef<"div">

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label({ className, ...props }, ref) {
  return <label {...props} ref={ref} className={["jdsb-label", className].filter(Boolean).join(" ")} />
})

export const FieldGroup = forwardRef<HTMLDivElement, FieldGroupProps>(function FieldGroup({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={["jdsb-field-group", className].filter(Boolean).join(" ")} />
})

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { className, orientation = "vertical", ...props },
  ref
) {
  return <div {...props} ref={ref} className={["jdsb-field", className].filter(Boolean).join(" ")} data-orientation={orientation} />
})

export const FieldContent = forwardRef<HTMLDivElement, FieldContentProps>(function FieldContent({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={["jdsb-field-content", className].filter(Boolean).join(" ")} />
})

export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel({ className, ...props }, ref) {
  return <label {...props} ref={ref} className={["jdsb-field-label", className].filter(Boolean).join(" ")} />
})

export const FieldTitle = forwardRef<HTMLDivElement, FieldTitleProps>(function FieldTitle({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={["jdsb-field-title", className].filter(Boolean).join(" ")} />
})

export const FieldDescription = forwardRef<HTMLDivElement, FieldDescriptionProps>(function FieldDescription({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={["jdsb-field-description", className].filter(Boolean).join(" ")} />
})

export const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(function FieldError({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={["jdsb-field-error", className].filter(Boolean).join(" ")} />
})
