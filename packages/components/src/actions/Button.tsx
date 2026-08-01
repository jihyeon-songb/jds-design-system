import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive"
export type ButtonSize = "sm" | "md" | "lg" | "xl"

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, startIcon, endIcon, children, disabled, className, ...props },
  ref
) {
  return (
    <button
      {...props}
      ref={ref}
      className={["jds-button", className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-state={loading ? "loading" : "idle"}
      data-variant={variant}
      data-size={size}
    >
      {startIcon ? <span aria-hidden="true" data-slot="start-icon">{startIcon}</span> : null}
      {loading ? <span aria-hidden="true" data-slot="spinner" /> : null}
      <span data-slot="label">{children}</span>
      {endIcon ? <span aria-hidden="true" data-slot="end-icon">{endIcon}</span> : null}
    </button>
  )
})
