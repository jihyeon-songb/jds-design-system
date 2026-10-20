import { forwardRef, type ComponentPropsWithoutRef } from "react"

export type ProgressProps = Omit<ComponentPropsWithoutRef<"progress">, "aria-label"> & {
  label: string
}

export const Progress = forwardRef<HTMLProgressElement, ProgressProps>(function Progress(
  { className, label, ...props },
  ref,
) {
  const classNames = ["jdsb-progress", className].filter(Boolean).join(" ")

  return <progress {...props} ref={ref} aria-label={label} className={classNames} />
})
