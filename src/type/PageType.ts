// 쪽으로 나눠 오는 목록(DRF PageNumberPagination). next가 null이면 마지막 쪽이다.
export interface PageRes<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
