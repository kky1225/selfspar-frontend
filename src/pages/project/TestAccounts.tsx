import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useEffect, useState, type SubmitEvent } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { fetchProject } from '../../api/project/ProjectApi.ts'
import { createAccount, deleteAccount, fetchAccounts } from '../../api/project/TestAccountApi.ts'
import type {
  ProjectDetailRes,
  TargetRes,
  TestAccountCreateReq,
  TestAccountFieldErrors,
  TestAccountRes,
} from '../../type/ProjectType.ts'
import { formatDate } from '../../utils/formatDate.ts'
import { LOGIN_KINDS } from '../../utils/targetConfig.ts'

const EMPTY_FORM: TestAccountCreateReq = { label: '', username: '', password: '' }

export default function TestAccounts() {
  const { id, targetId } = useParams()
  const [project, setProject] = useState<ProjectDetailRes | null>(null)
  const [target, setTarget] = useState<TargetRes | null>(null)
  // null이면 아직 불러오는 중이다.
  const [accounts, setAccounts] = useState<TestAccountRes[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState<TestAccountCreateReq>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<TestAccountFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 삭제 확인 창에 띄울 계정. null이면 창이 닫혀 있다.
  const [deleting, setDeleting] = useState<TestAccountRes | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !targetId) return
    let ignore = false
    // 화면 제목에 쓸 프로젝트·대상 정보와 계정 목록을 함께 불러온다.
    Promise.all([fetchProject(id), fetchAccounts(targetId)])
      .then(([projectData, accountData]) => {
        if (ignore) return
        const found = projectData.targets.find((item) => String(item.id) === targetId)
        if (!found) {
          setLoadError('대상을 찾을 수 없습니다.')
          return
        }
        setProject(projectData)
        setTarget(found)
        setAccounts(accountData)
      })
      .catch((e) => {
        if (ignore) return
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setLoadError('대상을 찾을 수 없습니다.')
        } else {
          setLoadError('테스트 계정을 불러오지 못했습니다.')
        }
      })
    return () => {
      ignore = true
    }
  }, [id, targetId])

  const update = <K extends keyof TestAccountCreateReq>(field: K, value: TestAccountCreateReq[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // 고치기 시작한 칸의 오류 문구는 지운다.
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!targetId) return
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const created = await createAccount(targetId, form)
      setAccounts((prev) => [...(prev ?? []), created])
      setForm(EMPTY_FORM)
    } catch (e) {
      const data = axios.isAxiosError<TestAccountFieldErrors>(e) && e.response?.status === 400 ? e.response.data : null
      if (data && (data.label || data.username || data.password)) {
        setFieldErrors(data)
      } else {
        setFormError('계정을 추가하지 못했습니다. 잠시 후 다시 시도하세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteError(null)
    try {
      await deleteAccount(deleting.id)
      setAccounts((prev) => (prev ?? []).filter((account) => account.id !== deleting.id))
      setDeleting(null)
      // 지운 계정 때문에 났던 이름 중복 오류가 남지 않게 한다.
      setFieldErrors({})
    } catch {
      setDeleteError('계정을 삭제하지 못했습니다. 잠시 후 다시 시도하세요.')
    }
  }

  if (loadError) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error">{loadError}</Alert>
        <Button component={RouterLink} to={id ? `/projects/${id}` : '/'}>
          돌아가기
        </Button>
      </Stack>
    )
  }

  if (project === null || target === null || accounts === null) {
    return <CircularProgress />
  }

  const canHaveAccounts = LOGIN_KINDS.includes(target.kind)

  return (
    <Stack spacing={3}>
      <Box>
        {/* MUI 버튼은 글자를 대문자로 바꾼다. 프로젝트 이름은 입력한 그대로 보여 준다. */}
        <Button component={RouterLink} to={`/projects/${project.id}`} sx={{ mb: 1, textTransform: 'none' }}>
          ← {project.name}
        </Button>
        <Typography variant="h5" component="h1">
          {target.name} / 테스트 계정
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          점검할 때 로그인에 쓰는 계정입니다. 실제 사용자 계정이 아니라 테스트용으로 만든 계정만 등록하세요.
        </Typography>
      </Box>

      {!canHaveAccounts ? (
        <Alert severity="info">로그인 기능이 있는 대상(API, 도메인)에만 테스트 계정을 등록할 수 있습니다.</Alert>
      ) : (
        <>
          {accounts.length === 0 ? (
            <Typography sx={{ color: 'text.secondary' }}>아직 등록한 테스트 계정이 없습니다.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell>아이디</TableCell>
                    <TableCell>비밀번호</TableCell>
                    <TableCell>등록일</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.label}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{account.username}</TableCell>
                      {/* 서버가 비밀번호를 돌려주지 않는다. 저장되어 있다는 표시만 한다. */}
                      <TableCell>••••••</TableCell>
                      <TableCell>{formatDate(account.created_at)}</TableCell>
                      <TableCell align="right">
                        <Button color="error" onClick={() => setDeleting(account)}>
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Paper sx={{ p: 3, maxWidth: 640 }}>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <Typography variant="h6" component="h2">
                계정 추가
              </Typography>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                label="이름"
                value={form.label}
                onChange={(e) => update('label', e.target.value)}
                error={Boolean(fieldErrors.label)}
                helperText={fieldErrors.label?.[0] ?? '예: 사용자 A, 낮은 권한 관리자'}
                slotProps={{ htmlInput: { maxLength: 50 } }}
                required
              />
              {/* 브라우저가 selfspar 로그인 정보를 자동으로 채우지 않게 막는다. */}
              <TextField
                label="아이디"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                error={Boolean(fieldErrors.username)}
                helperText={fieldErrors.username?.[0]}
                slotProps={{ htmlInput: { maxLength: 200, autoComplete: 'off' } }}
                required
              />
              <TextField
                label="비밀번호"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password?.[0] ?? '암호화해서 저장하고, 저장한 뒤에는 다시 보여 주지 않습니다.'}
                slotProps={{ htmlInput: { maxLength: 200, autoComplete: 'new-password' } }}
                required
              />
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? '추가 중…' : '추가'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </>
      )}

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
        <DialogTitle>테스트 계정 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.label}({deleting?.username}) 계정을 삭제할까요? 저장한 비밀번호도 함께 지워집니다.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>취소</Button>
          <Button color="error" onClick={handleDelete}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
