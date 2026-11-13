// 서버는 시간대가 붙은 시각을 보낸다. 브라우저 시간대 기준으로 날짜만 보여 준다.
export function formatDate(value: string) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
