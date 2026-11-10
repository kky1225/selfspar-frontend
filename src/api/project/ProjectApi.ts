import api from '../../axios.ts'
import type { ProjectRes } from '../../type/ProjectType.ts'

export const fetchProjects = async (): Promise<ProjectRes[]> => {
  const res = await api.get<ProjectRes[]>('/projects/')
  return res.data
}
