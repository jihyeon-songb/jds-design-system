import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react"

type SelectItemRecord = {
  value: string
  text: string
  disabled: boolean
  id: string
  ref: RefObject<HTMLDivElement | null>
}

type SelectContextValue = {
  activeItemId: string | undefined
  contentId: string
  contentRef: RefObject<HTMLDivElement | null>
  defaultContentId: string
  disabled: boolean
  invalid: boolean
  open: boolean
  required: boolean
  selectedValue: string | undefined
  selectedText: string | undefined
  onTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  registerItem: (item: SelectItemRecord) => () => void
  requestOpen: (open: boolean) => void
  requestValue: (value: string) => void
  setContentId: (id: string) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

const SelectContext = createContext<SelectContextValue | null>(null)
const SelectGroupContext = createContext<{
  defaultLabelId: string
  labelId: string
  setLabelId: (id: string) => void
} | null>(null)
const HANGUL_INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"

function getHangulInitials(text: string): string {
  return Array.from(text, (character) => {
    const code = character.charCodeAt(0)
    return code >= 0xac00 && code <= 0xd7a3
      ? HANGUL_INITIALS[Math.floor((code - 0xac00) / 588)]
      : character
  }).join("")
}

function useSelectContext(): SelectContextValue {
  const context = useContext(SelectContext)

  if (!context) throw new Error("Select compound components must be used within Select")

  return context
}

export type SelectProps = {
  children: ReactNode
  defaultOpen?: boolean
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  name?: string
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string) => void
  open?: boolean
  required?: boolean
  value?: string
}

export function Select({
  children,
  defaultOpen = false,
  defaultValue,
  disabled = false,
  invalid = false,
  name,
  onOpenChange,
  onValueChange,
  open,
  required = false,
  value,
}: SelectProps) {
  const generatedContentId = useId()
  const [items, setItems] = useState<SelectItemRecord[]>([])
  const [activeItemId, setActiveItemId] = useState<string>()
  const [contentId, setContentId] = useState(generatedContentId)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const typeaheadRef = useRef({ prefix: "", time: 0 })
  const selectedValue = value ?? uncontrolledValue
  const selectedText = items.find((item) => item.value === selectedValue)?.text
  const currentOpen = !disabled && (open ?? uncontrolledOpen)
  const enabledItems = items.filter((item) => !item.disabled).sort((first, second) => {
    const firstNode = first.ref.current
    const secondNode = second.ref.current
    if (!firstNode || !secondNode) return 0
    const position = firstNode.compareDocumentPosition(secondNode)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })

  const registerItem = useCallback((item: SelectItemRecord) => {
    setItems((currentItems) => [...currentItems.filter((current) => current.id !== item.id), item])
    return () => setItems((currentItems) => currentItems.filter((current) => current.id !== item.id))
  }, [])

  function requestOpen(nextOpen: boolean): void {
    if (nextOpen && disabled) return
    if (nextOpen) {
      const selectedItem = enabledItems.find((item) => item.value === selectedValue)
      setActiveItemId(selectedItem?.id ?? enabledItems[0]?.id)
    } else {
      typeaheadRef.current = { prefix: "", time: 0 }
    }
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  function requestValue(nextValue: string): void {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  function moveActive(direction: 1 | -1): void {
    const currentIndex = enabledItems.findIndex((item) => item.id === activeItemId)
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : enabledItems.length - 1
      : Math.min(Math.max(currentIndex + direction, 0), enabledItems.length - 1)
    setActiveItemId(enabledItems[nextIndex]?.id)
  }

  function moveToBoundary(boundary: "first" | "last"): void {
    setActiveItemId(
      boundary === "first" ? enabledItems[0]?.id : enabledItems[enabledItems.length - 1]?.id
    )
  }

  function selectActiveItem(): void {
    const activeItem = enabledItems.find((item) => item.id === activeItemId)
    if (!activeItem) return
    requestValue(activeItem.value)
    requestOpen(false)
  }

  function typeahead(character: string): void {
    const now = Date.now()
    const previousPrefix = now - typeaheadRef.current.time <= 500
      ? typeaheadRef.current.prefix
      : ""
    const prefix = `${previousPrefix}${character}`.toLocaleLowerCase()
    typeaheadRef.current = { prefix, time: now }
    const match = enabledItems.find((item) => {
      const text = item.text.toLocaleLowerCase()
      return text.startsWith(prefix) || getHangulInitials(text).startsWith(prefix)
    })
    if (match) setActiveItemId(match.id)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return

    if (!currentOpen) {
      if (event.key === "ArrowUp") {
        event.preventDefault()
        const selectedItem = enabledItems.find((item) => item.value === selectedValue)
        setActiveItemId(selectedItem?.id ?? enabledItems[enabledItems.length - 1]?.id)
        if (open === undefined) setUncontrolledOpen(true)
        onOpenChange?.(true)
      } else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        requestOpen(true)
      }
      return
    }

    if (event.key === "ArrowDown") moveActive(1)
    else if (event.key === "ArrowUp") moveActive(-1)
    else if (event.key === "Home") moveToBoundary("first")
    else if (event.key === "End") moveToBoundary("last")
    else if (event.key === "Enter" || event.key === " ") selectActiveItem()
    else if (event.key === "Escape") requestOpen(false)
    else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeahead(event.key)
    } else {
      return
    }
    event.preventDefault()
  }

  useEffect(() => {
    if (!currentOpen) {
      setActiveItemId(undefined)
      return
    }
    const selectedItem = enabledItems.find((item) => item.value === selectedValue)
    setActiveItemId((currentId) =>
      enabledItems.some((item) => item.id === currentId)
        ? currentId
        : selectedItem?.id ?? enabledItems[0]?.id
    )
  }, [currentOpen, items, selectedValue])

  useEffect(() => {
    if (!currentOpen) return

    function onDocumentPointerDown(event: PointerEvent): void {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) {
        requestOpen(false)
      }
    }

    document.addEventListener("pointerdown", onDocumentPointerDown)
    return () => document.removeEventListener("pointerdown", onDocumentPointerDown)
  }, [currentOpen])

  return (
    <SelectContext.Provider
      value={{
        activeItemId,
        contentId,
        contentRef,
        defaultContentId: generatedContentId,
        disabled,
        invalid,
        open: currentOpen,
        required,
        selectedValue,
        selectedText,
        onTriggerKeyDown,
        registerItem,
        requestOpen,
        requestValue,
        setContentId,
        triggerRef,
      }}
    >
      <div
        className="jds-select"
        data-slot="root"
        data-state={disabled ? "disabled" : currentOpen ? "open" : invalid ? "invalid" : "idle"}
      >
        {children}
        {name ? (
          <input
            disabled={disabled}
            name={name}
            type="hidden"
            value={selectedValue ?? ""}
          />
        ) : null}
      </div>
    </SelectContext.Provider>
  )
}

export type SelectTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "type">

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger(
  {
    "aria-invalid": ariaInvalid,
    children,
    className,
    disabled,
    onBlur,
    onClick,
    onKeyDown,
    ...props
  },
  ref
) {
  const context = useSelectContext()
  const isDisabled = context.disabled || disabled
  const state = isDisabled ? "disabled" : context.open ? "open" : context.invalid ? "invalid" : "idle"

  useImperativeHandle(ref, () => context.triggerRef.current as HTMLButtonElement)

  return (
    <button
      {...props}
      ref={context.triggerRef}
      aria-activedescendant={context.open ? context.activeItemId : undefined}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      aria-haspopup="listbox"
      aria-invalid={context.invalid ? true : ariaInvalid}
      aria-required={context.required || undefined}
      className={["jds-select-trigger", className].filter(Boolean).join(" ")}
      disabled={isDisabled}
      data-slot="trigger"
      data-state={state}
      role="combobox"
      type="button"
      onBlur={(event) => {
        onBlur?.(event)
        if (!event.defaultPrevented && context.open) context.requestOpen(false)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.requestOpen(!context.open)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) context.onTriggerKeyDown(event)
      }}
    >
      {children}
      <svg
        aria-hidden="true"
        className="jds-select-chevron"
        data-slot="icon"
        focusable="false"
        viewBox="0 0 16 16"
      >
        <path d="M3 6h10l-5 5z" fill="currentColor" />
      </svg>
    </button>
  )
})

export type SelectValueProps = ComponentPropsWithoutRef<"span"> & {
  placeholder?: ReactNode
}

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(function SelectValue(
  { className, placeholder, ...props },
  ref
) {
  const { selectedText } = useSelectContext()

  return (
    <span
      {...props}
      ref={ref}
      className={["jds-select-value", className].filter(Boolean).join(" ")}
      data-slot="value"
    >
      {selectedText ?? placeholder}
    </span>
  )
})

export type SelectContentProps = ComponentPropsWithoutRef<"div">

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(
  { className, id: suppliedId, ...props },
  ref
) {
  const context = useSelectContext()
  const id = suppliedId ?? context.defaultContentId

  useImperativeHandle(ref, () => context.contentRef.current as HTMLDivElement)
  useEffect(() => context.setContentId(id), [context.setContentId, id])

  return (
    <div
      {...props}
      ref={context.contentRef}
      className={["jds-select-content", className].filter(Boolean).join(" ")}
      data-slot="content"
      data-state={context.open ? "open" : "closed"}
      hidden={!context.open}
      id={id}
      role={context.open ? "listbox" : undefined}
    />
  )
})

export type SelectGroupProps = ComponentPropsWithoutRef<"div">

export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(
  { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, className, ...props },
  ref
) {
  const defaultLabelId = useId()
  const [labelId, setLabelId] = useState(defaultLabelId)

  return (
    <SelectGroupContext.Provider value={{ defaultLabelId, labelId, setLabelId }}>
      <div
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? (ariaLabel ? undefined : labelId)}
        className={["jds-select-group", className].filter(Boolean).join(" ")}
        data-slot="group"
        role="group"
      />
    </SelectGroupContext.Provider>
  )
})

export type SelectLabelProps = ComponentPropsWithoutRef<"div">

export const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(function SelectLabel(
  { className, id: suppliedId, ...props },
  ref
) {
  const group = useContext(SelectGroupContext)
  const generatedId = useId()
  const id = suppliedId ?? group?.defaultLabelId ?? generatedId

  useEffect(() => group?.setLabelId(id), [group?.setLabelId, id])

  return (
    <div
      {...props}
      ref={ref}
      className={["jds-select-label", className].filter(Boolean).join(" ")}
      data-slot="label"
      id={id}
    />
  )
})

export type SelectItemProps = Omit<ComponentPropsWithoutRef<"div">, "value"> & {
  value: string
  disabled?: boolean
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  {
    children,
    className,
    disabled = false,
    id: suppliedId,
    onClick,
    onPointerDown,
    value,
    ...props
  },
  ref
) {
  const context = useSelectContext()
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  const itemRef = useRef<HTMLDivElement>(null)
  const isDisabled = context.disabled || disabled
  const selected = context.selectedValue === value
  const active = context.activeItemId === id
  const state = isDisabled ? "disabled" : active ? "active" : selected ? "selected" : "idle"

  useImperativeHandle(ref, () => itemRef.current as HTMLDivElement)

  useEffect(
    () => context.registerItem({
      value,
      text: itemRef.current?.textContent ?? "",
      disabled,
      id,
      ref: itemRef,
    }),
    [children, context.registerItem, disabled, id, value]
  )

  return (
    <div
      {...props}
      ref={itemRef}
      aria-disabled={isDisabled || undefined}
      aria-selected={selected}
      className={["jds-select-item", className].filter(Boolean).join(" ")}
      data-slot="item"
      data-state={state}
      id={id}
      role="option"
      tabIndex={-1}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented && !isDisabled) event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || isDisabled) return
        context.requestValue(value)
        context.requestOpen(false)
      }}
    >
      {children}
    </div>
  )
})
