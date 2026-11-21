import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
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
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { fetchScan, startRescan } from '../../api/scan/ScanApi.ts'
import type { ScanDetailRes, ModuleRunRes } from '../../type/ScanType.ts'
import { formatDateTime, isActive, POLL_INTERVAL } from '../../utils/scan.ts'
import FindingsDialog from './FindingsDialog.tsx'

interface RunChipProps {
  run: ModuleRunRes
  // 없으면 눌러도 창을 열지 않는다(다시 점검할 칸을 고르는 중).
  onShowError?: (run: ModuleRunRes) => void
  onShowFindings?: (run: ModuleRunRes) => void
}

// 칸 상태별 표시. 발견은 개수를 함께 보여 주고, 누르면 발견 목록을 연다.
function RunChip({ run, onShowError, onShowFindings }: RunChipProps) {
  switch (run.status) {
    case 'passed':
      return <Chip size="small" color="success" label="이상 없음" />
    case 'found':
      return (
        <Chip
          size="small"
          color="error"
          label={`발견 ${run.finding_count}`}
          onClick={onShowFindings && (() => onShowFindings(run))}
        />
      )
    case 'failed':
      return <Chip size="small" color="warning" label="실패" onClick={onShowError && (() => onShowError(run))} />
    case 'running':
      return <Chip size="small" color="info" label="실행 중" />
    default:
      return <Chip size="small" variant="outlined" label={run.status_label} />
  }
}

// 서버가 돌려준 오류 문구. 점검 시작 실패는 {"detail": "..."}, 재점검 칸 검사 실패(400)는 {"run_ids": ["..."]}처럼 온다.
function serverMessage(e: unknown) {
  if (!axios.isAxiosError(e)) return null
  const data: unknown = e.response?.data
  if (typeof data !== 'object' || data === null) return null
  const first = Object.values(data).flat()[0]
  return typeof first === 'string' ? first : null
}

export default function ScanDetail() {
  const { id, scanId } = useParams()
  const navigate = useNavigate()
  // null이면 아직 불러오는 중이다.
  const [scan, setScan] = useState<ScanDetailRes | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 오류 내용 창에 띄울 칸. null이면 창이 닫혀 있다.
  const [errorRun, setErrorRun] = useState<ModuleRunRes | null>(null)
  // 발견 목록 창에 띄울 칸. null이면 창이 닫혀 있다.
  const [findingRun, setFindingRun] = useState<ModuleRunRes | null>(null)
  // 다시 점검할 칸을 고르는 중인지와 고른 칸 번호들
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rescanning, setRescanning] = useState(false)
  const [rescanError, setRescanError] = useState<string | null>(null)

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

  // (대상, 모듈)로 칸을 바로 찾을 수 있게 묶어 둔다.
  const runByCell = new Map(scan.runs.map((run) => [`${run.target}:${run.module}`, run]))
  // 발견은 건수를 더하고, 실패는 칸 수를 센다.
  const findingCount = scan.runs.reduce((sum, run) => sum + run.finding_count, 0)
  const failedCount = scan.runs.filter((run) => run.status === 'failed').length
  // 지금 이 대상에 해당하는 모듈인지. 점검 뒤에 모듈이 없어졌거나 대상 종류가 바뀐 칸은 다시 점검할 수 없다.
  const applies = (targetId: number, moduleKey: string) => {
    const kind = scan.targets.find((target) => target.id === targetId)?.kind
    const module = scan.modules.find((module) => module.key === moduleKey)
    return kind !== undefined && module !== undefined && module.kinds.includes(kind)
  }
  // 버튼으로 다시 점검할 칸. 다시 점검할 수 없는 칸이 섞이면 서버가 요청 전체를 거절하므로 미리 뺀다.
  const failedRuns = scan.runs.filter((run) => run.status === 'failed' && applies(run.target, run.module))
  const foundRuns = scan.runs.filter((run) => run.status === 'found' && applies(run.target, run.module))
  const isRescan = scan.source_scan !== null
  // 창 제목에 쓸 이름
  const targetName = (id: number) => scan.targets.find((target) => target.id === id)?.name ?? ''
  const moduleLabel = (key: string) => scan.modules.find((module) => module.key === key)?.label ?? key

  const toggle = (runId: number) => {
    const next = new Set(selected)
    if (next.has(runId)) {
      next.delete(runId)
    } else {
      next.add(runId)
    }
    setSelected(next)
  }

  const cancelSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  const handleRescan = async (runIds: number[]) => {
    setRescanError(null)
    setRescanning(true)
    try {
      const created = await startRescan(String(scan.project.id), { source_scan: scan.id, run_ids: runIds })
      // 같은 화면에서 주소만 바뀌므로, 이 점검을 보던 상태를 비우고 새 점검을 불러오게 한다.
      cancelSelecting()
      setRescanning(false)
      setScan(null)
      navigate(`/projects/${scan.project.id}/scans/${created.id}`)
    } catch (e) {
      // 실행 중인 점검이 있음(409), 고른 칸이 잘못됨(400), 실행기 연결 실패(503)는 서버 문구를 그대로 보여 준다.
      setRescanError(serverMessage(e) ?? '다시 점검을 시작하지 못했습니다. 잠시 후 다시 시도하세요.')
      setRescanning(false)
    }
  }

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
        {isRescan && (
          <Typography variant="body2">
            <Link component={RouterLink} to={`/projects/${scan.project.id}/scans/${scan.source_scan}`}>
              #{scan.source_scan}
            </Link>
            에서 고른 칸만 다시 점검했습니다.
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formatDateTime(scan.created_at)} – {scan.finished_at ? formatDateTime(scan.finished_at) : '진행 중'} · 칸{' '}
          {scan.runs.length}개 · 발견 {findingCount}건 · 실패 {failedCount}칸
        </Typography>
      </Box>

      {isActive(scan.status) && <Alert severity="info">점검이 {scan.status_label}입니다. 끝날 때까지 자동으로 갱신합니다.</Alert>}

      {/* 끝난 점검에서만 다시 점검할 수 있다. 실행 중인 점검이 끝나기 전에는 새 점검을 시작할 수 없다. */}
      {!isActive(scan.status) &&
        (selecting ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ flexGrow: 1 }}>다시 점검할 칸을 고르세요.</Typography>
            <Button onClick={cancelSelecting} disabled={rescanning}>
              취소
            </Button>
            <Button
              variant="contained"
              onClick={() => handleRescan([...selected])}
              disabled={selected.size === 0 || rescanning}
            >
              {rescanning ? '시작하는 중…' : `고른 ${selected.size}칸 다시 점검`}
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {failedRuns.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => handleRescan(failedRuns.map((run) => run.id))}
                disabled={rescanning}
              >
                실패한 칸 다시 점검 ({failedRuns.length})
              </Button>
            )}
            {foundRuns.length > 0 && (
              <Button variant="outlined" onClick={() => handleRescan(foundRuns.map((run) => run.id))} disabled={rescanning}>
                발견된 칸 다시 점검 ({foundRuns.length})
              </Button>
            )}
            <Button onClick={() => setSelecting(true)} disabled={rescanning}>
              골라서 다시 점검
            </Button>
          </Stack>
        ))}

      {rescanError && <Alert severity="error">{rescanError}</Alert>}

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
                  const run = runByCell.get(`${target.id}:${module.key}`)
                  let cell
                  if (run && selecting && applies(run.target, run.module)) {
                    // 고르는 중에는 칸을 눌러도 창을 열지 않고 체크만 바꾼다.
                    cell = (
                      <FormControlLabel
                        sx={{ mr: 0 }}
                        control={<Checkbox size="small" checked={selected.has(run.id)} onChange={() => toggle(run.id)} />}
                        label={<RunChip run={run} />}
                      />
                    )
                  } else if (run) {
                    cell = <RunChip run={run} onShowError={setErrorRun} onShowFindings={setFindingRun} />
                  } else if (isRescan && module.kinds.includes(target.kind)) {
                    // 재점검에서 해당하는 모듈인데 칸이 없다: 고르지 않은 칸이다.
                    // 전체 점검에서 칸이 없는 것은 점검 뒤에 생긴 모듈이라 '–'로 둔다.
                    cell = <Chip size="small" variant="outlined" label="점검 안 함" sx={{ color: 'text.disabled' }} />
                  } else {
                    cell = (
                      <Typography component="span" sx={{ color: 'text.disabled' }}>
                        –
                      </Typography>
                    )
                  }
                  return (
                    <TableCell key={module.key} align="center">
                      {cell}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        – 는 그 대상에 해당하지 않는 점검입니다.{isRescan && ' 점검 안 함은 이번 재점검에서 고르지 않은 칸입니다.'} 발견
        칸을 누르면 발견 목록을, 실패 칸을 누르면 오류 내용을 볼 수 있습니다.
      </Typography>

      {findingRun && (
        <FindingsDialog
          key={findingRun.id}
          run={findingRun}
          scanId={scan.id}
          title={`${targetName(findingRun.target)} · ${moduleLabel(findingRun.module)}`}
          onClose={() => setFindingRun(null)}
        />
      )}

      <Dialog open={errorRun !== null} onClose={() => setErrorRun(null)} fullWidth maxWidth="sm">
        <DialogTitle>점검 실패 내용</DialogTitle>
        <DialogContent>
          {/* 도구가 낸 오류는 여러 줄이라 줄바꿈을 그대로 보여 준다. */}
          <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0 }}>
            {errorRun?.error_message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorRun(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
