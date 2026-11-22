import type { ScanStatus } from '../type/ScanType.ts'

// 실행 중인 점검을 다시 불러오는 간격(밀리초)
export const POLL_INTERVAL = 3000

// 아직 끝나지 않은 점검(대기, 실행 중). 완료와 취소는 끝난 점검이다.
export const isActive = (status: ScanStatus) => status === 'queued' || status === 'running'

// 시각까지 보여 준다. 예: 11/16 14:02
export function formatDateTime(value: string) {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
