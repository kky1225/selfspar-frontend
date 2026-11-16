import type { TargetEnvironment, TargetKind } from './ProjectType.ts'

export type ScanStatus = 'queued' | 'running' | 'done'

export type ScanTaskStatus = 'queued' | 'running' | 'passed' | 'found' | 'failed'

// 프로젝트 상세의 최근 점검 목록 한 줄
export interface ScanSummaryRes {
  id: number
  status: ScanStatus
  status_label: string
  created_at: string
  finished_at: string | null
  task_count: number
  finished_task_count: number
  found_count: number
  failed_count: number
}

export interface ScanModuleRes {
  key: string
  label: string
}

export interface ScanTargetRes {
  id: number
  name: string
  kind: TargetKind
  kind_label: string
  environment: TargetEnvironment
  environment_label: string
}

// 결과 격자의 칸 하나. target은 대상 번호다.
export interface ScanTaskRes {
  id: number
  target: number
  module: string
  status: ScanTaskStatus
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
  status: ScanStatus
  status_label: string
  created_at: string
  finished_at: string | null
  modules: ScanModuleRes[]
  targets: ScanTargetRes[]
  tasks: ScanTaskRes[]
}
