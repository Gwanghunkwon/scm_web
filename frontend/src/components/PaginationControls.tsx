type PaginationControlsProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  const handlePrev = () => {
    if (page <= 1) return
    onPageChange(Math.max(1, page - 1))
  }

  const handleNext = () => {
    if (page >= totalPages) return
    onPageChange(Math.min(totalPages, page + 1))
  }

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={handlePrev}>
        이전
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={handleNext}>
        다음
      </button>
    </div>
  )
}

