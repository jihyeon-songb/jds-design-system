import { forwardRef, type ComponentPropsWithoutRef } from "react"

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "error"

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = "neutral", ...props },
  ref
) {
  return (
    <span
      {...props}
      ref={ref}
      className={["jdsb-badge", className].filter(Boolean).join(" ")}
      data-variant={variant}
    />
  )
})
