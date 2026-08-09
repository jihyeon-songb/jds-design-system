import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react"

type SelectItemRecord = {
  value: string
  text: string
  disabled: boolean
  id: string
  // useRef()로 직접 만든 변수: RefObject<T | null>
  ref: RefObject<HTMLDivElement | null>
}

type SelectContextValue = {
  activeItemId: string | undefined
  contentId: string | undefined
  contentRef: RefObject<HTMLDivElement | null>
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
  triggerRef: RefObject<HTMLButtonElement | null>
}

const SelectContext = createContext<SelectContextValue | null>(null)
const SelectGroupContext = createContext<{
  labelId: string | undefined
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

type SelectChildProps = {
  children?: ReactNode
  id?: string
  value?: string
}

function getTextContent(children: ReactNode): string {
  /*
  Children.toArray
  - children에 뭐가 들어오든 상관없이 안전하게 순회 가능한 배열을 보장함
  - null, undefined, boolean 값 제거
  - 각 엘리먼트에 안정적인 key 자동 부여
   */
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child)
    return isValidElement<SelectChildProps>(child) ? getTextContent(child.props.children) : ""
  }).join("")
}

function findChild(
  children: ReactNode,
  matches: (child: ReactElement<SelectChildProps>) => boolean
): ReactElement<SelectChildProps> | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<SelectChildProps>(child)) continue
    if (matches(child)) return child
    const nested = findChild(child.props.children, matches)
    if (nested) return nested
  }
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
  // SelectContent에 id를 안 줬을 때 쓸 fallback ID
  const generatedContentId = useId()
  const [items, setItems] = useState<SelectItemRecord[]>([])
  const [activeItemId, setActiveItemId] = useState<string>()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)

  // 	바깥 클릭 감지, imperative focus 등에 쓰이는 실제 DOM 참조
  const contentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // 문자 키 연타 검색용 버퍼
  const typeaheadRef = useRef({ prefix: "", time: 0 })
  const onOpenChangeRef = useRef(onOpenChange)
  const selectedValue = value ?? uncontrolledValue
  const content = findChild(children, (child) => child.type === SelectContent)
  const selectedItem = findChild(
    children,
    (child) => child.type === SelectItem && child.props.value === selectedValue
  )

  // aria-controls(트리거)와 id(콘텐츠)를 일치시키기 위한 ID. 사용자가 명시적으로 id를 준 경우 존중하고, 아니면 생성된 id 사용
  const contentId = content ? content.props.id ?? generatedContentId : undefined
  const selectedText = items.find((item) => item.value === selectedValue)?.text
    ?? (selectedItem ? getTextContent(selectedItem.props.children) : undefined)
  const currentOpen = !disabled && (open ?? uncontrolledOpen)

  // 비활성 아이템 제거 후 실제 DOM 순서로 정렬
  const enabledItems = items.filter((item) => !item.disabled).sort((first, second) => {
    const firstNode = first.ref.current
    const secondNode = second.ref.current
    if (!firstNode || !secondNode) return 0
    const position = firstNode.compareDocumentPosition(secondNode)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })

  // SelectItem이 useEffect에서 이 함수를 호출해 자신을 등록하고, cleanup 시 반환된 함수로 스스로를 제거
  const registerItem = useCallback((item: SelectItemRecord) => {
    setItems((currentItems) => [...currentItems.filter((current) => current.id !== item.id), item])
    return () => setItems((currentItems) => currentItems.filter((current) => current.id !== item.id))
  }, [])

  // 컴포넌트가 다시 렌더링 될때 함수 참조를 비교해서 리렌더 없이 최신값 갱신
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  function requestOpen(nextOpen: boolean, activeId?: string): void {
    if (nextOpen && disabled) return
    if (nextOpen) {
      const selectedItem = enabledItems.find((item) => item.value === selectedValue)
      setActiveItemId(activeId ?? selectedItem?.id ?? enabledItems[0]?.id)
    } else {
      typeaheadRef.current = { prefix: "", time: 0 }
    }
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChangeRef.current?.(nextOpen)
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

  function typeahead(character: string): SelectItemRecord | undefined {
    const now = Date.now()
    const previousPrefix = now - typeaheadRef.current.time <= 500
      ? typeaheadRef.current.prefix
      : ""
    const prefix = `${previousPrefix}${character}`.toLocaleLowerCase()
    typeaheadRef.current = { prefix, time: now }
    return enabledItems.find((item) => {
      const text = item.text.toLocaleLowerCase()
      return text.startsWith(prefix) || getHangulInitials(text).startsWith(prefix)
    })
  }

  /*
   트리거 버튼에서 발생하는 모든 키보드 이벤트를 처리하는 중앙 라우터

   왜 preventDefault()가 필요한가
   브라우저 기본 동작도 같이 실행되면 페이지가 스크롤되거나 이중으로 이벤트가 발생하는 등 예기치 않은 동작이 생기므로, 우리가 처리한 키에 한해 명시적으로 막아주는 것
   */
  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return

    if (!currentOpen) {
      if (event.key === "ArrowUp") {
        event.preventDefault()
        const selectedItem = enabledItems.find((item) => item.value === selectedValue)
        requestOpen(true, selectedItem?.id ?? enabledItems[enabledItems.length - 1]?.id)
      } else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        requestOpen(true)
      } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const match = typeahead(event.key)
        if (match) {
          event.preventDefault()
          requestOpen(true, match.id)
        }
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
      const match = typeahead(event.key)
      if (match) setActiveItemId(match.id)
    } else {
      return
    }
    event.preventDefault()
  }

  // activeItemId(키보드 강조 항목)가 항상 "지금 존재하는 유효한 아이템"을 가리키도록 보정
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

  // 바깥클릭감지 effect
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

  // 키보드로 활성 아이템이 바뀔 때마다 그 아이템이 화면(스크롤 영역) 안에 보이도록 자동 스크롤
  useEffect(() => {
    if (!currentOpen || !activeItemId) return

    items.find((item) => item.id === activeItemId)?.ref.current?.scrollIntoView?.({
      block: "nearest",
    })
  }, [activeItemId, currentOpen, items])

  return (
    <SelectContext.Provider
      value={{
        activeItemId,
        contentId,
        contentRef,
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
        triggerRef,
      }}
    >
      <div
        className="jdsb-select"
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

  // 두 개의 ref를 하나로 통일
  // 부모의 ref와 context.triggerRef가 같은 DOM 노드를 가리킴
  useImperativeHandle(ref, () => context.triggerRef.current as HTMLButtonElement)

  return (
    <button
      {...props}
      ref={context.triggerRef}
      aria-activedescendant={context.open ? context.activeItemId : undefined}
      aria-controls={context.contentId}
      aria-expanded={context.open} // 팝업(부가 UI)을 연다는 것과, 그 팝업의 종류가 무엇인지
      aria-haspopup="listbox" // 지금 펼쳐져 있는지 접혀 있는지 실시간으로 알려주는 boolean 값
      aria-invalid={context.invalid ? true : ariaInvalid}
      aria-required={context.required || undefined}
      className={["jdsb-select-trigger", className].filter(Boolean).join(" ")}
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
        className="jdsb-select-chevron"
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
      className={["jdsb-select-value", className].filter(Boolean).join(" ")}
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
  const id = suppliedId ?? context.contentId

  useImperativeHandle(ref, () => context.contentRef.current as HTMLDivElement)

  return (
    <div
      {...props}
      ref={context.contentRef}
      className={["jdsb-select-content", className].filter(Boolean).join(" ")}
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
  const label = findChild(props.children, (child) => child.type === SelectLabel)
  const labelId = label ? label.props.id ?? defaultLabelId : undefined

  return (
    <SelectGroupContext.Provider value={{ labelId }}>
      <div
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? (ariaLabel ? undefined : labelId)}
        className={["jdsb-select-group", className].filter(Boolean).join(" ")}
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
  const id = suppliedId ?? group?.labelId ?? generatedId

  return (
    <div
      {...props}
      ref={ref}
      className={["jdsb-select-label", className].filter(Boolean).join(" ")}
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

  // 각 SelectItem이 마운트/업데이트될 때마다 자신의 메타데이터를 부모 Select의 items 배열에 등록하는 역할
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
      className={["jdsb-select-item", className].filter(Boolean).join(" ")}
      data-slot="item"
      data-state={state}
      id={id}
      role="option"
      /*
      포커스는 트리거에 고정, 옵션 이동은 방향키 + aria-activedescendant로 시각/접근성 표현만
       */
      tabIndex={-1}
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
