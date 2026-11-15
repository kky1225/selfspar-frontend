import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useEffect, useState, type SubmitEvent } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { createTarget, fetchProject } from '../../api/project/ProjectApi.ts'
import type {
  ProjectDetailRes,
  TargetEnvironment,
  TargetFieldErrors,
  TargetKind,
} from '../../type/ProjectType.ts'
import { CONFIG_FIELDS, ENVIRONMENT_OPTIONS, KIND_OPTIONS } from '../../utils/targetConfig.ts'

export default function TargetCreate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectDetailRes | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<TargetKind>('repo')
  const [environment, setEnvironment] = useState<TargetEnvironment>('local')
  // 종류별 정보 칸의 입력값. 종류를 바꿔도 지우지 않고, 보낼 때 지금 종류의 칸만 골라 보낸다.
  const [config, setConfig] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<TargetFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let ignore = false
    fetchProject(id)
      .then((data) => {
        if (!ignore) setProject(data)
      })
      .catch((e) => {
        if (ignore) return
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setLoadError('프로젝트를 찾을 수 없습니다.')
        } else {
          setLoadError('프로젝트를 불러오지 못했습니다.')
        }
      })
    return () => {
      ignore = true
    }
  }, [id])

  const fields = CONFIG_FIELDS[kind]
  // config 오류가 칸별 객체가 아니라 목록이면(정보 전체가 잘못됨) 칸 아래에 붙일 수 없다.
  const configErrors = fieldErrors.config && !Array.isArray(fieldErrors.config) ? fieldErrors.config : {}

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) return
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await createTarget(id, {
        name,
        kind,
        environment,
        // 지금 종류의 칸만 보낸다. 고르는 칸은 고르지 않았으면 첫 번째 값을 보낸다.
        config: Object.fromEntries(
          fields.map((field) => [field.key, config[field.key] ?? field.choices?.[0].value ?? '']),
        ),
      })
      navigate(`/projects/${id}`)
    } catch (e) {
      const data = axios.isAxiosError<TargetFieldErrors>(e) && e.response?.status === 400 ? e.response.data : null
      if (data && (data.name || data.kind || data.environment || (data.config && !Array.isArray(data.config)))) {
        setFieldErrors(data)
      } else {
        setError('대상을 등록하지 못했습니다. 잠시 후 다시 시도하세요.')
      }
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error">{loadError}</Alert>
        <Button component={RouterLink} to="/">
          목록으로
        </Button>
      </Stack>
    )
  }

  if (project === null) {
    return <CircularProgress />
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 640 }}>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1">
          {project.name} / 점검 대상 추가
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl error={Boolean(fieldErrors.kind)}>
          <FormLabel sx={{ mb: 1 }}>종류</FormLabel>
          <ToggleButtonGroup
            value={kind}
            exclusive
            // 이미 고른 버튼을 다시 누르면 null이 온다. 종류는 항상 하나 골라 둔다.
            onChange={(_, value: TargetKind | null) => {
              if (value) setKind(value)
            }}
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            {KIND_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {fieldErrors.kind && <FormHelperText>{fieldErrors.kind[0]}</FormHelperText>}
        </FormControl>

        <TextField
          select
          label="환경"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as TargetEnvironment)}
          error={Boolean(fieldErrors.environment)}
          helperText={fieldErrors.environment?.[0]}
        >
          {ENVIRONMENT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name?.[0] ?? '예: 운영 API, 백엔드 코드'}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          required
        />

        <Typography variant="subtitle2" sx={{ color: 'text.secondary', pt: 1 }}>
          {KIND_OPTIONS.find((option) => option.value === kind)?.label} 정보
        </Typography>

        {fields.map((field) =>
          field.choices ? (
            <TextField
              key={field.key}
              select
              label={field.label}
              value={config[field.key] ?? field.choices[0].value}
              onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
              error={Boolean(configErrors[field.key])}
              helperText={configErrors[field.key]?.[0]}
              required={field.required}
            >
              {field.choices.map((choice) => (
                <MenuItem key={choice.value} value={choice.value}>
                  {choice.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              key={field.key}
              label={field.label}
              value={config[field.key] ?? ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
              error={Boolean(configErrors[field.key])}
              helperText={configErrors[field.key]?.[0] ?? (field.required ? undefined : '선택')}
              placeholder={field.placeholder}
              slotProps={{ inputLabel: { shrink: true } }}
              required={field.required}
            />
          ),
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button component={RouterLink} to={`/projects/${id}`}>
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
