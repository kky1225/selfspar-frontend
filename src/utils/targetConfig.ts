import type { TargetEnvironment, TargetKind } from '../type/ProjectType.ts'

// 서버 모델(Target.Kind, Target.Environment)과 같은 순서·이름이다.
export const KIND_OPTIONS: { value: TargetKind; label: string }[] = [
  { value: 'repo', label: '저장소' },
  { value: 'domain', label: '도메인' },
  { value: 'api', label: 'API' },
  { value: 'apk', label: 'APK' },
  { value: 'cloud', label: '클라우드 계정' },
]

export const ENVIRONMENT_OPTIONS: { value: TargetEnvironment; label: string }[] = [
  { value: 'local', label: '로컬' },
  { value: 'staging', label: '스테이징' },
  { value: 'prod', label: '운영' },
]

export interface ConfigField {
  key: string
  label: string
  required: boolean
  placeholder?: string
  // 정해진 값 중에서 고르는 칸이면 고를 수 있는 값. 첫 번째가 기본값이다.
  choices?: { value: string; label: string }[]
}

// 종류마다 입력받는 정보 칸. 서버 serializers.py의 종류별 Config serializer와 같은 칸이다.
export const CONFIG_FIELDS: Record<TargetKind, ConfigField[]> = {
  repo: [{ key: 'path', label: '저장소 경로', required: true, placeholder: '/Users/me/project' }],
  domain: [{ key: 'url', label: '주소', required: true, placeholder: 'https://example.com' }],
  api: [
    { key: 'base_url', label: 'API 기본 주소', required: true, placeholder: 'http://localhost:8080' },
    { key: 'swagger_url', label: 'Swagger 문서 주소', required: false, placeholder: 'http://localhost:8080/v3/api-docs' },
    { key: 'login_path', label: '로그인 경로', required: false, placeholder: '/api/auth/login' },
    {
      key: 'token_location',
      label: '토큰 위치',
      required: true,
      choices: [
        { value: 'header', label: 'Authorization 헤더' },
        { value: 'cookie', label: '쿠키' },
      ],
    },
  ],
  apk: [{ key: 'path', label: 'APK 파일 경로', required: true, placeholder: '/Users/me/app-release.apk' }],
  cloud: [
    { key: 'account_id', label: 'AWS 계정 번호', required: true, placeholder: '123456789012' },
    { key: 'region', label: '리전', required: true, placeholder: 'ap-northeast-2' },
  ],
}

const ALL_CONFIG_FIELDS = Object.values(CONFIG_FIELDS).flat()

// 칸 이름(path)을 화면용 이름으로 바꾼다. 저장소와 APK는 같은 path 칸이라 '경로'로 묶는다.
export function configLabel(key: string) {
  if (key === 'path') return '경로'
  return ALL_CONFIG_FIELDS.find((field) => field.key === key)?.label ?? key
}

// 고르는 칸의 저장값(cookie)을 화면용 이름(쿠키)으로 바꾼다.
export function configValueLabel(key: string, value: string) {
  const field = ALL_CONFIG_FIELDS.find((item) => item.key === key)
  return field?.choices?.find((choice) => choice.value === value)?.label ?? value
}
