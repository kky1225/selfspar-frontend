import { Alert, AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.ts'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setError(null)
    try {
      // 성공하면 user가 비고, ProtectedRoute가 로그인 화면으로 보낸다.
      await logout()
    } catch {
      setError('로그아웃하지 못했습니다. 다시 시도하세요.')
    }
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            selfspar
          </Typography>
          <Typography sx={{ mr: 2 }}>{user?.username}</Typography>
          <Button color="inherit" onClick={handleLogout}>
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Outlet />
      </Box>
    </>
  )
}
