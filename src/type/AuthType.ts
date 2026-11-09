export interface LoginReq {
  username: string
  password: string
}

export interface UserRes {
  id: number
  username: string
}

export interface ErrorRes {
  detail?: string
}
