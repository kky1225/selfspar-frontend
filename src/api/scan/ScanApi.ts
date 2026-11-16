import api from '../../axios.ts'
import type { ScanDetailRes, ScanSummaryRes } from '../../type/ScanType.ts'

export const fetchScans = async (projectId: string): Promise<ScanSummaryRes[]> => {
  const res = await api.get<ScanSummaryRes[]>(`/projects/${projectId}/scans/`)
  return res.data
}

// 전체 점검을 시작한다. 서버는 점검을 만들어 worker에 넘기고 바로 응답한다.
export const startScan = async (projectId: string): Promise<ScanDetailRes> => {
  const res = await api.post<ScanDetailRes>(`/projects/${projectId}/scans/`)
  return res.data
}

export const fetchScan = async (id: string): Promise<ScanDetailRes> => {
  const res = await api.get<ScanDetailRes>(`/scans/${id}/`)
  return res.data
}
