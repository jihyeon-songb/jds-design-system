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
  disabled: boolean
  invalid: boolean
  open: boolean
  required: boolean
  selectedValue: string | undefined
  selectedText: string | undefined
  registerItem: (item: SelectItemRecord) => () => void
  requestOpen: (open: boolean) => void
  requestValue: (value: string) => void
}

const SelectContext = createContext<SelectContextValue | null>(null)

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
  const [items, setItems] = useState<SelectItemRecord[]>([])
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const selectedValue = value ?? uncontrolledValue
  const selectedText = items.find((item) => item.value === selectedValue)?.text
  const currentOpen = open ?? uncontrolledOpen

  const registerItem = useCallback((item: SelectItemRecord) => {
    setItems((currentItems) => [...currentItems.filter((current) => current.id !== item.id), item])
    return () => setItems((currentItems) => currentItems.filter((current) => current.id !== item.id))
  }, [])

  function requestOpen(nextOpen: boolean): void {
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  function requestValue(nextValue: string): void {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <SelectContext.Provider
      value={{
        disabled,
        invalid,
        open: currentOpen,
        required,
        selectedValue,
        selectedText,
        registerItem,
        requestOpen,
        requestValue,
      }}
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
    </SelectContext.Provider>
  )
}

export type SelectTriggerProps = Omit<ComponentPropsWithoutRef<"button">, "type">

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger(
  { "aria-invalid": ariaInvalid, children, disabled, onClick, ...props },
  ref
) {
  const context = useSelectContext()
  const isDisabled = context.disabled || disabled

  return (
    <button
      {...props}
      ref={ref}
      aria-expanded={context.open}
      aria-haspopup="listbox"
      aria-invalid={context.invalid ? true : ariaInvalid}
      aria-required={context.required || undefined}
      disabled={isDisabled}
      role="combobox"
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.requestOpen(!context.open)
      }}
    >
      {children}
    </button>
  )
})

export type SelectValueProps = ComponentPropsWithoutRef<"span"> & {
  placeholder?: ReactNode
}

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(function SelectValue(
  { placeholder, ...props },
  ref
) {
  const { selectedText } = useSelectContext()

  return <span {...props} ref={ref}>{selectedText ?? placeholder}</span>
})

export type SelectContentProps = ComponentPropsWithoutRef<"div">

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(
  props,
  ref
) {
  const { open } = useSelectContext()

  return <div {...props} ref={ref} hidden={!open} role="listbox" />
})

export type SelectGroupProps = ComponentPropsWithoutRef<"div">

export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(props, ref) {
  return <div {...props} ref={ref} role="group" />
})

export type SelectLabelProps = ComponentPropsWithoutRef<"div">

export const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(function SelectLabel(props, ref) {
  return <div {...props} ref={ref} />
})

export type SelectItemProps = Omit<ComponentPropsWithoutRef<"div">, "value"> & {
  value: string
  disabled?: boolean
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { children, disabled = false, id: suppliedId, onClick, value, ...props },
  ref
) {
  const context = useSelectContext()
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  const itemRef = useRef<HTMLDivElement>(null)
  const isDisabled = context.disabled || disabled
  const selected = context.selectedValue === value

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
      id={id}
      role="option"
      tabIndex={-1}
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
