import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { useAuth } from './context/AuthContext.ts'
import MainLayout from './layout/MainLayout.tsx'
import Login from './pages/auth/Login.tsx'
import Home from './pages/home/Home.tsx'

function App() {
  const { isInitialized } = useAuth()

  // 로그인 상태를 확인하기 전에는 어느 화면도 보여 주지 않는다.
  if (!isInitialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
