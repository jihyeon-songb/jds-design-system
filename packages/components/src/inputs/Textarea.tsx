import { forwardRef, useId, useState, type ComponentPropsWithoutRef, type ChangeEvent } from "react"

export type TextareaSize = "sm" | "md" | "lg"

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  size?: TextareaSize
  invalid?: boolean
}

const textLength = (value: TextareaProps["value"] | TextareaProps["defaultValue"]): number =>
  String(value ?? "").length

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    "aria-describedby": ariaDescribedBy,
    className,
    defaultValue,
    disabled,
    invalid = false,
    maxLength,
    onChange,
    readOnly,
    size = "md",
    value,
    ...props
  },
  ref
) {
  const counterId = useId()
  const [uncontrolledLength, setUncontrolledLength] = useState(() => textLength(defaultValue))
  const hasCounter = maxLength !== undefined
  const length = value !== undefined ? textLength(value) : uncontrolledLength
  const state = disabled ? "disabled" : readOnly ? "readonly" : invalid ? "invalid" : "idle"
  const describedBy = hasCounter ? [ariaDescribedBy, counterId].filter(Boolean).join(" ") : ariaDescribedBy

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    if (value === undefined) {
      setUncontrolledLength(event.target.value.length)
    }
    onChange?.(event)
  }

  return (
    <div className="jdsb-textarea" data-size={size} data-state={state}>
      <textarea
        {...props}
        ref={ref}
        className={className}
        defaultValue={defaultValue}
        disabled={disabled}
        value={value}
        readOnly={readOnly}
        maxLength={maxLength}
        // 엘리먼트에 대한 추가 설명/도움말
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        data-slot="control"
        data-state={state}
        onChange={handleChange}
      />
      {hasCounter ? (
        <output id={counterId} data-slot="counter" aria-live="polite">{`${length} / ${maxLength}`}</output>
      ) : null}
    </div>
  )
})
