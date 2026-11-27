function pad(value: number) {
  return String(value).padStart(2, '0')
}

// 날짜를 YYYY-MM-DD로 만든다. 브라우저 시간대 기준이다.
function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 서버는 시간대가 붙은 시각을 보낸다. 브라우저 시간대 기준으로 날짜만 보여 준다.
export function formatDate(value: string) {
  return toDateString(new Date(value))
}

// 서버가 보낸 시각을 브라우저 시간대 기준 YYYY-MM-DD HH:mm으로 보여 준다.
export function formatDateTime(value: string) {
  const date = new Date(value)
  return `${toDateString(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 서버가 날짜를 세는 시간대. 위험 수용 만료일은 서버가 한국 날짜로 검사한다.
const SERVER_TIME_ZONE = 'Asia/Seoul'

// 한국 날짜 기준 오늘로부터 days일 뒤 날짜(YYYY-MM-DD). 날짜 입력 칸의 고를 수 있는 범위에 쓴다.
// 브라우저 시간대로 세면 해외에서 열었을 때 서버와 하루 어긋날 수 있어서 한국 날짜로 센다.
export function dateAfterDays(days: number) {
  // en-CA 형식은 YYYY-MM-DD로 나온다.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: SERVER_TIME_ZONE }).format(new Date())
  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
