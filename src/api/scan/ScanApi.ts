import api from '../../axios.ts'
import type { RescanReq, ScanDetailRes, ScanSummaryRes } from '../../type/ScanType.ts'

export const fetchScans = async (projectId: string): Promise<ScanSummaryRes[]> => {
  const res = await api.get<ScanSummaryRes[]>(`/projects/${projectId}/scans/`)
  return res.data
}

// 전체 점검을 시작한다. 서버는 점검을 만들어 worker에 넘기고 바로 응답한다.
export const startScan = async (projectId: string): Promise<ScanDetailRes> => {
  const res = await api.post<ScanDetailRes>(`/projects/${projectId}/scans/`)
  return res.data
}

// 지난 점검에서 고른 칸만 새 점검으로 다시 돌린다. 지난 점검의 결과는 그대로 남는다.
export const startRescan = async (projectId: string, req: RescanReq): Promise<ScanDetailRes> => {
  const res = await api.post<ScanDetailRes>(`/projects/${projectId}/scans/`, req)
  return res.data
}

// 대기 중이거나 실행 중인 점검을 취소한다. 서버는 상태만 바꾸고 바로 응답하고, worker가 도구를 멈춘다.
export const cancelScan = async (id: number): Promise<ScanDetailRes> => {
  const res = await api.post<ScanDetailRes>(`/scans/${id}/cancel/`)
  return res.data
}

export const fetchScan = async (id: string): Promise<ScanDetailRes> => {
  const res = await api.get<ScanDetailRes>(`/scans/${id}/`)
  return res.data
}
