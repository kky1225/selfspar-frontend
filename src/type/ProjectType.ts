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
