import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
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
import { Link as RouterLink, useParams } from 'react-router-dom'
import { fetchScan } from '../../api/scan/ScanApi.ts'
import type { ScanDetailRes, ScanTaskRes } from '../../type/ScanType.ts'
import { formatDateTime, isActive, POLL_INTERVAL } from '../../utils/scan.ts'

// 칸 상태별 표시. 발견은 개수를 함께 보여 준다.
function TaskChip({ task, onShowError }: { task: ScanTaskRes; onShowError: (task: ScanTaskRes) => void }) {
  switch (task.status) {
    case 'passed':
      return <Chip size="small" color="success" label="이상 없음" />
    case 'found':
      return <Chip size="small" color="error" label={`발견 ${task.finding_count}`} />
    case 'failed':
      return <Chip size="small" color="warning" label="실패" onClick={() => onShowError(task)} />
    case 'running':
      return <Chip size="small" color="info" label="실행 중" />
    default:
      return <Chip size="small" variant="outlined" label={task.status_label} />
  }
}

export default function ScanDetail() {
  const { id, scanId } = useParams()
  // null이면 아직 불러오는 중이다.
  const [scan, setScan] = useState<ScanDetailRes | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 오류 내용 창에 띄울 칸. null이면 창이 닫혀 있다.
  const [errorTask, setErrorTask] = useState<ScanTaskRes | null>(null)

  useEffect(() => {
    if (!id || !scanId) return
    let ignore = false
    let timer: number | undefined
    const load = () => {
      fetchScan(scanId)
        .then((data) => {
          if (ignore) return
          // 주소의 프로젝트와 점검의 프로젝트가 다르면 잘못 들어온 주소다.
          if (String(data.project.id) !== id) {
            setError('점검을 찾을 수 없습니다.')
            return
          }
          setScan(data)
          // 끝날 때까지 잠시마다 다시 불러와 칸 상태를 갱신한다.
          if (isActive(data.status)) {
            timer = window.setTimeout(load, POLL_INTERVAL)
          }
        })
        .catch((e) => {
          if (ignore) return
          if (axios.isAxiosError(e) && e.response?.status === 404) {
            setError('점검을 찾을 수 없습니다.')
          } else {
            setError('점검 결과를 불러오지 못했습니다.')
          }
        })
    }
    load()
    return () => {
      ignore = true
      window.clearTimeout(timer)
    }
  }, [id, scanId])

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error">{error}</Alert>
        <Button component={RouterLink} to={id ? `/projects/${id}` : '/'}>
          돌아가기
        </Button>
      </Stack>
    )
  }

  if (scan === null) {
    return <CircularProgress />
  }

  // (대상, 모듈)로 칸을 바로 찾을 수 있게 묶어 둔다. 칸이 없으면 그 대상에는 해당 없는 모듈이다.
  const taskByCell = new Map(scan.tasks.map((task) => [`${task.target}:${task.module}`, task]))
  const foundCount = scan.tasks.filter((task) => task.status === 'found').length
  const failedCount = scan.tasks.filter((task) => task.status === 'failed').length

  return (
    <Stack spacing={3}>
      <Box>
        {/* MUI 버튼은 글자를 대문자로 바꾼다. 프로젝트 이름은 입력한 그대로 보여 준다. */}
        <Button component={RouterLink} to={`/projects/${scan.project.id}`} sx={{ mb: 1, textTransform: 'none' }}>
          ← {scan.project.name}
        </Button>
        <Typography variant="h5" component="h1">
          점검 #{scan.id} 결과
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formatDateTime(scan.created_at)} – {scan.finished_at ? formatDateTime(scan.finished_at) : '진행 중'} · 칸{' '}
          {scan.tasks.length}개 · 발견 {foundCount} · 실패 {failedCount}
        </Typography>
      </Box>

      {isActive(scan.status) && <Alert severity="info">점검이 {scan.status_label}입니다. 끝날 때까지 자동으로 갱신합니다.</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>대상</TableCell>
              {scan.modules.map((module) => (
                <TableCell key={module.key} align="center">
                  {module.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {scan.targets.map((target) => (
              <TableRow key={target.id}>
                <TableCell>
                  {target.name}
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {target.kind_label} · {target.environment_label}
                  </Typography>
                </TableCell>
                {scan.modules.map((module) => {
                  const task = taskByCell.get(`${target.id}:${module.key}`)
                  return (
                    <TableCell key={module.key} align="center">
                      {task ? (
                        <TaskChip task={task} onShowError={setErrorTask} />
                      ) : (
                        <Typography component="span" sx={{ color: 'text.disabled' }}>
                          –
                        </Typography>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        – 는 그 대상에 해당하지 않는 점검입니다. 실패 칸을 누르면 오류 내용을 볼 수 있습니다.
      </Typography>

      <Dialog open={errorTask !== null} onClose={() => setErrorTask(null)} fullWidth maxWidth="sm">
        <DialogTitle>점검 실패 내용</DialogTitle>
        <DialogContent>
          {/* 도구가 낸 오류는 여러 줄이라 줄바꿈을 그대로 보여 준다. */}
          <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0 }}>
            {errorTask?.error_message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorTask(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
