import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  // Django의 CSRF 쿠키·헤더 이름. axios는 같은 주소로 가는 요청에만 쿠키 값을 헤더에 넣는다.
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

export default api
