import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Dispatch,
  type ForwardedRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react"

type DialogUncontrolledProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: never
}

type DialogControlledProps = {
  defaultOpen?: never
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export type DialogProps = (DialogUncontrolledProps | DialogControlledProps) & {
  children: ReactNode
}

export type DialogTriggerProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-expanded" | "aria-haspopup" | "type"
>

export type DialogContentProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "aria-describedby" | "aria-labelledby" | "onCancel" | "open" | "role"
> & {
  onEscapeKeyDown?: (event: Event) => void
  onInteractOutside?: (event: ReactMouseEvent<HTMLDialogElement>) => void
}

export type DialogTitleProps = ComponentPropsWithoutRef<"h2">
export type DialogDescriptionProps = ComponentPropsWithoutRef<"p">
export type DialogCloseProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  "aria-label": string
}

type DialogContextValue = {
  contentRef: RefObject<HTMLDialogElement | null>
  descriptionId: string | undefined
  open: boolean
  requestOpen: (open: boolean) => void
  setDescriptionId: Dispatch<SetStateAction<string | undefined>>
  setTitleId: Dispatch<SetStateAction<string | undefined>>
  titleId: string | undefined
  triggerRef: RefObject<HTMLButtonElement | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(): DialogContextValue {
  const context = useContext(DialogContext)
  if (!context) throw new Error("Dialog compound components must be used within Dialog")
  return context
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function focusDialogContent(dialog: HTMLDialogElement): void {
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
    'a[href], area[href], button, input, select, textarea, [contenteditable], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.matches(":disabled"))
  const target = focusable.find((element) => element.hasAttribute("autofocus")) ?? focusable[0] ?? dialog
  target.focus()
}

export function Dialog({ children, defaultOpen = false, onOpenChange, open }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [titleId, setTitleId] = useState<string>()
  const [descriptionId, setDescriptionId] = useState<string>()
  const contentRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isOpen = open ?? uncontrolledOpen

  function requestOpen(nextOpen: boolean): void {
    if (open === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <DialogContext.Provider value={{
      contentRef,
      descriptionId,
      open: isOpen,
      requestOpen,
      setDescriptionId,
      setTitleId,
      titleId,
      triggerRef,
    }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { onClick, ...props },
  ref
) {
  const { open, requestOpen, triggerRef } = useDialogContext()

  return (
    <button
      {...props}
      ref={(element) => {
        triggerRef.current = element
        assignRef(ref, element)
      }}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) requestOpen(true)
      }}
    />
  )
})

export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(function DialogContent(
  { className, onClick, onEscapeKeyDown, onInteractOutside, tabIndex, ...props },
  ref
) {
  const { contentRef, descriptionId, open, requestOpen, titleId, triggerRef } = useDialogContext()

  useEffect(() => {
    const dialog = contentRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      focusDialogContent(dialog)
    }
    if (!open && dialog.open) {
      dialog.close()
      if (triggerRef.current?.isConnected && !triggerRef.current.disabled) triggerRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const dialog = contentRef.current
    if (!dialog) return

    function onCancel(event: Event): void {
      event.preventDefault()
      let escapePrevented = false
      const preventDefault = event.preventDefault.bind(event)
      Object.defineProperty(event, "preventDefault", {
        configurable: true,
        value: () => {
          escapePrevented = true
          preventDefault()
        },
      })
      onEscapeKeyDown?.(event)
      if (!escapePrevented) requestOpen(false)
    }

    dialog.addEventListener("cancel", onCancel)
    return () => dialog.removeEventListener("cancel", onCancel)
  }, [onEscapeKeyDown, requestOpen])

  return (
    <dialog
      {...props}
      ref={(element) => {
        contentRef.current = element
        assignRef(ref, element)
      }}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={["jds-dialog-content", className].filter(Boolean).join(" ")}
      data-state={open ? "open" : "closed"}
      tabIndex={tabIndex ?? -1}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.target !== event.currentTarget) return
        onInteractOutside?.(event)
        if (!event.defaultPrevented) requestOpen(false)
      }}
    />
  )
})

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, ...props },
  ref
) {
  const id = useId()
  const { setTitleId } = useDialogContext()

  useEffect(() => {
    setTitleId(id)
    return () => setTitleId((currentId) => currentId === id ? undefined : currentId)
  }, [id, setTitleId])

  return <h2 {...props} ref={ref} className={["jds-dialog-title", className].filter(Boolean).join(" ")} id={id} />
})

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(function DialogDescription(
  { className, ...props },
  ref
) {
  const id = useId()
  const { setDescriptionId } = useDialogContext()

  useEffect(() => {
    setDescriptionId(id)
    return () => setDescriptionId((currentId) => currentId === id ? undefined : currentId)
  }, [id, setDescriptionId])

  return <p {...props} ref={ref} className={["jds-dialog-description", className].filter(Boolean).join(" ")} id={id} />
})

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { className, onClick, ...props },
  ref
) {
  const { requestOpen } = useDialogContext()

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={["jds-dialog-close", className].filter(Boolean).join(" ")}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) requestOpen(false)
      }}
    />
  )
})
