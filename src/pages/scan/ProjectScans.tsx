import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { fetchScans, startScan } from '../../api/scan/ScanApi.ts'
import type { ScanSummaryRes } from '../../type/ScanType.ts'
import { formatDateTime, isActive, POLL_INTERVAL } from '../../utils/scan.ts'

interface Props {
  projectId: number
}

// 프로젝트 상세 아래쪽의 점검 영역. 전체 점검 실행 버튼과 최근 점검 목록.
export default function ProjectScans({ projectId }: Props) {
  const navigate = useNavigate()
  // null이면 아직 불러오는 중이다.
  const [scans, setScans] = useState<ScanSummaryRes[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let ignore = false
    let timer: number | undefined
    const load = () => {
      fetchScans(String(projectId))
        .then((data) => {
          if (ignore) return
          setScans(data)
          // 실행 중인 점검이 있으면 잠시 뒤에 다시 불러와 진행 상황을 갱신한다.
          if (data.some((scan) => isActive(scan.status))) {
            timer = window.setTimeout(load, POLL_INTERVAL)
          }
        })
        .catch(() => {
          if (!ignore) setLoadError('점검 기록을 불러오지 못했습니다.')
        })
    }
    load()
    return () => {
      ignore = true
      window.clearTimeout(timer)
    }
  }, [projectId])

  const handleStart = async () => {
    setStartError(null)
    setStarting(true)
    try {
      const created = await startScan(String(projectId))
      navigate(`/projects/${projectId}/scans/${created.id}`)
    } catch (e) {
      // 실행 중인 점검이 있음(409), 점검할 대상 없음(400), 실행기 연결 실패(503)는 서버 문구를 그대로 보여 준다.
      const detail = axios.isAxiosError<{ detail?: string }>(e) ? e.response?.data?.detail : undefined
      setStartError(detail ?? '점검을 시작하지 못했습니다. 잠시 후 다시 시도하세요.')
      setStarting(false)
    }
  }

  const running = scans?.some((scan) => isActive(scan.status)) ?? false

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" component="h2">
          점검
        </Typography>
        <Button variant="contained" onClick={handleStart} disabled={starting || running}>
          {starting ? '시작하는 중…' : '전체 점검 실행'}
        </Button>
      </Box>
      {running && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          실행 중인 점검이 끝나면 새로 시작할 수 있습니다.
        </Typography>
      )}
      {startError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {startError}
        </Alert>
      )}
      {loadError && <Alert severity="error">{loadError}</Alert>}
      {scans !== null && scans.length === 0 && (
        <Typography sx={{ color: 'text.secondary' }}>아직 실행한 점검이 없습니다.</Typography>
      )}
      {scans !== null && scans.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>번호</TableCell>
                <TableCell>시작</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>결과</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell>
                    <Link component={RouterLink} to={`/projects/${projectId}/scans/${scan.id}`}>
                      #{scan.id}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateTime(scan.created_at)}</TableCell>
                  <TableCell>
                    {isActive(scan.status) ? (
                      <Chip
                        size="small"
                        color="info"
                        label={`${scan.status_label} ${scan.finished_task_count}/${scan.task_count}`}
                      />
                    ) : (
                      <Chip size="small" label={scan.status_label} />
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive(scan.status) ? '-' : `발견 ${scan.found_count} · 실패 ${scan.failed_count}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
