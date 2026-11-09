import { useEffect, useState, type ReactNode } from 'react'
import * as AuthApi from '../api/auth/AuthApi.ts'
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
