import { createContext, useContext } from 'react'
import type { LoginReq, UserRes } from '../type/AuthType.ts'

export interface AuthContextValue {
  user: UserRes | null
  isInitialized: boolean
  login: (req: LoginReq) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
