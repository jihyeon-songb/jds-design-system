import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type AlertVariant = "info" | "success" | "warning" | "error"

type AlertBaseProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title?: ReactNode
  variant?: AlertVariant
}

export type AlertProps =
  | (AlertBaseProps & { dismissible?: false; closeLabel?: never })
  | (AlertBaseProps & { closeLabel: string; dismissible: true })

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    children,
    closeLabel,
    defaultOpen = true,
    dismissible,
    onOpenChange,
    open,
    title,
    variant = "info",
    ...props
  },
  ref
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = open ?? uncontrolledOpen
  const close = () => {
    onOpenChange?.(false)
    if (open === undefined) setUncontrolledOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      {...props}
      ref={ref}
      data-state="open"
      data-variant={variant}
      role={variant === "error" ? "alert" : "status"}
    >
      {title != null ? <div data-slot="title">{title}</div> : null}
      <div data-slot="description">{children}</div>
      {dismissible ? <button aria-label={closeLabel} data-slot="close" onClick={close} type="button">×</button> : null}
    </div>
  )
})
