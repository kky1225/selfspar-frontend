export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

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
  // 이 발견을 처음 본 점검 번호
  first_scan_id: number
  created_at: string
}
