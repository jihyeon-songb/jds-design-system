import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

const AUTO_DISMISS_MS = 5_000
const MAX_TOASTS = 3

export type ToastVariant = "success" | "info" | "warning" | "error"

export type ToastOptions = {
  message: ReactNode
  title?: ReactNode
  variant?: ToastVariant
}

export type ToastApi = {
  dismiss: (id: string) => void
  error: (options: Omit<ToastOptions, "variant">) => string | undefined
  info: (options: Omit<ToastOptions, "variant">) => string | undefined
  success: (options: Omit<ToastOptions, "variant">) => string | undefined
  warning: (options: Omit<ToastOptions, "variant">) => string | undefined
}

export type ToastProviderProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
}

export type ToastProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "title"> & {
  message: ReactNode
  onDismiss: () => void
  title?: ReactNode
  variant: ToastVariant
}

type ToastRecord = {
  id: string
  message: ReactNode
  title?: ReactNode
  variant: ToastVariant
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const path = {
    success: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    info: <><path d="M12 11v6" /><path d="M12 7h.01" /></>,
    warning: <><path d="M12 7v6" /><path d="M12 17h.01" /></>,
    error: <><path d="m8 8 8 8" /><path d="m16 8-8 8" /></>,
  }[variant]

  return <span aria-hidden="true" data-slot="icon"><svg fill="none" viewBox="0 0 24 24">{path}</svg></span>
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { className, message, onDismiss, title, variant, ...props },
  ref
) {
  return (
    <div
      {...props}
      ref={ref}
      aria-live="polite"
      className={["jdsb-toast", className].filter(Boolean).join(" ")}
      data-variant={variant}
      role="status"
    >
      <ToastIcon variant={variant} />
      <div data-slot="content">
        {title != null ? <strong data-slot="title">{title}</strong> : null}
        <div data-slot="message">{message}</div>
      </div>
      <button aria-label="닫기" data-slot="close" onClick={onDismiss} type="button">
        ×
      </button>
    </div>
  )
})

export const ToastProvider = forwardRef<HTMLDivElement, ToastProviderProps>(function ToastProvider(
  { children, className, ...props },
  ref
) {
  const [records, setRecords] = useState<ToastRecord[]>([])
  const recordsRef = useRef<ToastRecord[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const nextIdRef = useRef(0)

  function replaceRecords(next: ToastRecord[]): void {
    recordsRef.current = next
    setRecords(next)
  }

  function dismiss(id: string): void {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    replaceRecords(recordsRef.current.filter((record) => record.id !== id))
  }

  function add(options: Omit<ToastOptions, "variant">, variant: ToastVariant): string | undefined {
    const current = recordsRef.current
    const oldestDismissibleIndex = current.findIndex((record) => record.variant !== "error")
    if (current.length === MAX_TOASTS && oldestDismissibleIndex === -1) return undefined

    const id = "toast-" + ++nextIdRef.current
    const next = [...current, { ...options, id, variant }]

    if (next.length > MAX_TOASTS) {
      const [removed] = next.splice(oldestDismissibleIndex, 1)
      const timer = timersRef.current.get(removed.id)
      if (timer !== undefined) {
        clearTimeout(timer)
        timersRef.current.delete(removed.id)
      }
    }

    replaceRecords(next)

    if (variant !== "error") {
      timersRef.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS))
    }

    return id
  }

  useEffect(() => () => {
    for (const timer of timersRef.current.values()) clearTimeout(timer)
  }, [])

  const api: ToastApi = {
    dismiss,
    error: (options) => add(options, "error"),
    info: (options) => add(options, "info"),
    success: (options) => add(options, "success"),
    warning: (options) => add(options, "warning"),
  }

  return (
    <ToastContext.Provider value={api}>
      <div
        {...props}
        ref={ref}
        className={["jdsb-toast-provider", className].filter(Boolean).join(" ")}
      >
        {children}
        <div aria-label="알림" className="jdsb-toast-viewport" role="region">
          {records.map((record) => (
            <Toast key={record.id} message={record.message} onDismiss={() => dismiss(record.id)} title={record.title} variant={record.variant} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
})
