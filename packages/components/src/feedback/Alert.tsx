import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"

export type AlertVariant = "info" | "success" | "warning" | "error"

/*
  Omit<ComponentPropsWithoutRef<"div">, "role">
  - Omit<..., "role">은 그중에서 role 프로퍼티만 빼버린 타입
  - role은 내부적으로 직접 관리할 것이기 때문
 */
type AlertBaseProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title?: ReactNode
  variant?: AlertVariant
}

/*
  dismissible과 closeLabel을 서로 연동시키는 discriminated union
  닫기 버튼을 쓸 거면(dismissible: true) 반드시 closeLabel을 줘야 하고, 안 쓸 거면(dismissible: false) closeLabel을 아예 주면 안 된다
 */
export type AlertProps =
  | (AlertBaseProps & { dismissible?: false; closeLabel?: never })
  | (AlertBaseProps & { closeLabel: string; dismissible: true })

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    children,
    className,
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
  /*
  - open은 부모가 넘겨주는 prop(제어값)이고, uncontrolledOpen은 컴포넌트 내부 상태(비제어값)
   */

  const close = () => {
    onOpenChange?.(false) // 부모에게 알린다.
    if (open === undefined) setUncontrolledOpen(false) // 비제어 모드일 때만 내부상태 직접 변경
  }

  if (!isOpen) return null

  return (
    <div
      {...props}
      ref={ref}
      className={["jdsb-alert", className].filter(Boolean).join(" ")}
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
