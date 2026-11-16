import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { useAuth } from './context/AuthContext.ts'
import MainLayout from './layout/MainLayout.tsx'
import Login from './pages/auth/Login.tsx'
import ProjectCreate from './pages/project/ProjectCreate.tsx'
import ProjectDetail from './pages/project/ProjectDetail.tsx'
import ProjectList from './pages/project/ProjectList.tsx'
import TargetCreate from './pages/project/TargetCreate.tsx'
import TestAccounts from './pages/project/TestAccounts.tsx'
import ScanDetail from './pages/scan/ScanDetail.tsx'

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
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectCreate />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/targets/new" element={<TargetCreate />} />
          <Route path="/projects/:id/targets/:targetId/accounts" element={<TestAccounts />} />
          <Route path="/projects/:id/scans/:scanId" element={<ScanDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
