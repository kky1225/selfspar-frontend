import api from '../../axios.ts'
import type { FindingRes } from '../../type/FindingType.ts'
import type { PageRes } from '../../type/PageType.ts'

// 모듈 실행 하나(결과 격자의 칸 하나)에서 찾은 발견 목록. 심각한 것부터 50건씩 온다.
export const fetchRunFindings = async (runId: number, page: number): Promise<PageRes<FindingRes>> => {
  const res = await api.get<PageRes<FindingRes>>(`/module-runs/${runId}/findings/`, { params: { page } })
  return res.data
}
