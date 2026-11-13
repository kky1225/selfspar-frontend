import { Alert, Autocomplete, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import axios from 'axios'
import { useEffect, useState, type SubmitEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { createProject, fetchProjects } from '../../api/project/ProjectApi.ts'
import type { ProjectCreateReq, ProjectFieldErrors } from '../../type/ProjectType.ts'

// 자주 쓰는 기술. 다른 프로젝트에 이미 넣은 기술과 합쳐서 추천 목록을 만든다.
const COMMON_STACKS = [
  'Spring Boot', 'Kotlin', 'Java', 'Django', 'Python', 'FastAPI', 'Node.js',
  'React', 'TypeScript', 'Vite', 'Flutter', 'Dart', 'Android', 'iOS',
  'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Docker', 'AWS',
]

// 대소문자만 다른 항목은 처음 것만 남긴다. 서버의 중복 정리와 같은 기준이다.
function uniqueIgnoreCase(items: string[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ProjectCreateReq>({ name: '', description: '', stack: [] })
  const [usedStacks, setUsedStacks] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    fetchProjects()
      .then((projects) => {
        if (!ignore) setUsedStacks(projects.flatMap((project) => project.stack))
      })
      // 추천 목록을 못 불러와도 등록은 할 수 있으니 오류를 보여 주지 않는다.
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  const stackOptions = uniqueIgnoreCase([...COMMON_STACKS, ...usedStacks])

  const update = <K extends keyof ProjectCreateReq>(field: K, value: ProjectCreateReq[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await createProject(form)
      navigate('/')
    } catch (e) {
      const data = axios.isAxiosError<ProjectFieldErrors>(e) && e.response?.status === 400 ? e.response.data : null
      if (data && (data.name || data.description || data.stack)) {
        setFieldErrors(data)
      } else {
        setError('프로젝트를 등록하지 못했습니다. 잠시 후 다시 시도하세요.')
      }
      setSubmitting(false)
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1">
          프로젝트 등록
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="이름"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name?.[0]}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          required
          autoFocus
        />
        <TextField
          label="설명"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          error={Boolean(fieldErrors.description)}
          helperText={fieldErrors.description?.[0]}
          multiline
          minRows={3}
        />
        <Autocomplete
          multiple
          freeSolo
          autoSelect
          filterSelectedOptions
          options={stackOptions}
          value={form.stack}
          onChange={(_, value) => update('stack', uniqueIgnoreCase(value.map((item) => item.trim()).filter(Boolean)))}
          renderInput={(params) => (
            <TextField
              {...params}
              label="기술 스택"
              error={Boolean(fieldErrors.stack)}
              helperText={fieldErrors.stack?.[0] ?? '입력하고 Enter를 누르거나 목록에서 고르세요.'}
            />
          )}
        />
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button component={RouterLink} to="/">
            취소
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? '등록 중…' : '등록'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
