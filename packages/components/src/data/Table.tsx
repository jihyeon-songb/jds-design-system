import { forwardRef, type ComponentPropsWithoutRef } from "react"

const classes = (base: string, className?: string) => [base, className].filter(Boolean).join(" ")

export type TableProps = ComponentPropsWithoutRef<"table">
export type TableCaptionProps = ComponentPropsWithoutRef<"caption">
export type TableHeaderProps = ComponentPropsWithoutRef<"thead">
export type TableBodyProps = ComponentPropsWithoutRef<"tbody">
export type TableFooterProps = ComponentPropsWithoutRef<"tfoot">
export type TableRowProps = ComponentPropsWithoutRef<"tr">
export type TableHeadProps = ComponentPropsWithoutRef<"th">
export type TableCellProps = ComponentPropsWithoutRef<"td">

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table({ className, ...props }, ref) {
  return <table {...props} ref={ref} className={classes("jdsb-table", className)} />
})

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(function TableCaption({ className, ...props }, ref) {
  return <caption {...props} ref={ref} className={classes("jdsb-table-caption", className)} />
})

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader({ className, ...props }, ref) {
  return <thead {...props} ref={ref} className={classes("jdsb-table-header", className)} />
})

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody({ className, ...props }, ref) {
  return <tbody {...props} ref={ref} className={classes("jdsb-table-body", className)} />
})

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter({ className, ...props }, ref) {
  return <tfoot {...props} ref={ref} className={classes("jdsb-table-footer", className)} />
})

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow({ className, ...props }, ref) {
  return <tr {...props} ref={ref} className={classes("jdsb-table-row", className)} />
})

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead({ className, ...props }, ref) {
  return <th {...props} ref={ref} className={classes("jdsb-table-head", className)} />
})

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell({ className, ...props }, ref) {
  return <td {...props} ref={ref} className={classes("jdsb-table-cell", className)} />
})
