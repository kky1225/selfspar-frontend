import type { TargetEnvironment, TargetKind } from './ProjectType.ts'

export type ScanStatus = 'queued' | 'running' | 'done'

export type ModuleRunStatus = 'queued' | 'running' | 'passed' | 'found' | 'failed'

// 프로젝트 상세의 최근 점검 목록 한 줄
export interface ScanSummaryRes {
  id: number
  // 재점검이면 다시 돌린 지난 점검 번호, 전체 점검이면 null
  source_scan: number | null
  status: ScanStatus
  status_label: string
  created_at: string
  finished_at: string | null
  run_count: number
  finished_run_count: number
  // 발견 건수 합계(칸 수가 아니다)
  finding_count: number
  failed_count: number
}

export interface ScanModuleRes {
  key: string
  label: string
  // 이 모듈을 실행하는 대상 종류. 여기에 없는 종류의 대상은 '해당 없음'이다.
  kinds: TargetKind[]
}

export interface ScanTargetRes {
  id: number
  name: string
  kind: TargetKind
  kind_label: string
  environment: TargetEnvironment
  environment_label: string
}

// 모듈 실행 하나(결과 격자의 칸 하나). target은 대상 번호다.
export interface ModuleRunRes {
  id: number
  target: number
  module: string
  status: ModuleRunStatus
  status_label: string
  finding_count: number
  tool_version: string
  error_message: string
  started_at: string | null
  finished_at: string | null
}

export interface ScanDetailRes {
  id: number
  project: { id: number; name: string }
  source_scan: number | null
  status: ScanStatus
  status_label: string
  created_at: string
  finished_at: string | null
  modules: ScanModuleRes[]
  targets: ScanTargetRes[]
  runs: ModuleRunRes[]
}

// 재점검 요청. 지난 점검에서 다시 돌릴 칸(모듈 실행) 번호들
export interface RescanReq {
  source_scan: number
  run_ids: number[]
}
