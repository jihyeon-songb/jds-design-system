import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactElement,
} from "react"

const classes = (base: string, className?: string) => [base, className].filter(Boolean).join(" ")

export type CardProps = ComponentPropsWithoutRef<"div">
export type CardHeaderProps = ComponentPropsWithoutRef<"div">
export type CardDescriptionProps = ComponentPropsWithoutRef<"div">
export type CardContentProps = ComponentPropsWithoutRef<"div">
export type CardFooterProps = ComponentPropsWithoutRef<"div">
export type CardTitleProps<T extends ElementType = "h3"> = { as?: T } & Omit<ComponentPropsWithoutRef<T>, "as">

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={classes("jdsb-card", className)} />
})

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={classes("jdsb-card-header", className)} />
})

type CardTitleComponent = <T extends ElementType = "h3">(
  props: CardTitleProps<T> & { ref?: ComponentPropsWithRef<T>["ref"] },
) => ReactElement | null

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle({ as, className, ...props }, ref) {
  const Component = as ?? "h3"
  return <Component {...props} ref={ref} className={classes("jdsb-card-title", className)} />
}) as CardTitleComponent

export const CardDescription = forwardRef<HTMLDivElement, CardDescriptionProps>(function CardDescription({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={classes("jdsb-card-description", className)} />
})

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={classes("jdsb-card-content", className)} />
})

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={classes("jdsb-card-footer", className)} />
})
