import { Alert, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { fetchFindingEvents } from '../../api/finding/FindingApi.ts'
import type { FindingEventRes } from '../../type/FindingType.ts'
import { formatDateTime } from '../../utils/formatDate.ts'

// 누가 바꿨는지. 사람이면 이름, 점검이면 그 점검 번호, 둘 다 없으면 기한 만료처럼 시스템이 바꾼 것이다.
function changedBy(event: FindingEventRes) {
  if (event.username) return event.username
  if (event.scan_id !== null) return `점검 #${event.scan_id}`
  return '자동(기한 만료)'
}

interface Props {
  findingId: number
  // 상태를 바꾼 뒤 이 값을 바꿔 주면 이력을 다시 불러온다.
  reloadKey: number
}

// 발견 하나의 상태 이력. 열 때 처음 불러온다. 최근 것부터 보여 준다.
export default function FindingEvents({ findingId, reloadKey }: Props) {
  // null이면 아직 불러오는 중이다.
  const [events, setEvents] = useState<FindingEventRes[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    fetchFindingEvents(findingId)
      .then((data) => {
        if (!ignore) {
          setEvents(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!ignore) setError('이력을 불러오지 못했습니다.')
      })
    return () => {
      ignore = true
    }
  }, [findingId, reloadKey])

  if (error) return <Alert severity="error">{error}</Alert>
  if (events === null) return <CircularProgress size={20} aria-label="이력 불러오는 중" />
  if (events.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        상태가 바뀐 적이 없습니다.
      </Typography>
    )
  }
  return (
    <Stack spacing={0.5}>
      {events.map((event) => (
        <Typography key={event.id} variant="body2">
          <Typography component="span" variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
            {formatDateTime(event.created_at)}
          </Typography>
          {event.from_status_label} → {event.to_status_label}
          {event.accepted_until && ` (${event.accepted_until}까지)`}
          <Typography component="span" variant="body2" sx={{ color: 'text.secondary', mx: 1 }}>
            {changedBy(event)}
          </Typography>
          {event.reason}
        </Typography>
      ))}
    </Stack>
  )
}
