import { forwardRef, type ComponentPropsWithoutRef } from "react"

export type InputSize = "sm" | "md" | "lg" | "xl"

export type InputProps = ComponentPropsWithoutRef<"input"> & {
  size?: InputSize
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, disabled, invalid = false, readOnly, size = "md", ...props },
  ref
) {
  const state = disabled ? "disabled" : readOnly ? "readonly" : invalid ? "invalid" : "idle"

  return (
    <input
      {...props}
      ref={ref}
      className={["jds-input", className].filter(Boolean).join(" ")}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      data-size={size}
      data-state={state}
    />
  )
})
