import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react"

export type SwitchSize = "sm" | "md" | "lg" | "xl"

export type SwitchProps = Omit<ComponentPropsWithoutRef<"input">, "size" | "type"> & {
  invalid?: boolean
  size?: SwitchSize
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    "aria-invalid": ariaInvalid,
    checked,
    className,
    defaultChecked,
    disabled,
    invalid = false,
    onChange,
    size = "md",
    ...props
  },
  ref
) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked))
  const resetCleanupRef = useRef<(() => void) | undefined>(undefined)
  const isControlled = checked !== undefined
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    resetCleanupRef.current?.()
    resetCleanupRef.current = undefined

    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node

    const form = node?.form
    if (!node || !form || isControlled) return

    const handleReset = () => {
      queueMicrotask(() => setUncontrolledChecked(node.checked))
    }

    form.addEventListener("reset", handleReset)
    resetCleanupRef.current = () => form.removeEventListener("reset", handleReset)
  }, [isControlled, ref])
  const isChecked = checked ?? uncontrolledChecked
  const state = disabled
    ? "disabled"
    : invalid
      ? "invalid"
      : isChecked
        ? "checked"
        : "unchecked"

  return (
    <input
      {...props}
      ref={inputRef}
      aria-invalid={invalid ? true : ariaInvalid}
      checked={checked}
      className={["jds-switch", className].filter(Boolean).join(" ")}
      data-size={size}
      data-state={state}
      defaultChecked={defaultChecked}
      disabled={disabled}
      role="switch"
      type="checkbox"
      onChange={(event) => {
        onChange?.(event)
        if (!isControlled && !event.defaultPrevented) {
          setUncontrolledChecked(event.target.checked)
        }
      }}
    />
  )
})
