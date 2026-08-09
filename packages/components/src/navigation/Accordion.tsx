import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

export type AccordionType = "single" | "multiple"

type AccordionSingleProps =
  | { type: "single"; defaultValue?: string; value?: never; onValueChange?: (value: string | null) => void }
  | { type: "single"; defaultValue?: never; value: string | null; onValueChange?: (value: string | null) => void }

type AccordionMultipleProps =
  | { type: "multiple"; defaultValue?: string[]; value?: never; onValueChange?: (value: string[]) => void }
  | { type: "multiple"; defaultValue?: never; value: string[]; onValueChange?: (value: string[]) => void }

export type AccordionProps = ComponentPropsWithoutRef<"div"> &
  (AccordionSingleProps | AccordionMultipleProps) & {
    children: ReactNode
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  }

export type AccordionItemProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
  disabled?: boolean
  value: string
}

export type AccordionHeaderProps = ComponentPropsWithoutRef<"h3">

export type AccordionTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-controls" | "aria-expanded" | "disabled" | "id" | "type"
>

export type AccordionContentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-labelledby" | "hidden" | "id"
>

type AccordionContextValue = {
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6
  idPrefix: string
  isOpen: (value: string) => boolean
  requestValue: (value: string) => void
}

type AccordionItemContextValue = {
  contentId: string
  disabled: boolean
  open: boolean
  triggerId: string
  value: string
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)
const AccordionHeaderContext = createContext(false)

function useAccordionContext(): AccordionContextValue {
  const context = useContext(AccordionContext)
  if (!context) throw new Error("Accordion compound components must be used within Accordion")
  return context
}

function useAccordionItemContext(): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) throw new Error("Accordion item components must be used within AccordionItem")
  return context
}

function useAccordionHeaderContext(): void {
  if (!useContext(AccordionHeaderContext)) {
    throw new Error("Accordion triggers must be used within AccordionHeader")
  }
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { children, className, defaultValue, headingLevel = 3, onValueChange, type, value, ...props },
  ref
) {
  const idPrefix = useId()
  const [uncontrolledSingleValue, setUncontrolledSingleValue] = useState<string | null>(
    type === "single" ? defaultValue ?? null : null
  )
  const [uncontrolledMultipleValue, setUncontrolledMultipleValue] = useState<string[]>(
    type === "multiple" ? defaultValue ?? [] : []
  )
  const singleControlled = type === "single" && (value === null || typeof value === "string")
  const multipleControlled = type === "multiple" && Array.isArray(value)
  const singleValue = singleControlled ? value : uncontrolledSingleValue
  const multipleValue = multipleControlled ? value : uncontrolledMultipleValue

  function isOpen(itemValue: string): boolean {
    return type === "single" ? singleValue === itemValue : multipleValue.includes(itemValue)
  }

  function requestValue(itemValue: string): void {
    if (type === "single") {
      const nextValue = singleValue === itemValue ? null : itemValue
      if (nextValue === singleValue) return
      if (!singleControlled) setUncontrolledSingleValue(nextValue)
      if (type === "single") onValueChange?.(nextValue)
      return
    }

    const nextValue = multipleValue.includes(itemValue)
      ? multipleValue.filter((currentValue) => currentValue !== itemValue)
      : [...multipleValue, itemValue]
    if (!multipleControlled) setUncontrolledMultipleValue(nextValue)
    if (type === "multiple") onValueChange?.(nextValue)
  }

  return (
    <AccordionContext.Provider value={{ headingLevel, idPrefix, isOpen, requestValue }}>
      <div
        {...props}
        ref={ref}
        className={["jdsb-accordion", className].filter(Boolean).join(" ")}
        data-type={type}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
})

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { children, className, disabled = false, value, ...props },
  ref
) {
  const context = useAccordionContext()
  const open = context.isOpen(value)
  const itemId = useId()
  const itemContext = {
    contentId: `${context.idPrefix}-content-${itemId}`,
    disabled,
    open,
    triggerId: `${context.idPrefix}-trigger-${itemId}`,
    value,
  }

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div
        {...props}
        ref={ref}
        className={["jdsb-accordion-item", className].filter(Boolean).join(" ")}
        data-state={disabled ? "disabled" : open ? "open" : "closed"}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
})

export const AccordionHeader = forwardRef<HTMLHeadingElement, AccordionHeaderProps>(function AccordionHeader(
  { children, className, ...props },
  ref
) {
  const { headingLevel } = useAccordionContext()
  useAccordionItemContext()
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

  return (
    <Heading {...props} ref={ref} className={["jdsb-accordion-header", className].filter(Boolean).join(" ")}>
      <AccordionHeaderContext.Provider value>{children}</AccordionHeaderContext.Provider>
    </Heading>
  )
})

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(function AccordionTrigger(
  { className, onClick, ...props },
  ref
) {
  const context = useAccordionContext()
  const item = useAccordionItemContext()
  useAccordionHeaderContext()
  const state = item.disabled ? "disabled" : item.open ? "open" : "closed"

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      id={item.triggerId}
      aria-controls={item.contentId}
      aria-expanded={item.open}
      disabled={item.disabled}
      className={["jdsb-accordion-trigger", className].filter(Boolean).join(" ")}
      data-state={state}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.requestValue(item.value)
      }}
    />
  )
})

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(function AccordionContent(
  { className, ...props },
  ref
) {
  useAccordionContext()
  const item = useAccordionItemContext()

  return (
    <div
      {...props}
      ref={ref}
      id={item.contentId}
      aria-labelledby={item.triggerId}
      hidden={!item.open}
      className={["jdsb-accordion-content", className].filter(Boolean).join(" ")}
      data-state={item.open ? "open" : "closed"}
    />
  )
})
