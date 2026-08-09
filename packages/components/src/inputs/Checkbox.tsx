import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react"

export type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  invalid?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    "aria-invalid": ariaInvalid,
    checked,
    className,
    defaultChecked,
    disabled,
    invalid = false,
    onChange,
    ...props
  },
  ref
) {
  // checked prop을 부모가 넘겨주지 않을 때(비제어 모드) 컴포넌트 스스로 관리할 내부 상태
  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked))
  // resetCleanup 해야하는 콜백함수를 저장하기 위한 공간
  const resetCleanupRef = useRef<(() => void) | undefined>(undefined)
  // true면 부모가 상태를 완전히 소유하는 controlled 컴포넌트로 동작하고, false면 위의 uncontrolledChecked 내부 상태를 사용하는 uncontrolled 컴포넌트로 동작
  const isControlled = checked !== undefined
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    // 콜백이 실행될 때 가장 먼저, 이전에 등록해뒀던 reset 리스너 정리 함수가 있으면 실행해서 없앤다.
    resetCleanupRef.current?.()
    resetCleanupRef.current = undefined

    // forwardRef로 외부에서도 ref를 받는 구조라서, 외부 ref가 함수 형태면 호출해주고, 객체 형태(useRef로 만든 것)면 .current에 노드를 직접 대입
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node

    /*
    노드가 없으면(언마운트되는 경우) 더 할 일이 없음
    node.form으로 이 input이 속한 <form> 요소를 가져온다(없으면 form 밖에 있는 거니 역시 중단)
    isControlled면 애초에 이 컴포넌트가 체크 상태를 스스로 안 다루니 리스너를 붙일 필요가 없어 종료
     */
    const form = node?.form
    if (!node || !form || isControlled) return

    /*
    form에 reset 이벤트(예: <button type="reset"> 클릭)가 발생하면 실행될 핸들러를 만들어 등록
    reset 이벤트가 발생하는 순간 브라우저는 아직 node.checked를 최종값으로 다 되돌리지 않았을 수 있어서,
    queueMicrotask로 DOM이 실제로 리셋을 마친 뒤의 node.checked 값을 읽음
     */
    const handleReset = () => {
      // setUncontrolledChecked에 넣어서 React state를 DOM과 다시 동기화
      queueMicrotask(() => setUncontrolledChecked(node.checked))
    }

    form.addEventListener("reset", handleReset)
    // 방금 등록한 리스너를 나중에 제거할 수 있는 함수를 resetCleanupRef에 저장
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
      className={["jdsb-checkbox", className].filter(Boolean).join(" ")}
      data-state={state}
      defaultChecked={defaultChecked}
      disabled={disabled}
      type="checkbox"
      // onChange는 비제어 모드 이고, 앞서 실행한 부모의 onChange에서 event.preventDefault()를 호출했으면 실행
      onChange={(event) => {
        onChange?.(event)
        if (!isControlled && !event.defaultPrevented) {
          setUncontrolledChecked(event.target.checked)
        }
      }}
    />
  )
})
