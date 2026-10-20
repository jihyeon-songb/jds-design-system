import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Table as PublicTable,
  TableBody as PublicTableBody,
  TableCaption as PublicTableCaption,
  TableCell as PublicTableCell,
  TableFooter as PublicTableFooter,
  TableHead as PublicTableHead,
  TableHeader as PublicTableHeader,
  TableRow as PublicTableRow,
  type TableBodyProps as PublicTableBodyProps,
  type TableCaptionProps as PublicTableCaptionProps,
  type TableCellProps as PublicTableCellProps,
  type TableFooterProps as PublicTableFooterProps,
  type TableHeadProps as PublicTableHeadProps,
  type TableHeaderProps as PublicTableHeaderProps,
  type TableProps as PublicTableProps,
  type TableRowProps as PublicTableRowProps,
} from "../index.js"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./Table.js"

afterEach(cleanup)

describe("Table", () => {
  it("exports every Table primitive and prop type from the package entry", () => {
    const tableProps: PublicTableProps = { children: <PublicTableCaption>주문 목록</PublicTableCaption> }
    const captionProps: PublicTableCaptionProps = { children: "주문 목록" }
    const headerProps: PublicTableHeaderProps = { children: "제목" }
    const bodyProps: PublicTableBodyProps = { children: "본문" }
    const footerProps: PublicTableFooterProps = { children: "합계" }
    const rowProps: PublicTableRowProps = { children: "행" }
    const headProps: PublicTableHeadProps = { scope: "col", children: "주문" }
    const cellProps: PublicTableCellProps = { children: "JDSB-1" }
    render(<PublicTable {...tableProps} />)

    expect(PublicTable).toBe(Table)
    expect(PublicTableCaption).toBe(TableCaption)
    expect(PublicTableHeader).toBe(TableHeader)
    expect(PublicTableBody).toBe(TableBody)
    expect(PublicTableFooter).toBe(TableFooter)
    expect(PublicTableRow).toBe(TableRow)
    expect(PublicTableHead).toBe(TableHead)
    expect(PublicTableCell).toBe(TableCell)
    expect(captionProps.children).toBe("주문 목록")
    expect(headerProps.children).toBe("제목")
    expect(bodyProps.children).toBe("본문")
    expect(footerProps.children).toBe("합계")
    expect(rowProps.children).toBe("행")
    expect(headProps.scope).toBe("col")
    expect(cellProps.children).toBe("JDSB-1")
  })

  it("preserves caption naming and header scope", () => {
    render(
      <Table>
        <TableCaption>주문 목록</TableCaption>
        <TableHeader><TableRow><TableHead scope="col">주문</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>JDSB-1</TableCell></TableRow></TableBody>
      </Table>,
    )

    expect(screen.getByRole("table", { name: "주문 목록" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "주문" })).toHaveAttribute("scope", "col")
    expect(screen.getByRole("cell", { name: "JDSB-1" })).toBeInTheDocument()
  })

  it("forwards native props, events, class names, and element refs", () => {
    const tableRef = createRef<HTMLTableElement>()
    const cellRef = createRef<HTMLTableCellElement>()
    const onClick = vi.fn()
    render(
      <Table aria-label="사용량" className="consumer-table" id="usage" ref={tableRef}>
        <TableBody><TableRow><TableCell className="consumer-cell" onClick={onClick} ref={cellRef}>8 GB</TableCell></TableRow></TableBody>
      </Table>,
    )

    expect(tableRef.current).toBe(screen.getByRole("table", { name: "사용량" }))
    expect(tableRef.current).toHaveAttribute("id", "usage")
    expect(tableRef.current).toHaveClass("jdsb-table", "consumer-table")
    expect(cellRef.current).toBe(screen.getByRole("cell", { name: "8 GB" }))
    expect(cellRef.current).toHaveClass("jdsb-table-cell", "consumer-cell")
    fireEvent.click(cellRef.current!)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
