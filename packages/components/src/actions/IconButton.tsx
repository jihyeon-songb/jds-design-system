import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type IconButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive"

export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> & {
  "aria-label": string
  variant?: IconButtonVariant
  loading?: boolean
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { "aria-label": ariaLabel, children, className, disabled, loading = false, variant = "primary", ...props },
  ref
) {
  return (
    <button
      {...props}
      ref={ref}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      className={["jds-icon-button", className].filter(Boolean).join(" ")}
      data-state={loading ? "loading" : disabled ? "disabled" : "idle"}
      data-variant={variant}
      disabled={disabled || loading}
    >
      <span aria-hidden="true" data-slot="icon">{children}</span>
      {loading ? <span aria-hidden="true" data-slot="spinner" /> : null}
    </button>
  )
})
