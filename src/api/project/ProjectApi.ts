import api from '../../axios.ts'
import type { ProjectCreateReq, ProjectDetailRes, ProjectRes, TargetCreateReq, TargetRes } from '../../type/ProjectType.ts'

export const fetchProjects = async (): Promise<ProjectRes[]> => {
  const res = await api.get<ProjectRes[]>('/projects/')
  return res.data
}

export const createProject = async (req: ProjectCreateReq): Promise<ProjectRes> => {
  const res = await api.post<ProjectRes>('/projects/', req)
  return res.data
}

export const fetchProject = async (id: string): Promise<ProjectDetailRes> => {
  const res = await api.get<ProjectDetailRes>(`/projects/${id}/`)
  return res.data
}

export const createTarget = async (projectId: string, req: TargetCreateReq): Promise<TargetRes> => {
  const res = await api.post<TargetRes>(`/projects/${projectId}/targets/`, req)
  return res.data
}
