import axios from 'axios'
import { useEffect, useState, type ReactNode } from 'react'
import * as AuthApi from '../api/auth/AuthApi.ts'
import { SESSION_CHECK_EVENT } from '../axios.ts'
import type { LoginReq, UserRes } from '../type/AuthType.ts'
import { AuthContext } from './AuthContext.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRes | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await AuthApi.fetchCsrf()
        setUser(await AuthApi.fetchMe())
      } catch {
        // 로그인하지 않았으면 내 정보 조회가 403으로 실패한다.
        setUser(null)
      } finally {
        setIsInitialized(true)
      }
    }
    void init()
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        await AuthApi.fetchMe()
      } catch (error) {
        // 내 정보도 403이면 로그인이 끊긴 것이다. 서버에 닿지 못한 경우는 로그인 상태를 바꾸지 않는다.
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setUser(null)
        }
      }
    }
    const handleSessionCheck = () => {
      void checkSession()
    }
    window.addEventListener(SESSION_CHECK_EVENT, handleSessionCheck)
    return () => window.removeEventListener(SESSION_CHECK_EVENT, handleSessionCheck)
  }, [])

  const login = async (req: LoginReq) => {
    setUser(await AuthApi.login(req))
  }

  const logout = async () => {
    await AuthApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
