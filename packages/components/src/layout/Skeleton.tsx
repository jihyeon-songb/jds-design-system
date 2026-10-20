import { forwardRef, type ComponentPropsWithoutRef } from "react"

export type SkeletonProps = Omit<ComponentPropsWithoutRef<"span">, "children">

export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { className, ...props },
  ref,
) {
  const classNames = ["jdsb-skeleton", className].filter(Boolean).join(" ")

  return <span {...props} ref={ref} aria-hidden="true" className={classNames} />
})
