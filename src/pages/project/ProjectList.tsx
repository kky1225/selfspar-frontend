import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { fetchProjects } from '../../api/project/ProjectApi.ts'
import type { ProjectRes } from '../../type/ProjectType.ts'
import { formatDate } from '../../utils/formatDate.ts'

export default function ProjectList() {
  // null이면 아직 불러오는 중이다.
  const [projects, setProjects] = useState<ProjectRes[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 응답이 오기 전에 화면을 떠났으면 결과를 버린다.
    let ignore = false
    fetchProjects()
      .then((data) => {
        if (!ignore) setProjects(data)
      })
      .catch(() => {
        if (!ignore) setError('프로젝트 목록을 불러오지 못했습니다.')
      })
    return () => {
      ignore = true
    }
  }, [])

  let content
  if (error) {
    content = <Alert severity="error">{error}</Alert>
  } else if (projects === null) {
    content = <CircularProgress />
  } else if (projects.length === 0) {
    content = <Typography sx={{ color: 'text.secondary' }}>아직 등록한 프로젝트가 없습니다.</Typography>
  } else {
    content = (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell align="right">대상 수</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>기술 스택</TableCell>
              <TableCell>등록일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link component={RouterLink} to={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell align="right">{project.target_count}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {project.stack.map((item) => (
                      <Chip key={item} label={item} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{formatDate(project.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h1">
          프로젝트
        </Typography>
        <Button component={RouterLink} to="/projects/new" variant="contained">
          프로젝트 등록
        </Button>
      </Box>
      {content}
    </>
  )
}
