import api from '../../axios.ts'
import type { FindingRes } from '../../type/FindingType.ts'

// 모듈 실행 하나(결과 격자의 칸 하나)에서 찾은 발견 목록
export const fetchRunFindings = async (runId: number): Promise<FindingRes[]> => {
  const res = await api.get<FindingRes[]>(`/module-runs/${runId}/findings/`)
  return res.data
}
