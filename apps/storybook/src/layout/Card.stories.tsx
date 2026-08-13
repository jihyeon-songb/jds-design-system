import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@jdsb/components"

const meta = { title: "Layout/Card", component: Card } satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>월간 사용량</CardTitle>
        <CardDescription>이번 결제 주기의 누적 사용량입니다.</CardDescription>
      </CardHeader>
      <CardContent>8.4 GB / 10 GB</CardContent>
    </Card>
  ),
}

export const SectionHeading: Story = {
  render: () => <Card><CardHeader><CardTitle as="h2">프로젝트</CardTitle></CardHeader></Card>,
}

export const WithFooterAction: Story = {
  render: () => <Card><CardContent>변경 사항을 검토하세요.</CardContent><CardFooter><Button>검토하기</Button></CardFooter></Card>,
}
