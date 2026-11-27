export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

// 해결됨(fixed)은 점검만 바꾼다. 다시 점검했는데 안 나오면 해결됨이 된다.
export type FindingStatus = 'open' | 'fixed' | 'false_positive' | 'risk_accepted'

// 사람이 고를 수 있는 상태
export type ManualFindingStatus = Exclude<FindingStatus, 'fixed'>

// 점검 칸 하나에서 찾은 발견. extra는 모듈마다 다르다.
// 시크릿 점검은 commit, date / 의존성 점검은 package, installed_version, fixed_version, url
export interface FindingRes {
  id: number
  rule_id: string
  title: string
  severity: FindingSeverity
  severity_label: string
  location: string
  // 비밀 값은 REDACTED로 가려진 상태로 온다.
  evidence: string
  extra: Record<string, string>
  status: FindingStatus
  status_label: string
  // 위험 수용을 이날까지 인정한다(YYYY-MM-DD). 위험 수용일 때만 있다.
  accepted_until: string | null
  // 위험 수용할 수 있는 최대 일수. 치명·높음처럼 위험 수용할 수 없으면 null이다.
  max_accept_days: number | null
  // 이 발견을 처음 본 점검 번호
  first_scan_id: number
  created_at: string
}

export interface FindingStatusReq {
  status: ManualFindingStatus
  // 사람이 바꿀 때는 반드시 적는다. 280자까지.
  reason: string
  // 위험 수용일 때만 보낸다.
  accepted_until?: string
}

// 서버의 검사 실패(400)는 칸마다 문구 목록으로 온다. 예: {"accepted_until": ["..."]}
export type FindingStatusFieldErrors = Partial<Record<keyof FindingStatusReq, string[]>> & { detail?: string }

// 발견의 상태가 바뀐 기록 한 줄
export interface FindingEventRes {
  id: number
  from_status: FindingStatus
  from_status_label: string
  to_status: FindingStatus
  to_status_label: string
  reason: string
  accepted_until: string | null
  // 사람이 바꿨으면 그 사람 이름. 점검이나 기한 만료로 바뀌었으면 null이다.
  username: string | null
  // 점검이 바꿨으면 그 점검 번호. 사람이 바꿨거나 기한 만료로 바뀌었으면 null이다.
  scan_id: number | null
  created_at: string
}
