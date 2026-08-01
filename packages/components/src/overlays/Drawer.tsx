import { forwardRef } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogProps,
  type DialogTitleProps,
  type DialogTriggerProps,
} from "./Dialog.js"

export type DrawerProps = DialogProps
export type DrawerTriggerProps = DialogTriggerProps
export type DrawerSide = "left" | "right" | "top" | "bottom"
export type DrawerContentProps = DialogContentProps & { side?: DrawerSide }
export type DrawerTitleProps = DialogTitleProps
export type DrawerDescriptionProps = DialogDescriptionProps
export type DrawerCloseProps = DialogCloseProps

export const Drawer = Dialog
export const DrawerTrigger = DialogTrigger
export const DrawerTitle = DialogTitle
export const DrawerDescription = DialogDescription
export const DrawerClose = DialogClose

export const DrawerContent = forwardRef<HTMLDialogElement, DrawerContentProps>(function DrawerContent(
  { className, side = "right", ...props },
  ref
) {
  return (
    <DialogContent
      {...props}
      ref={ref}
      className={["jds-drawer-content", className].filter(Boolean).join(" ")}
      data-side={side}
    />
  )
})
