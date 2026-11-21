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
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { fetchRunFindings } from '../../api/finding/FindingApi.ts'
import type { FindingRes, FindingSeverity } from '../../type/FindingType.ts'
import type { ModuleRunRes } from '../../type/ScanType.ts'

const SEVERITY_COLOR: Record<FindingSeverity, 'error' | 'warning' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'default',
  info: 'default',
}

// 도구 결과에서 온 주소라서 https 주소만 링크로 만든다. javascript: 같은 주소가 섞여 들어와도 실행되지 않게 한다.
function safeUrl(url: string | undefined): string | null {
  return url?.startsWith('https://') ? url : null
}

interface Props {
  run: ModuleRunRes
  scanId: number
  // 창 제목. 예: 로컬 · 시크릿 유출
  title: string
  onClose: () => void
}

// 결과 격자에서 발견 칸을 누르면 여는 발견 목록 창.
// 칸이 바뀔 때마다 새로 그리도록 부모에서 key={run.id}를 준다.
export default function FindingsDialog({ run, scanId, title, onClose }: Props) {
  // null이면 아직 불러오는 중이다. 서버가 심각한 것부터 50건씩 주고, '더 보기'를 누르면 뒤에 이어 붙인다.
  const [findings, setFindings] = useState<FindingRes[] | null>(null)
  const [total, setTotal] = useState(0)
  // 다음에 불러올 쪽 번호. null이면 다 불러왔다.
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    fetchRunFindings(run.id, 1)
      .then((data) => {
        if (ignore) return
        setFindings(data.results)
        setTotal(data.count)
        setNextPage(data.next ? 2 : null)
      })
      .catch(() => {
        if (!ignore) setError('발견 목록을 불러오지 못했습니다.')
      })
    return () => {
      ignore = true
    }
  }, [run.id])

  const loadMore = () => {
    if (nextPage === null) return
    setLoadingMore(true)
    setError(null)
    fetchRunFindings(run.id, nextPage)
      .then((data) => {
        setFindings((prev) => [...(prev ?? []), ...data.results])
        setNextPage(data.next ? nextPage + 1 : null)
      })
      .catch(() => setError('발견 목록을 더 불러오지 못했습니다.'))
      .finally(() => setLoadingMore(false))
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {title} — 발견 {run.finding_count}건
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          도구 버전 {run.tool_version}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && findings === null && <CircularProgress />}
        {findings !== null && findings.length === 0 && (
          // 발견 저장 기능을 만들기 전에 실행한 점검은 건수만 있고 목록이 없다.
          <Typography sx={{ color: 'text.secondary' }}>저장된 발견 목록이 없습니다.</Typography>
        )}
        {findings !== null && findings.length > 0 && (
          <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />} spacing={2}>
            {findings.map((finding) => {
              const detailUrl = safeUrl(finding.extra.url)
              return (
                <Box key={finding.id}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" color={SEVERITY_COLOR[finding.severity]} label={finding.severity_label} />
                    <Typography sx={{ fontWeight: 500 }}>{finding.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {finding.rule_id}
                    </Typography>
                    {finding.first_scan_id === scanId ? (
                      <Chip size="small" color="info" variant="outlined" label="이번에 처음 발견" />
                    ) : (
                      <Chip size="small" variant="outlined" label={`점검 #${finding.first_scan_id}부터 계속`} />
                    )}
                    {detailUrl && (
                      // 취약점 설명 페이지. 새 탭으로 열고, 열린 페이지가 이 창을 조작하지 못하게 noopener를 붙인다.
                      <Link href={detailUrl} target="_blank" rel="noopener noreferrer" variant="body2">
                        자세히 보기
                      </Link>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1, wordBreak: 'break-all' }}>
                    {finding.location}
                  </Typography>
                  {finding.evidence && (
                    // 근거 줄. 비밀 값은 서버에서 REDACTED로 가려진 채로 온다.
                    <Typography
                      component="pre"
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        bgcolor: 'action.hover',
                        p: 1,
                        mt: 0.5,
                        mb: 0,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {finding.evidence}
                    </Typography>
                  )}
                  {finding.extra.commit && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      커밋 {finding.extra.commit.slice(0, 8)}
                      {finding.extra.date && ` · ${finding.extra.date.slice(0, 10)}`}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Stack>
        )}
        {findings !== null && nextPage !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
              더 보기
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {total}건 중 {findings.length}건
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  )
}
