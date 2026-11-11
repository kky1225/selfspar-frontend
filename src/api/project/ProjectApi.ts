import api from '../../axios.ts'
import type { ProjectCreateReq, ProjectRes } from '../../type/ProjectType.ts'

export const fetchProjects = async (): Promise<ProjectRes[]> => {
  const res = await api.get<ProjectRes[]>('/projects/')
  return res.data
}

export const createProject = async (req: ProjectCreateReq): Promise<ProjectRes> => {
  const res = await api.post<ProjectRes>('/projects/', req)
  return res.data
}
