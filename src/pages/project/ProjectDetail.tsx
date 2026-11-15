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
import { configLabel, configValueLabel } from '../../utils/targetConfig.ts'

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" component="h2">
            점검 대상
          </Typography>
          <Button component={RouterLink} to={`/projects/${project.id}/targets/new`} variant="contained">
            대상 추가
          </Button>
        </Box>
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
                          {configLabel(key)}: {configValueLabel(key, value)}
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
