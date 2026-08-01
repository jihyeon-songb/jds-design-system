import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

type RadioGroupContextValue = {
  disabled: boolean
  invalid: boolean
  name: string | undefined
  required: boolean
  selectedValue: string | undefined
  requestValue: (value: string, defaultPrevented: boolean) => void
  resetUncontrolled: () => void
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext(): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")
  return context
}

export type RadioGroupProps = Omit<ComponentPropsWithoutRef<"div">, "onChange"> & {
  children: ReactNode
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  name?: string
  onValueChange?: (value: string) => void
  orientation?: "vertical" | "horizontal"
  required?: boolean
  value?: string
}

export type RadioGroupItemProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "checked" | "defaultChecked" | "name" | "required" | "type" | "value"
> & { value: string }

export function RadioGroup({
  "aria-invalid": ariaInvalid,
  children,
  defaultValue,
  disabled = false,
  invalid = false,
  name,
  onValueChange,
  orientation = "vertical",
  required = false,
  value,
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const defaultValueRef = useRef(defaultValue)
  const controlledRef = useRef(value !== undefined)
  defaultValueRef.current = defaultValue
  controlledRef.current = value !== undefined

  const selectedValue = value ?? uncontrolledValue
  const requestValue = useCallback(
    (nextValue: string, defaultPrevented: boolean): void => {
      if (defaultPrevented) return
      if (value === undefined) setUncontrolledValue(nextValue)
      onValueChange?.(nextValue)
    },
    [onValueChange, value]
  )
  const resetUncontrolled = useCallback((): void => {
    if (!controlledRef.current) setUncontrolledValue(defaultValueRef.current)
  }, [])

  return (
    <RadioGroupContext.Provider
      value={{
        disabled,
        invalid,
        name,
        required,
        requestValue,
        resetUncontrolled,
        selectedValue,
      }}
    >
      <div
        {...props}
        role="radiogroup"
        aria-invalid={invalid ? true : ariaInvalid}
        data-orientation={orientation}
        data-state={disabled ? "disabled" : invalid ? "invalid" : "enabled"}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { className, disabled = false, onChange, value, ...props },
  forwardedRef
) {
  const context = useRadioGroupContext()
  const formRef = useRef<HTMLFormElement | null>(null)
  const checked = context.selectedValue === value
  const itemDisabled = context.disabled || disabled
  const state = itemDisabled ? "disabled" : context.invalid ? "invalid" : checked ? "checked" : "unchecked"
  const onFormReset = useCallback((): void => context.resetUncontrolled(), [context.resetUncontrolled])

  const setRef = useCallback(
    (node: HTMLInputElement | null): void => {
      formRef.current?.removeEventListener("reset", onFormReset)

      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node

      formRef.current = node?.form ?? null
      formRef.current?.addEventListener("reset", onFormReset)
    },
    [forwardedRef, onFormReset]
  )

  return (
    <input
      {...props}
      ref={setRef}
      type="radio"
      name={context.name}
      required={context.required}
      value={value}
      checked={checked}
      disabled={itemDisabled}
      className={["jds-radio-group-item", className].filter(Boolean).join(" ")}
      data-state={state}
      onChange={(event) => {
        onChange?.(event)
        context.requestValue(value, event.defaultPrevented)
      }}
    />
  )
})
