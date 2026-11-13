import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { fetchProject } from '../../api/project/ProjectApi.ts'
import type { ProjectDetailRes } from '../../type/ProjectType.ts'
import { formatDate } from '../../utils/formatDate.ts'

// 대상 종류별 정보(config) 칸 이름. 목록에 없는 칸은 저장된 이름 그대로 보여 준다.
const CONFIG_LABELS: Record<string, string> = {
  path: '경로',
  url: '주소',
  base_url: 'API 기본 주소',
  swagger_url: 'Swagger 문서 주소',
  login_path: '로그인 경로',
  token_location: '토큰 위치',
  account_id: 'AWS 계정 번호',
  region: '리전',
}

// 정해진 값 중에서 고르는 칸은 저장된 값 대신 등록 화면에서 고른 이름으로 보여 준다.
const CONFIG_VALUE_LABELS: Record<string, Record<string, string>> = {
  token_location: { header: 'Authorization 헤더', cookie: '쿠키' },
}

function configValue(key: string, value: string) {
  return CONFIG_VALUE_LABELS[key]?.[value] ?? value
}

export default function ProjectDetail() {
  // 주소 /projects/:id 의 id 부분. 주소에서 꺼낸 값이라 글자다.
  const { id } = useParams()
  // null이면 아직 불러오는 중이다.
  const [project, setProject] = useState<ProjectDetailRes | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          setError('프로젝트를 찾을 수 없습니다.')
        } else {
          setError('프로젝트를 불러오지 못했습니다.')
        }
      })
    return () => {
      ignore = true
    }
  }, [id])

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error">{error}</Alert>
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
    <Stack spacing={3}>
      <Box>
        <Button component={RouterLink} to="/" sx={{ mb: 1 }}>
          ← 목록으로
        </Button>
        <Typography variant="h5" component="h1">
          {project.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          등록일 {formatDate(project.created_at)}
        </Typography>
      </Box>

      {project.description && <Typography sx={{ whiteSpace: 'pre-line' }}>{project.description}</Typography>}

      {project.stack.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {project.stack.map((item) => (
            <Chip key={item} label={item} size="small" />
          ))}
        </Box>
      )}

      <Box>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          점검 대상
        </Typography>
        {project.targets.length === 0 ? (
          <Typography sx={{ color: 'text.secondary' }}>아직 등록한 점검 대상이 없습니다.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>종류</TableCell>
                  <TableCell>환경</TableCell>
                  <TableCell>정보</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>{target.name}</TableCell>
                    <TableCell>{target.kind_label}</TableCell>
                    <TableCell>{target.environment_label}</TableCell>
                    <TableCell>
                      {Object.entries(target.config).map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {CONFIG_LABELS[key] ?? key}: {configValue(key, value)}
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  )
}
