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

// 컴포넌트는 반드시 RadioGroup 안에서 써야 한다"는 계약을 명시적으로 강제
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

// value 빼고 나머지 다섯 개는 "개별 item이 아니라 그룹 전체가 결정해야 하는 값"
export type RadioGroupItemProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "checked" | "defaultChecked" | "name" | "required" | "type" | "value"
> & { value: string }

export function RadioGroup({
  "aria-invalid": ariaInvalid, // 유효성 여부 확인 웹접근성 속성
  children,
  className,
  defaultValue, // 비제어 모드에서 초기 선택값
  disabled = false,
  invalid = false,
  name,
  onValueChange,
  orientation = "vertical", // 스타일링이나 aria-orientation 접근성 속성에 반영
  required = false, // aria-required 이나 폼 검증에 연결
  value, // 제어 모드에서 현재 선택된 값
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const defaultValueRef = useRef(defaultValue)
  const controlledRef = useRef(value !== undefined)
  // 매 렌더링마다 직접 .current에 최신 값을 대입해서 ref를 항상 "지금 시점의 최신값"으로 유지
  // 리렌더는 유발하지 않으면서, 콜백/effect 안에서 "항상 최신 값"에 접근할 수 있게 하기 위함 (stale closure 방지)
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

  // 비제어 모드일 떄 내부 상태를 원래의 default value로 되돌린다.
  const resetUncontrolled = useCallback((): void => {
    if (!controlledRef.current) setUncontrolledValue(defaultValueRef.current)
  }, [])

  // 모든 RadioGroupItem은 useRadioGroupContext()로 이 값들을 꺼내 쓸 수 있음
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
        className={["jdsb-radio-group", className].filter(Boolean).join(" ")}
        data-orientation={orientation}
        data-state={disabled ? "disabled" : invalid ? "invalid" : "enabled"}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

// forwardedRef는 "부모가 이 컴포넌트의 내부 DOM 노드에 접근하고 싶어서 넘긴 ref"를 가리키는 이름
export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { className, disabled = false, onChange, value, ...props },
  forwardedRef
) {
  // 부모 RadioGroup이 Provider로 내려준 값(disabled, invalid, name, required, requestValue, resetUncontrolled, selectedValue)을 통째로 받아옴
  const context = useRadioGroupContext()
  const formRef = useRef<HTMLFormElement | null>(null)
  const checked = context.selectedValue === value
  const itemDisabled = context.disabled || disabled
  const state = itemDisabled ? "disabled" : context.invalid ? "invalid" : checked ? "checked" : "unchecked"
  const onFormReset = useCallback((): void => context.resetUncontrolled(), [context.resetUncontrolled])

  // 부모가 넘긴 ref를 이 input에 연결해줌
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
      className={["jdsb-radio-group-item", className].filter(Boolean).join(" ")}
      data-state={state}
      onChange={(event) => {
        onChange?.(event)
        context.requestValue(value, event.defaultPrevented)
      }}
    />
  )
})
