import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react"

type PaginationValueProps =
  | { page: number; defaultPage?: never }
  | { defaultPage: number; page?: never }

export type PaginationProps = Omit<
  ComponentPropsWithoutRef<"nav">,
  "aria-label" | "children"
> & PaginationValueProps & {
  "aria-label": string
  totalPages: number
  getPageLabel?: (page: number, current: boolean) => string
  nextLabel?: string
  onPageChange?: (page: number) => void
  previousLabel?: string
}

function assertPage(value: number, name: string, totalPages?: number): void {
  if (!Number.isInteger(value) || value < 1 || (totalPages !== undefined && value > totalPages)) {
    throw new RangeError(`${name} must be an integer between 1 and ${totalPages ?? "Infinity"}`)
  }
}

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  // 첫·끝 페이지와 현재 페이지 주변을 포함한 최대 7칸 window를 유지한다.
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages]
  if (page >= totalPages - 3) return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
}

function getDefaultPageLabel(page: number, current: boolean): string {
  return `${page} 페이지${current ? ", 현재 페이지" : ""}`
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    className,
    defaultPage,
    getPageLabel = getDefaultPageLabel,
    nextLabel = "다음 페이지",
    onPageChange,
    page,
    previousLabel = "이전 페이지",
    totalPages,
    ...props
  },
  forwardedRef
) {
  assertPage(totalPages, "totalPages")
  if (page !== undefined) assertPage(page, "page", totalPages)
  const [uncontrolledPage, setUncontrolledPage] = useState(() => {
    if (page === undefined) assertPage(defaultPage!, "defaultPage", totalPages)
    return defaultPage
  })
  const selectedPage = page ?? Math.min(uncontrolledPage!, totalPages)
  if (page === undefined && uncontrolledPage !== selectedPage) setUncontrolledPage(selectedPage)

  function requestPage(nextPage: number): void {
    if (nextPage === selectedPage) return
    if (page === undefined) setUncontrolledPage(nextPage)
    onPageChange?.(nextPage)
  }

  return (
    <nav
      {...props}
      ref={forwardedRef}
      className={["jdsb-pagination", className].filter(Boolean).join(" ")}
    >
      <ul>
        <li>
          <button
            type="button"
            className="jdsb-pagination-control"
            aria-label={previousLabel}
            disabled={selectedPage === 1}
            data-direction="previous"
            data-state={selectedPage === 1 ? "disabled" : "enabled"}
            onClick={() => requestPage(selectedPage - 1)}
          >
            {previousLabel}
          </button>
        </li>
        {getVisiblePages(selectedPage, totalPages).map((item, index) => {
          if (item === "ellipsis") return <li key={`ellipsis-${index}`}><span aria-hidden="true">…</span></li>
          const current = item === selectedPage
          return (
            <li key={item}>
              <button
                type="button"
                className="jdsb-pagination-page"
                aria-current={current ? "page" : undefined}
                aria-label={getPageLabel(item, current)}
                data-state={current ? "current" : "idle"}
                onClick={() => requestPage(item)}
              >
                {item}
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            className="jdsb-pagination-control"
            aria-label={nextLabel}
            disabled={selectedPage === totalPages}
            data-direction="next"
            data-state={selectedPage === totalPages ? "disabled" : "enabled"}
            onClick={() => requestPage(selectedPage + 1)}
          >
            {nextLabel}
          </button>
        </li>
      </ul>
    </nav>
  )
})
