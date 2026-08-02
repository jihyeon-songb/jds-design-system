import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react"

type TabsContextValue = {
  idPrefix: string
  requestValue: (value: string) => void
  value: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs compound components must be used within Tabs")
  return context
}

function getTabId(prefix: string, value: string): string {
  return `${prefix}-tab-${encodeURIComponent(value)}`
}

function getPanelId(prefix: string, value: string): string {
  return `${prefix}-panel-${encodeURIComponent(value)}`
}

type TabsValueProps =
  | { value: string; defaultValue?: never }
  | { defaultValue: string; value?: never }

export type TabsProps = ComponentPropsWithoutRef<"div"> & TabsValueProps & {
  children: ReactNode
  onValueChange?: (value: string) => void
}

export type TabsListProps = ComponentPropsWithoutRef<"div">

export type TabsTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-selected" | "id" | "role" | "tabIndex" | "type"
> & { value: string }

export type TabsContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-labelledby" | "hidden" | "id" | "role"
> & { value: string }

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { children, className, defaultValue, onValueChange, value, ...props },
  forwardedRef
) {
  const idPrefix = useId()
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const selectedValue = value ?? uncontrolledValue!

  function requestValue(nextValue: string): void {
    if (nextValue === selectedValue) return
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <TabsContext.Provider value={{ idPrefix, requestValue, value: selectedValue }}>
      <div
        {...props}
        ref={forwardedRef}
        className={["jds-tabs", className].filter(Boolean).join(" ")}
        data-state="enabled"
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
})

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, ...props },
  forwardedRef
) {
  useTabsContext()
  return (
    <div
      {...props}
      ref={forwardedRef}
      role="tablist"
      aria-orientation="horizontal"
      className={["jds-tabs-list", className].filter(Boolean).join(" ")}
    />
  )
})

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { children, className, disabled = false, onClick, onKeyDown, value, ...props },
  forwardedRef
) {
  const context = useTabsContext()
  const selected = context.value === value
  const state = disabled ? "disabled" : selected ? "active" : "inactive"

  function move(event: KeyboardEvent<HTMLButtonElement>): void {
    const list = event.currentTarget.closest<HTMLElement>('[role="tablist"]')
    const tabs = list
      ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
      : []
    const currentIndex = tabs.indexOf(event.currentTarget)
    let nextIndex: number | undefined

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (event.key === "Home") nextIndex = 0
    else if (event.key === "End") nextIndex = tabs.length - 1
    else return

    const next = tabs[nextIndex]
    if (!next) return
    event.preventDefault()
    next.focus()
    context.requestValue(next.dataset.value ?? "")
  }

  return (
    <button
      {...props}
      ref={forwardedRef}
      type="button"
      role="tab"
      id={getTabId(context.idPrefix, value)}
      aria-controls={getPanelId(context.idPrefix, value)}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      className={["jds-tabs-trigger", className].filter(Boolean).join(" ")}
      data-state={state}
      data-value={value}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.requestValue(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) move(event)
      }}
    >
      {children}
    </button>
  )
})

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { children, className, value, ...props },
  forwardedRef
) {
  const context = useTabsContext()
  const selected = context.value === value
  return (
    <div
      {...props}
      ref={forwardedRef}
      id={getPanelId(context.idPrefix, value)}
      role="tabpanel"
      aria-labelledby={getTabId(context.idPrefix, value)}
      tabIndex={0}
      hidden={!selected}
      className={["jds-tabs-content", className].filter(Boolean).join(" ")}
      data-state={selected ? "active" : "inactive"}
    >
      {children}
    </div>
  )
})
