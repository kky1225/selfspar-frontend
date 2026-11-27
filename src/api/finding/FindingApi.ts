import api from '../../axios.ts'
import type { FindingEventRes, FindingRes, FindingStatusReq } from '../../type/FindingType.ts'
import type { PageRes } from '../../type/PageType.ts'

// 모듈 실행 하나(결과 격자의 칸 하나)에서 찾은 발견 목록. 심각한 것부터 50건씩 온다.
export const fetchRunFindings = async (runId: number, page: number): Promise<PageRes<FindingRes>> => {
  const res = await api.get<PageRes<FindingRes>>(`/module-runs/${runId}/findings/`, { params: { page } })
  return res.data
}

// 사람이 발견의 상태를 바꾼다(미해결·오탐·위험 수용). 바뀐 발견을 돌려준다.
export const changeFindingStatus = async (findingId: number, body: FindingStatusReq): Promise<FindingRes> => {
  const res = await api.post<FindingRes>(`/findings/${findingId}/status/`, body)
  return res.data
}

// 발견 하나의 상태 이력. 최근 것부터 온다.
export const fetchFindingEvents = async (findingId: number): Promise<FindingEventRes[]> => {
  const res = await api.get<FindingEventRes[]>(`/findings/${findingId}/events/`)
  return res.data
}
