import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react"

const OPEN_DELAY = 300

type TooltipContextValue = {
  contentId: string
  closeNow: () => void
  open: boolean
  openAfterDelay: () => void
  wrapperRef: RefObject<HTMLSpanElement | null>
}

export type TooltipSide = "top" | "right" | "bottom" | "left"
export type TooltipProps = ComponentPropsWithoutRef<"span"> & { children: ReactNode }
export type TooltipTriggerProps = { children: ReactElement }
export type TooltipContentProps = Omit<ComponentPropsWithoutRef<"span">, "id" | "role" | "tabIndex"> & {
  side?: TooltipSide
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

function useTooltipContext(): TooltipContextValue {
  const context = useContext(TooltipContext)
  if (!context) throw new Error("Tooltip compound components must be used within Tooltip")
  return context
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function isWithinWrapper(wrapper: HTMLSpanElement | null, target: EventTarget | null): boolean {
  return target instanceof Node && wrapper?.contains(target) === true
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  { children, className, ...props },
  ref
) {
  const contentId = useId()
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  function closeNow(): void {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current)
    timerRef.current = undefined
    setOpen(false)
  }

  function openAfterDelay(): void {
    if (open || timerRef.current !== undefined) return
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined
      setOpen(true)
    }, OPEN_DELAY)
  }

  useEffect(() => () => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current)
  }, [])

  return (
    <TooltipContext.Provider value={{ contentId, closeNow, open, openAfterDelay, wrapperRef }}>
      <span
        {...props}
        ref={(element) => {
          wrapperRef.current = element
          assignRef(ref, element)
        }}
        className={["jdsb-tooltip", className].filter(Boolean).join(" ")}
      >
        {children}
      </span>
    </TooltipContext.Provider>
  )
})

export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { children },
  ref
) {
  const { closeNow, contentId, openAfterDelay, wrapperRef } = useTooltipContext()
  const child = Children.only(children) as ReactElement<any>
  const describedBy = new Set((child.props["aria-describedby"] ?? "").split(/\s+/).filter(Boolean))
  describedBy.add(contentId)

  return cloneElement(child, {
    "aria-describedby": [...describedBy].join(" "),
    ref: (element: HTMLElement | null) => {
      assignRef(child.props.ref, element)
      assignRef(ref, element)
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(event)
      if (!event.defaultPrevented) openAfterDelay()
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(event)
      if (!event.defaultPrevented) closeNow()
    },
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerEnter?.(event)
      if (!event.defaultPrevented) openAfterDelay()
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerLeave?.(event)
      if (!event.defaultPrevented && !isWithinWrapper(wrapperRef.current, event.relatedTarget)) closeNow()
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      child.props.onKeyDown?.(event)
      if (!event.defaultPrevented && event.key === "Escape") closeNow()
    },
  })
})

export const TooltipContent = forwardRef<HTMLSpanElement, TooltipContentProps>(function TooltipContent(
  contentProps,
  ref
) {
  const { className, onPointerLeave, side = "top", tabIndex: _tabIndex, ...props } = contentProps as TooltipContentProps & {
    tabIndex?: unknown
  }
  const { closeNow, contentId, open, wrapperRef } = useTooltipContext()

  return (
    <span
      {...props}
      ref={ref}
      id={contentId}
      role="tooltip"
      hidden={!open}
      className={["jdsb-tooltip-content", className].filter(Boolean).join(" ")}
      data-state={open ? "open" : "closed"}
      data-side={side}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (!event.defaultPrevented && !isWithinWrapper(wrapperRef.current, event.relatedTarget)) closeNow()
      }}
    />
  )
})
