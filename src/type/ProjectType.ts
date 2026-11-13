export interface ProjectRes {
  id: number
  name: string
  description: string
  stack: string[]
  target_count: number
  created_at: string
}

export interface ProjectCreateReq {
  name: string
  description: string
  stack: string[]
}

// 400 응답: 칸 이름마다 오류 문구 목록. 예: { name: ['같은 이름의 프로젝트가 이미 있습니다.'] }
export type ProjectFieldErrors = Partial<Record<keyof ProjectCreateReq, string[]>>

export type TargetKind = 'repo' | 'domain' | 'api' | 'apk' | 'cloud'
export type TargetEnvironment = 'local' | 'staging' | 'prod'

export interface TargetRes {
  id: number
  name: string
  kind: TargetKind
  kind_label: string
  environment: TargetEnvironment
  environment_label: string
  // 종류마다 담긴 칸이 다르다. 예: 저장소는 { path }, API는 { base_url, token_location, ... }
  config: Record<string, string>
  created_at: string
}

export interface ProjectDetailRes {
  id: number
  name: string
  description: string
  stack: string[]
  targets: TargetRes[]
  created_at: string
}
