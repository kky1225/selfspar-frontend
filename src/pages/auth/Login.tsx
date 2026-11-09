import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import axios from 'axios'
import { useState, type SubmitEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.ts'
import type { ErrorRes } from '../../type/AuthType.ts'

// 400(틀림)·423(잠김)·429(너무 잦음)는 서버가 보낸 문구를 그대로 보여 준다.
function errorMessage(error: unknown) {
  if (axios.isAxiosError<ErrorRes>(error)) {
    if (!error.response) {
      return '서버에 연결할 수 없습니다.'
    }
    if (error.response.data?.detail) {
      return error.response.data.detail
    }
  }
  return '로그인하지 못했습니다. 잠시 후 다시 시도하세요.'
}

export default function Login() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // 성공하면 user가 채워지고, 위의 Navigate가 첫 화면으로 보낸다.
      await login({ username, password })
    } catch (e) {
      setError(errorMessage(e))
      setPassword('')
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <Paper sx={{ width: 360, p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="h1">
                selfspar
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                내 서비스 보안 점검
              </Typography>
            </Box>
            <TextField
              label="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
            <TextField
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? '로그인 중…' : '로그인'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
