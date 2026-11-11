import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import axios from 'axios'
import { useState, type SubmitEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { createProject } from '../../api/project/ProjectApi.ts'
import type { ProjectCreateReq, ProjectFieldErrors } from '../../type/ProjectType.ts'

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ProjectCreateReq>({ name: '', description: '', stack: '' })
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof ProjectCreateReq, value: string) => {
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
        <TextField
          label="기술 스택"
          value={form.stack}
          onChange={(e) => update('stack', e.target.value)}
          error={Boolean(fieldErrors.stack)}
          helperText={fieldErrors.stack?.[0] ?? '예: Spring Boot, React'}
          slotProps={{ htmlInput: { maxLength: 200 } }}
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
