import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type RefObject,
} from "react"

type PopoverUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type PopoverControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type PopoverProps = ComponentPropsWithoutRef<"span"> &
  (PopoverUncontrolledProps | PopoverControlledProps)

export type PopoverTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "aria-haspopup" | "popoverTarget" | "type"
>

export type PopoverSide = "top" | "right" | "bottom" | "left"

export type PopoverContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "hidden" | "id" | "popover"
> & {
  side?: PopoverSide
}

type PopoverContextValue = {
  contentId: string
  contentRef: RefObject<HTMLDivElement | null>
  controlled: boolean
  open: boolean
  requestOpen: (nextOpen: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(): PopoverContextValue {
  const context = useContext(PopoverContext)
  if (!context) throw new Error("Popover compound components must be used within Popover")
  return context
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function isNativePopoverOpen(element: HTMLDivElement): boolean {
  try {
    return element.matches(":popover-open")
  } catch {
    return false
  }
}

export function Popover({ children, className, defaultOpen = false, onOpenChange, open, ...props }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const contentId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isOpen = open ?? uncontrolledOpen
  const requestOpen = (nextOpen: boolean): void => {
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <PopoverContext.Provider
      value={{ contentId, contentRef, controlled: open !== undefined, open: isOpen, requestOpen, triggerRef }}
    >
      <span {...props} className={["jdsb-popover", className].filter(Boolean).join(" ")}>
        {children}
      </span>
    </PopoverContext.Provider>
  )
}

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(
  { className, onClick, ...props },
  ref
) {
  const { contentId, open, requestOpen, triggerRef } = usePopoverContext()

  return (
    <button
      {...props}
      ref={(element) => {
        triggerRef.current = element
        assignRef(ref, element)
      }}
      type="button"
      className={["jdsb-popover-trigger", className].filter(Boolean).join(" ")}
      aria-controls={contentId}
      aria-expanded={open}
      aria-haspopup="dialog"
      popoverTarget={contentId}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          event.preventDefault()
          requestOpen(!open)
        }
      }}
    />
  )
})

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  { className, side = "bottom", ...props },
  ref
) {
  const { contentId, contentRef, controlled, open, requestOpen, triggerRef } = usePopoverContext()
  const supportsNativePopover =
    typeof HTMLElement !== "undefined" && typeof HTMLElement.prototype.showPopover === "function"

  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const closeAndRestoreFocus = (): void => {
      requestOpen(false)
      const trigger = triggerRef.current
      if (trigger?.isConnected && !trigger.disabled) trigger.focus()
    }

    if (typeof element.showPopover === "function") {
      const handleToggle = (event: Event): void => {
        if ((event as ToggleEvent).newState === "closed" && open) {
          closeAndRestoreFocus()
          if (controlled && element.isConnected && !isNativePopoverOpen(element)) element.showPopover()
        }
      }

      element.addEventListener("toggle", handleToggle)
      const nativeOpen = isNativePopoverOpen(element)
      if (open && !nativeOpen) element.showPopover()
      else if (!open && nativeOpen) element.hidePopover()

      return () => element.removeEventListener("toggle", handleToggle)
    }

    if (!open) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeAndRestoreFocus()
    }
    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (
        target instanceof Node &&
        (triggerRef.current?.contains(target) === true || contentRef.current?.contains(target) === true)
      ) {
        return
      }
      closeAndRestoreFocus()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [contentRef, open, requestOpen, triggerRef])

  return (
    <div
      {...props}
      ref={(element) => {
        contentRef.current = element
        assignRef(ref, element)
      }}
      id={contentId}
      popover="auto"
      hidden={supportsNativePopover ? undefined : !open}
      className={["jdsb-popover-content", className].filter(Boolean).join(" ")}
      data-state={open ? "open" : "closed"}
      data-side={side}
    />
  )
})
