import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react"

export type SeparatorOrientation = "horizontal" | "vertical"

type HorizontalSeparatorProps = ComponentPropsWithoutRef<"hr"> & { orientation?: "horizontal" }
type VerticalSeparatorProps = ComponentPropsWithoutRef<"div"> & { orientation: "vertical" }

export type SeparatorProps = HorizontalSeparatorProps | VerticalSeparatorProps

export const Separator = forwardRef<HTMLHRElement | HTMLDivElement, SeparatorProps>(function Separator(
  { className, orientation = "horizontal", ...props },
  ref,
) {
  const classNames = ["jdsb-separator", className].filter(Boolean).join(" ")

  if (orientation === "vertical") {
    return <div {...(props as ComponentPropsWithoutRef<"div">)} ref={ref as Ref<HTMLDivElement>} aria-orientation="vertical" className={classNames} role="separator" />
  }

  return <hr {...(props as ComponentPropsWithoutRef<"hr">)} ref={ref as Ref<HTMLHRElement>} className={classNames} />
})
