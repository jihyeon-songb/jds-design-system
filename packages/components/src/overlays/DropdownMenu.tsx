import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type KeyboardEvent,
  type RefObject,
} from "react"

type DropdownMenuUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type DropdownMenuControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type DropdownMenuProps = ComponentPropsWithoutRef<"span"> &
  (DropdownMenuUncontrolledProps | DropdownMenuControlledProps)

export type DropdownMenuTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "aria-haspopup" | "type"
>

export type DropdownMenuContentProps = ComponentPropsWithoutRef<"div">
export type DropdownMenuItemProps = Omit<ComponentPropsWithoutRef<"button">, "type">
export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<"div">

type ItemRecord = {
  disabled: boolean
  ref: RefObject<HTMLButtonElement | null>
}

type DropdownMenuContextValue = {
  contentId: string
  contentRef: RefObject<HTMLDivElement | null>
  moveFocus: (current: HTMLButtonElement, direction: "first" | "last" | -1 | 1) => void
  open: boolean
  registerItem: (item: ItemRecord) => () => void
  requestOpen: (nextOpen: boolean, focus?: "first" | "last") => void
  restoreTriggerFocus: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenuContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenu compound components must be used within DropdownMenu")
  return context
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

export function DropdownMenu({ children, className, defaultOpen = false, onOpenChange, open, ...props }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [items, setItems] = useState<ItemRecord[]>([])
  const [focusTarget, setFocusTarget] = useState<"first" | "last">()
  const contentId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isOpen = open ?? uncontrolledOpen
  const enabledItems = items.filter((item) => !item.disabled && item.ref.current?.isConnected)

  function requestOpen(nextOpen: boolean, focus?: "first" | "last"): void {
    if (open === undefined) setUncontrolledOpen(nextOpen)
    if (nextOpen) setFocusTarget(focus)
    onOpenChange?.(nextOpen)
  }

  function restoreTriggerFocus(): void {
    const trigger = triggerRef.current
    if (trigger?.isConnected && !trigger.disabled) trigger.focus()
  }

  const registerItem = useCallback((item: ItemRecord): (() => void) => {
    setItems((currentItems) => [...currentItems.filter((current) => current.ref !== item.ref), item])
    return () => setItems((currentItems) => currentItems.filter((current) => current.ref !== item.ref))
  }, [])

  function moveFocus(current: HTMLButtonElement, direction: "first" | "last" | -1 | 1): void {
    const currentIndex = enabledItems.findIndex((item) => item.ref.current === current)
    const nextIndex = direction === "first"
      ? 0
      : direction === "last"
        ? enabledItems.length - 1
        : Math.min(Math.max(currentIndex + direction, 0), enabledItems.length - 1)
    enabledItems[nextIndex]?.ref.current?.focus()
  }

  useEffect(() => {
    if (!isOpen || !focusTarget) return
    const item = focusTarget === "first" ? enabledItems[0] : enabledItems.at(-1)
    item?.ref.current?.focus()
    setFocusTarget(undefined)
  }, [enabledItems, focusTarget, isOpen])

  useEffect(() => {
    if (!isOpen) return

    function onDocumentPointerDown(event: PointerEvent): void {
      const target = event.target
      if (
        target instanceof Node &&
        (triggerRef.current?.contains(target) === true || contentRef.current?.contains(target) === true)
      ) return
      requestOpen(false)
      restoreTriggerFocus()
    }

    document.addEventListener("pointerdown", onDocumentPointerDown)
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown)
  }, [isOpen, open, onOpenChange])

  return (
    <DropdownMenuContext.Provider
      value={{ contentId, contentRef, moveFocus, open: isOpen, registerItem, requestOpen, restoreTriggerFocus, triggerRef }}
    >
      <span {...props} className={["jdsb-dropdown-menu", className].filter(Boolean).join(" ")}>{children}</span>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(function DropdownMenuTrigger(
  { className, onClick, onKeyDown, ...props },
  ref
) {
  const { contentId, open, requestOpen, triggerRef } = useDropdownMenuContext()

  return (
    <button
      {...props}
      ref={(element) => {
        triggerRef.current = element
        assignRef(ref, element)
      }}
      aria-controls={contentId}
      aria-expanded={open}
      aria-haspopup="menu"
      className={["jdsb-dropdown-menu-trigger", className].filter(Boolean).join(" ")}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) requestOpen(!open, "first")
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault()
          requestOpen(true, event.key === "ArrowDown" ? "first" : "last")
        }
      }}
    />
  )
})

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(function DropdownMenuContent(
  { className, onKeyDown, ...props },
  ref
) {
  const { contentId, contentRef, open, requestOpen, restoreTriggerFocus } = useDropdownMenuContext()

  return (
    <div
      {...props}
      ref={(element) => {
        contentRef.current = element
        assignRef(ref, element)
      }}
      id={contentId}
      hidden={!open}
      role="menu"
      className={["jdsb-dropdown-menu-content", className].filter(Boolean).join(" ")}
      data-state={open ? "open" : "closed"}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== "Escape") return
        event.preventDefault()
        requestOpen(false)
        restoreTriggerFocus()
      }}
    />
  )
})

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(function DropdownMenuItem(
  { className, disabled = false, onClick, onKeyDown, ...props },
  ref
) {
  const itemRef = useRef<HTMLButtonElement>(null)
  const { moveFocus, registerItem, requestOpen, restoreTriggerFocus } = useDropdownMenuContext()

  useEffect(() => registerItem({ disabled, ref: itemRef }), [disabled, registerItem])

  function onItemKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      moveFocus(event.currentTarget, event.key === "ArrowDown" ? 1 : -1)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      moveFocus(event.currentTarget, event.key === "Home" ? "first" : "last")
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <button
      {...props}
      ref={(element) => {
        itemRef.current = element
        assignRef(ref, element)
      }}
      className={["jdsb-dropdown-menu-item", className].filter(Boolean).join(" ")}
      disabled={disabled}
      role="menuitem"
      tabIndex={-1}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || disabled) return
        requestOpen(false)
        restoreTriggerFocus()
      }}
      onKeyDown={onItemKeyDown}
    />
  )
})

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(function DropdownMenuSeparator(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={["jdsb-dropdown-menu-separator", className].filter(Boolean).join(" ")} role="separator" />
})
