import api from '../../axios.ts'
import type { LoginReq, UserRes } from '../../type/AuthType.ts'

export const fetchCsrf = async (): Promise<void> => {
  await api.get('/auth/csrf/')
}

export const login = async (req: LoginReq): Promise<UserRes> => {
  const res = await api.post<UserRes>('/auth/login/', req)
  return res.data
}

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout/')
}

export const fetchMe = async (): Promise<UserRes> => {
  const res = await api.get<UserRes>('/auth/me/')
  return res.data
}
