import api from '../../axios.ts'
import type { TestAccountCreateReq, TestAccountRes } from '../../type/ProjectType.ts'

export const fetchAccounts = async (targetId: string): Promise<TestAccountRes[]> => {
  const res = await api.get<TestAccountRes[]>(`/targets/${targetId}/accounts/`)
  return res.data
}

export const createAccount = async (targetId: string, req: TestAccountCreateReq): Promise<TestAccountRes> => {
  const res = await api.post<TestAccountRes>(`/targets/${targetId}/accounts/`, req)
  return res.data
}

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/accounts/${id}/`)
}
