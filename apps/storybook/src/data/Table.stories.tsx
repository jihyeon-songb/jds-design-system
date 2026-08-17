import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@jdsb/components"

const meta = { title: "Data/Table", component: Table, tags: ["table-regression"] } satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>주문 목록</TableCaption>
      <TableHeader><TableRow><TableHead scope="col">주문</TableHead><TableHead scope="col">상태</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>JDSB-1</TableCell><TableCell>처리 중</TableCell></TableRow></TableBody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole("table", { name: "주문 목록" })).toBeInTheDocument()
    expect(canvas.getByRole("columnheader", { name: "주문" })).toHaveAttribute("scope", "col")
  },
}

export const NumericData: Story = {
  render: () => (
    <Table>
      <TableCaption>월별 사용량</TableCaption>
      <TableHeader><TableRow><TableHead scope="col">월</TableHead><TableHead scope="col">사용량</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>8월</TableCell><TableCell>8.4 GB</TableCell></TableRow></TableBody>
    </Table>
  ),
}

export const NarrowContainer: Story = {
  render: () => (
    <div style={{ maxInlineSize: "var(--jdsb-size-drawer-block)" }}>
      <Table>
        <TableCaption>긴 주문 목록</TableCaption>
        <TableHeader><TableRow><TableHead scope="col">주문 번호</TableHead><TableHead scope="col">처리 상태</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>JDSB-2026-0001</TableCell><TableCell>처리 중</TableCell></TableRow></TableBody>
      </Table>
    </div>
  ),
}
