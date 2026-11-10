import axios from 'axios'

// 로그인이 끊겼는지 확인해 달라는 신호. AuthProvider가 받는다.
export const SESSION_CHECK_EVENT = 'session-check'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  // Django의 CSRF 쿠키·헤더 이름. axios는 같은 주소로 가는 요청에만 쿠키 값을 헤더에 넣는다.
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 403은 로그인이 끊긴 경우와 CSRF 검사 실패에 함께 쓰여서, 바로 로그아웃시키지 않고 확인을 요청한다.
    // 로그인 관련 API(/auth/)는 화면이 직접 처리한다.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 403 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      window.dispatchEvent(new Event(SESSION_CHECK_EVENT))
    }
    return Promise.reject(error)
  },
)

export default api
