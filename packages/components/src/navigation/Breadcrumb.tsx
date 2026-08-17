import { forwardRef, type ComponentPropsWithoutRef } from "react"

const classes = (base: string, className?: string) => [base, className].filter(Boolean).join(" ")

export type BreadcrumbProps = ComponentPropsWithoutRef<"nav"> & { "aria-label": string }
export type BreadcrumbListProps = ComponentPropsWithoutRef<"ol">
export type BreadcrumbItemProps = ComponentPropsWithoutRef<"li">
export type BreadcrumbLinkProps = ComponentPropsWithoutRef<"a">
export type BreadcrumbPageProps = Omit<ComponentPropsWithoutRef<"span">, "aria-current">
export type BreadcrumbSeparatorProps = Omit<ComponentPropsWithoutRef<"span">, "aria-hidden">

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb({ className, ...props }, ref) {
  return <nav {...props} ref={ref} className={classes("jdsb-breadcrumb", className)} />
})

export const BreadcrumbList = forwardRef<HTMLOListElement, BreadcrumbListProps>(function BreadcrumbList(
  { className, ...props },
  ref,
) {
  return <ol {...props} ref={ref} className={classes("jdsb-breadcrumb-list", className)} />
})

export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(function BreadcrumbItem(
  { className, ...props },
  ref,
) {
  return <li {...props} ref={ref} className={classes("jdsb-breadcrumb-item", className)} />
})

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(function BreadcrumbLink(
  { className, ...props },
  ref,
) {
  return <a {...props} ref={ref} className={classes("jdsb-breadcrumb-link", className)} />
})

export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(function BreadcrumbPage(
  { className, ...props },
  ref,
) {
  return <span {...props} ref={ref} aria-current="page" className={classes("jdsb-breadcrumb-page", className)} />
})

export const BreadcrumbSeparator = forwardRef<HTMLSpanElement, BreadcrumbSeparatorProps>(function BreadcrumbSeparator(
  { className, ...props },
  ref,
) {
  return <span {...props} ref={ref} aria-hidden="true" className={classes("jdsb-breadcrumb-separator", className)} />
})
