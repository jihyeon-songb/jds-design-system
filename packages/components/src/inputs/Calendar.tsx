import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react"

export type CalendarProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue" | "month" | "value"> & {
  "aria-label": string
  defaultMonth?: string
  defaultValue?: string
  locale?: string
  max?: string
  min?: string
  month?: string
  onMonthChange?: (month: string) => void
  onValueChange?: (value: string) => void
  value?: string
}

function createDate(year: number, month: number, day: number): Date {
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month, day)
  return date
}

const MIN_SUPPORTED_DATE = createDate(0, 0, 1)
const MAX_SUPPORTED_DATE = createDate(9999, 11, 31)

function formatDate(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part).padStart(4, "0") : String(part).padStart(2, "0"))
    .join("-")
}

function parseDate(value: string, name: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new RangeError(`${name} must be a YYYY-MM-DD date`)
  const date = createDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (formatDate(date) !== value) throw new RangeError(`${name} must be a valid date`)
  return date
}

function formatMonth(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
}

function parseMonth(value: string, name: string): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) throw new RangeError(`${name} must be a YYYY-MM month`)
  const date = createDate(Number(match[1]), Number(match[2]) - 1, 1)
  if (formatMonth(date) !== value) throw new RangeError(`${name} must be a valid month`)
  return date
}

function addDays(date: Date, amount: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function addMonths(date: Date, amount: number): Date {
  const targetMonth = createDate(date.getFullYear(), date.getMonth() + amount, 1)
  return createDate(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(date.getDate(), getDaysInMonth(targetMonth))
  )
}

function getDaysInMonth(date: Date): number {
  return createDate(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (date < (min ?? MIN_SUPPORTED_DATE)) return min ?? MIN_SUPPORTED_DATE
  if (date > (max ?? MAX_SUPPORTED_DATE)) return max ?? MAX_SUPPORTED_DATE
  return date
}

function isSelectable(date: Date, min?: Date, max?: Date): boolean {
  return date >= MIN_SUPPORTED_DATE && date <= MAX_SUPPORTED_DATE && (!min || date >= min) && (!max || date <= max)
}

function getMonthDays(month: Date): Date[] {
  return Array.from(
    { length: getDaysInMonth(month) },
    (_, index) => createDate(month.getFullYear(), month.getMonth(), index + 1)
  )
}

function getMonthControlLabel(locale: string | undefined, direction: "previous" | "next"): string {
  if (locale?.startsWith("ko")) return direction === "previous" ? "이전 달" : "다음 달"
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    direction === "previous" ? -1 : 1,
    "month"
  )
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    "aria-label": ariaLabel,
    className,
    defaultMonth,
    defaultValue,
    locale,
    max,
    min,
    month,
    onMonthChange,
    onValueChange,
    value,
    ...props
  },
  forwardedRef
) {
  const minDate = min === undefined ? undefined : parseDate(min, "min")
  const maxDate = max === undefined ? undefined : parseDate(max, "max")
  if (minDate && maxDate && minDate > maxDate) throw new RangeError("min must not be after max")
  const defaultDate = defaultValue === undefined ? undefined : parseDate(defaultValue, "defaultValue")
  const valueDate = value === undefined ? undefined : parseDate(value, "value")
  if (defaultDate && !isSelectable(defaultDate, minDate, maxDate)) {
    throw new RangeError("defaultValue must be within min and max")
  }
  if (valueDate && !isSelectable(valueDate, minDate, maxDate)) {
    throw new RangeError("value must be within min and max")
  }
  if (defaultMonth !== undefined) parseMonth(defaultMonth, "defaultMonth")
  if (month !== undefined) parseMonth(month, "month")

  const initialMonth = (value ?? defaultMonth ?? defaultValue)?.slice(0, 7) ?? formatMonth(new Date())
  const [uncontrolledMonth, setUncontrolledMonth] = useState(initialMonth)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [focusValue, setFocusValue] = useState<string>()
  const dayRefs = useRef(new Map<string, HTMLButtonElement>())
  const selectedValue = value ?? uncontrolledValue
  const visibleMonth = month ?? uncontrolledMonth
  const visibleMonthDate = parseMonth(visibleMonth, "month")
  const days = getMonthDays(visibleMonthDate)
  const selectedDate = selectedValue === undefined ? undefined : parseDate(selectedValue, "value")
  if (selectedDate && !isSelectable(selectedDate, minDate, maxDate)) {
    throw new RangeError("value must be within min and max")
  }
  const firstSelectableDate = days.find((date) => isSelectable(date, minDate, maxDate))
  const activeValue = focusValue && formatMonth(parseDate(focusValue, "focusValue")) === visibleMonth && isSelectable(parseDate(focusValue, "focusValue"), minDate, maxDate)
    ? focusValue
    : selectedDate && formatMonth(selectedDate) === visibleMonth && isSelectable(selectedDate, minDate, maxDate)
      ? selectedValue
      : firstSelectableDate && formatDate(firstSelectableDate)

  useEffect(() => {
    if (focusValue && activeValue) dayRefs.current.get(activeValue)?.focus()
  }, [activeValue, focusValue])

  function requestValue(nextValue: string): void {
    setFocusValue(undefined)
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  function requestMonth(nextMonth: string, restoreFocus = false): void {
    if (!restoreFocus) setFocusValue(undefined)
    if (month === undefined) setUncontrolledMonth(nextMonth)
    onMonthChange?.(nextMonth)
  }

  function moveFocus(nextDate: Date): void {
    const clampedDate = clampDate(nextDate, minDate, maxDate)
    const nextValue = formatDate(clampedDate)
    setFocusValue(nextValue)
    const nextMonth = formatMonth(clampedDate)
    if (nextMonth !== visibleMonth) requestMonth(nextMonth, true)
  }

  function onDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date): void {
    let target: Date | undefined
    if (event.key === "ArrowLeft") target = addDays(date, -1)
    if (event.key === "ArrowRight") target = addDays(date, 1)
    if (event.key === "Home") target = addDays(date, -date.getDay())
    if (event.key === "End") target = addDays(date, 6 - date.getDay())
    if (event.key === "PageUp") target = addMonths(date, event.shiftKey ? -12 : -1)
    if (event.key === "PageDown") target = addMonths(date, event.shiftKey ? 12 : 1)
    if (!target) return
    event.preventDefault()
    moveFocus(target)
  }

  function monthHasSelectableDays(candidate: Date): boolean {
    return getMonthDays(candidate).some((date) => isSelectable(date, minDate, maxDate))
  }

  const previousMonth = addMonths(visibleMonthDate, -1)
  const nextMonth = addMonths(visibleMonthDate, 1)
  const dateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" })

  return (
    <div {...props} ref={forwardedRef} className={["jdsb-calendar", className].filter(Boolean).join(" ")}>
      <div className="jdsb-calendar-header">
        <button type="button" className="jdsb-calendar-control" aria-label={getMonthControlLabel(locale, "previous")} disabled={!monthHasSelectableDays(previousMonth)} onClick={() => requestMonth(formatMonth(previousMonth))}>
          {getMonthControlLabel(locale, "previous")}
        </button>
        <span className="jdsb-calendar-month">{new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(visibleMonthDate)}</span>
        <button type="button" className="jdsb-calendar-control" aria-label={getMonthControlLabel(locale, "next")} disabled={!monthHasSelectableDays(nextMonth)} onClick={() => requestMonth(formatMonth(nextMonth))}>
          {getMonthControlLabel(locale, "next")}
        </button>
      </div>
      <div role="grid" aria-label={ariaLabel} className="jdsb-calendar-grid">
        <div role="row" className="jdsb-calendar-weekdays">
          {Array.from({ length: 7 }, (_, day) => (
            <span key={day} role="columnheader">{weekdayFormatter.format(new Date(2023, 0, day + 1))}</span>
          ))}
        </div>
        {Array.from({ length: Math.ceil((visibleMonthDate.getDay() + days.length) / 7) }, (_, week) => (
          <div key={week} role="row" className="jdsb-calendar-week">
            {Array.from({ length: 7 }, (_, weekday) => {
              const dayIndex = week * 7 + weekday - visibleMonthDate.getDay()
              if (dayIndex < 0 || dayIndex >= days.length) return <span key={weekday} role="gridcell" aria-hidden="true" />
              const date = days[dayIndex]
              const dateValue = formatDate(date)
              const selected = selectedValue === dateValue
              const selectable = isSelectable(date, minDate, maxDate)
              return (
                <div key={dateValue} role="gridcell" aria-label={dateFormatter.format(date)} aria-selected={selected || undefined}>
                  <button
                    ref={(node) => { if (node) dayRefs.current.set(dateValue, node); else dayRefs.current.delete(dateValue) }}
                    type="button"
                    aria-label={dateFormatter.format(date)}
                    className="jdsb-calendar-day"
                    data-state={selected ? "selected" : "idle"}
                    disabled={!selectable}
                    tabIndex={dateValue === activeValue ? 0 : -1}
                    onClick={() => requestValue(dateValue)}
                    onKeyDown={(event) => onDayKeyDown(event, date)}
                  >
                    {date.getDate()}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})
