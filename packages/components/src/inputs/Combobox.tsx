import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react"

type ComboboxValueUncontrolledProps = {
  defaultValue?: string
  onValueChange?: (value: string) => void
  value?: never
}

type ComboboxValueControlledProps = {
  defaultValue?: never
  onValueChange?: (value: string) => void
  value: string
}

type ComboboxOpenUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type ComboboxOpenControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type ComboboxProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue"> & {
  children: ReactNode
  disabled?: boolean
  invalid?: boolean
  name?: string
  required?: boolean
} & (ComboboxValueUncontrolledProps | ComboboxValueControlledProps)
  & (ComboboxOpenUncontrolledProps | ComboboxOpenControlledProps)

export type ComboboxInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  | "aria-activedescendant"
  | "aria-autocomplete"
  | "aria-controls"
  | "aria-expanded"
  | "aria-haspopup"
  | "defaultValue"
  | "role"
  | "value"
>

export type ComboboxListProps = Omit<ComponentPropsWithoutRef<"div">, "role">

export type ComboboxOptionProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-selected" | "role"
> & {
  disabled?: boolean
  value: string
}

export type ComboboxEmptyProps = ComponentPropsWithoutRef<"div">

type ComboboxOptionRecord = {
  disabled: boolean
  id: string
  ref: RefObject<HTMLDivElement | null>
  text: string
  value: string
}

type ComboboxContextValue = {
  activeOptionId: string | undefined
  disabled: boolean
  invalid: boolean
  listId: string
  open: boolean
  query: string
  required: boolean
  selectedValue: string | undefined
  visibleOptions: ComboboxOptionRecord[]
  inputRef: RefObject<HTMLInputElement | null>
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  registerOption: (option: ComboboxOptionRecord) => () => void
  requestOpen: (open: boolean) => void
  requestValue: (value: string) => void
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null)

function useComboboxContext(): ComboboxContextValue {
  const context = useContext(ComboboxContext)
  if (!context) throw new Error("Combobox compound components must be used within Combobox")
  return context
}

type ComboboxChildProps = {
  children?: ReactNode
  id?: string
  value?: string
}

function getTextContent(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child)
    return isValidElement<ComboboxChildProps>(child) ? getTextContent(child.props.children) : ""
  }).join("")
}

function findChild(
  children: ReactNode,
  matches: (child: ReactElement<ComboboxChildProps>) => boolean
): ReactElement<ComboboxChildProps> | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<ComboboxChildProps>(child)) continue
    if (matches(child)) return child
    const nested = findChild(child.props.children, matches)
    if (nested) return nested
  }
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

export function Combobox({
  children,
  className,
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
  ...props
}: ComboboxProps) {
  const generatedListId = useId()
  const [activeOptionId, setActiveOptionId] = useState<string>()
  const [options, setOptions] = useState<ComboboxOptionRecord[]>([])
  const [query, setQuery] = useState("")
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedValue = value ?? uncontrolledValue
  const isOpen = !disabled && (open ?? uncontrolledOpen)
  const list = findChild(children, (child) => child.type === ComboboxList)
  const selectedChild = findChild(
    children,
    (child) => child.type === ComboboxOption && child.props.value === selectedValue
  )
  const listId = list?.props.id ?? generatedListId
  const selectedText = options.find((option) => option.value === selectedValue)?.text
    ?? (selectedChild ? getTextContent(selectedChild.props.children) : undefined)
  const visibleOptions = options.filter((option) =>
    option.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  )
  const enabledOptions = visibleOptions.filter((option) => !option.disabled)

  const registerOption = useCallback((option: ComboboxOptionRecord) => {
    setOptions((current) => [...current.filter((item) => item.id !== option.id), option])
    return () => setOptions((current) => current.filter((item) => item.id !== option.id))
  }, [])

  function requestOpen(nextOpen: boolean): void {
    if (nextOpen && disabled) return
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  function requestValue(nextValue: string): void {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    const nextText = value === undefined
      ? options.find((option) => option.value === nextValue)?.text
      : selectedText
    setQuery(nextText ?? "")
  }

  function moveActive(direction: 1 | -1): void {
    const currentIndex = enabledOptions.findIndex((option) => option.id === activeOptionId)
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : enabledOptions.length - 1
      : Math.min(Math.max(currentIndex + direction, 0), enabledOptions.length - 1)
    setActiveOptionId(enabledOptions[nextIndex]?.id)
  }

  function moveToBoundary(boundary: "first" | "last"): void {
    setActiveOptionId(
      boundary === "first" ? enabledOptions[0]?.id : enabledOptions[enabledOptions.length - 1]?.id
    )
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>): void {
    setQuery(event.currentTarget.value)
    requestOpen(true)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (disabled) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      requestOpen(true)
      moveActive(event.key === "ArrowDown" ? 1 : -1)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      requestOpen(true)
      moveToBoundary(event.key === "Home" ? "first" : "last")
    } else if (event.key === "Enter") {
      const activeOption = enabledOptions.find((option) => option.id === activeOptionId)
      if (!isOpen || !activeOption) return
      event.preventDefault()
      requestValue(activeOption.value)
      requestOpen(false)
    } else if (event.key === "Escape") {
      event.preventDefault()
      setQuery(selectedText ?? "")
      requestOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setActiveOptionId(undefined)
      return
    }
    const selectedOption = enabledOptions.find((option) => option.value === selectedValue)
    setActiveOptionId((currentId) =>
      enabledOptions.some((option) => option.id === currentId)
        ? currentId
        : selectedOption?.id ?? enabledOptions[0]?.id
    )
  }, [isOpen, options, query, selectedValue])

  return (
    <ComboboxContext.Provider
      value={{
        activeOptionId,
        disabled,
        invalid,
        listId,
        open: isOpen,
        query,
        required,
        selectedValue,
        visibleOptions,
        inputRef,
        onInputChange,
        onInputKeyDown,
        registerOption,
        requestOpen,
        requestValue,
      }}
    >
      <div
        {...props}
        className={["jdsb-combobox", className].filter(Boolean).join(" ")}
        data-state={disabled ? "disabled" : invalid ? "invalid" : "enabled"}
      >
        {children}
        {name ? <input type="hidden" name={name} value={selectedValue ?? ""} disabled={disabled} /> : null}
      </div>
    </ComboboxContext.Provider>
  )
}

export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(function ComboboxInput(
  {
    "aria-invalid": ariaInvalid,
    className,
    disabled,
    onChange,
    onClick,
    onKeyDown,
    required,
    ...props
  },
  ref
) {
  const context = useComboboxContext()

  return (
    <input
      {...props}
      ref={(element) => {
        context.inputRef.current = element
        assignRef(ref, element)
      }}
      role="combobox"
      aria-activedescendant={context.activeOptionId}
      aria-autocomplete="list"
      aria-controls={context.listId}
      aria-expanded={context.open}
      aria-haspopup="listbox"
      aria-invalid={context.invalid ? true : ariaInvalid}
      className={["jdsb-combobox-input", className].filter(Boolean).join(" ")}
      disabled={context.disabled || disabled}
      required={context.required || required}
      value={context.query}
      onChange={(event) => {
        onChange?.(event)
        if (!event.defaultPrevented) context.onInputChange(event)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.requestOpen(true)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) context.onInputKeyDown(event)
      }}
    />
  )
})

export const ComboboxList = forwardRef<HTMLDivElement, ComboboxListProps>(function ComboboxList(
  { className, id, ...props },
  ref
) {
  const context = useComboboxContext()
  if (!context.open) return null

  return (
    <div
      {...props}
      ref={ref}
      className={["jdsb-combobox-list", className].filter(Boolean).join(" ")}
      id={id ?? context.listId}
      role="listbox"
    />
  )
})

export const ComboboxOption = forwardRef<HTMLDivElement, ComboboxOptionProps>(function ComboboxOption(
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
  const context = useComboboxContext()
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  const optionRef = useRef<HTMLDivElement>(null)
  const text = getTextContent(children)
  const isDisabled = context.disabled || disabled
  const selected = context.selectedValue === value
  const active = context.activeOptionId === id
  const visible = text.toLocaleLowerCase().includes(context.query.toLocaleLowerCase())
  const state = isDisabled ? "disabled" : active ? "active" : selected ? "selected" : "enabled"

  useEffect(
    () => context.registerOption({ disabled: isDisabled, id, ref: optionRef, text, value }),
    [context.registerOption, id, isDisabled, text, value]
  )

  if (!visible) return null

  return (
    <div
      {...props}
      ref={(element) => {
        optionRef.current = element
        assignRef(ref, element)
      }}
      aria-disabled={isDisabled || undefined}
      aria-selected={selected}
      className={["jdsb-combobox-option", className].filter(Boolean).join(" ")}
      data-state={state}
      id={id}
      role="option"
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented) event.preventDefault()
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

export const ComboboxEmpty = forwardRef<HTMLDivElement, ComboboxEmptyProps>(function ComboboxEmpty(
  { className, ...props },
  ref
) {
  const context = useComboboxContext()
  if (!context.open || context.visibleOptions.length > 0) return null

  return (
    <div
      {...props}
      ref={ref}
      className={["jdsb-combobox-empty", className].filter(Boolean).join(" ")}
    />
  )
})
