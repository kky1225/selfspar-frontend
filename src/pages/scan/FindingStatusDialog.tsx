import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useState, type SubmitEvent } from 'react'
import { changeFindingStatus } from '../../api/finding/FindingApi.ts'
import type { FindingRes, FindingStatusFieldErrors, ManualFindingStatus } from '../../type/FindingType.ts'
import { dateAfterDays } from '../../utils/formatDate.ts'

const REASON_MAX = 280

const OPTIONS: { value: ManualFindingStatus; label: string; help: string }[] = [
  { value: 'open', label: '미해결', help: '다시 판단이 필요해서 되돌린다.' },
  { value: 'false_positive', label: '오탐', help: '실제로는 문제가 아니다. 다시 나와도 오탐으로 둔다.' },
  { value: 'risk_accepted', label: '위험 수용', help: '알고 있지만 기한까지 고치지 않고 둔다. 기한이 지나면 미해결로 돌아온다.' },
]

interface Props {
  finding: FindingRes
  onClose: () => void
  // 바꾸기에 성공하면 서버가 돌려준 바뀐 발견을 넘긴다.
  onChanged: (finding: FindingRes) => void
  // 창을 연 사이 점검이 이 발견을 해결됨으로 바꿔서 서버가 거절했을 때(409). 목록의 그 줄을 해결됨으로 맞춘다.
  onFixedMeanwhile: (findingId: number) => void
}

// 사람이 발견 상태를 바꾸는 창. 해결됨은 고를 수 없다(다시 점검해서 안 나와야 해결됨이 된다).
// 기간·사유 검사는 서버가 최종으로 한다. 여기서는 고를 수 없는 값을 미리 막아 둘 뿐이다.
export default function FindingStatusDialog({ finding, onClose, onChanged, onFixedMeanwhile }: Props) {
  const canAcceptRisk = finding.max_accept_days !== null
  const [status, setStatus] = useState<ManualFindingStatus | ''>('')
  // 이미 위험 수용 중이면 지금 만료일에서 시작한다(기한 연장).
  const [acceptedUntil, setAcceptedUntil] = useState(finding.accepted_until ?? '')
  const [reason, setReason] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FindingStatusFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 지금 상태와 같은 것은 고를 수 없다. 위험 수용만 예외로, 다시 고르면 기한 연장이다.
  const isDisabled = (value: ManualFindingStatus) =>
    (value === finding.status && value !== 'risk_accepted') || (value === 'risk_accepted' && !canAcceptRisk)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!status) return
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const updated = await changeFindingStatus(finding.id, {
        status,
        reason,
        ...(status === 'risk_accepted' ? { accepted_until: acceptedUntil } : {}),
      })
      onChanged(updated)
    } catch (e) {
      const response = axios.isAxiosError<FindingStatusFieldErrors>(e) ? e.response : undefined
      const data = response?.data
      if (response?.status === 400 && data && (data.status || data.reason || data.accepted_until)) {
        setFieldErrors(data)
      } else if (response?.status === 409 && data?.detail) {
        // 창을 연 사이 점검이 해결됨으로 바꿨다. 목록도 그 상태로 맞춘다.
        setFormError(data.detail)
        onFixedMeanwhile(finding.id)
      } else if (response?.status === 404) {
        setFormError('이 발견이 지워졌습니다. 점검 결과를 다시 열어 보세요.')
      } else {
        setFormError('상태를 바꾸지 못했습니다. 잠시 후 다시 시도하세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // 보내는 중에는 닫지 못하게 한다. 닫고 다른 발견의 창을 연 뒤에 앞의 응답이 오면 화면이 엉킨다.
    <Dialog open onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          상태 바꾸기
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {finding.severity_label} · {finding.title} · 지금 {finding.status_label}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <FormControl error={Boolean(fieldErrors.status)}>
              <FormLabel id="finding-status-label">바꿀 상태</FormLabel>
              <RadioGroup
                aria-labelledby="finding-status-label"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ManualFindingStatus)
                  // 사유 칸의 오류는 그대로 둔다.
                  setFieldErrors((prev) => ({ ...prev, status: undefined, accepted_until: undefined }))
                }}
              >
                {OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    disabled={isDisabled(option.value)}
                    control={<Radio />}
                    label={
                      <>
                        {option.label}
                        {option.value === 'risk_accepted' && finding.status === 'risk_accepted' && ' (기한 연장)'}
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {option.value === 'risk_accepted' && !canAcceptRisk
                            ? `${finding.severity_label} 발견은 위험 수용할 수 없습니다. 고쳐야 합니다.`
                            : option.help}
                        </Typography>
                      </>
                    }
                  />
                ))}
              </RadioGroup>
              {fieldErrors.status && <FormHelperText>{fieldErrors.status[0]}</FormHelperText>}
            </FormControl>

            {status === 'risk_accepted' && finding.max_accept_days !== null && (
              // 만료일 당일까지 인정한다. 내일부터 최대 기간까지만 고를 수 있다.
              <TextField
                label="만료일"
                type="date"
                value={acceptedUntil}
                onChange={(e) => {
                  setAcceptedUntil(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, accepted_until: undefined }))
                }}
                error={Boolean(fieldErrors.accepted_until)}
                helperText={fieldErrors.accepted_until?.[0] ?? `최대 ${finding.max_accept_days}일까지 고를 수 있습니다.`}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: dateAfterDays(1), max: dateAfterDays(finding.max_accept_days) },
                }}
                required
              />
            )}

            <TextField
              label="사유"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setFieldErrors((prev) => ({ ...prev, reason: undefined }))
              }}
              error={Boolean(fieldErrors.reason)}
              helperText={fieldErrors.reason?.[0] ?? `${reason.length}/${REASON_MAX}`}
              slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
              multiline
              minRows={2}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button type="submit" variant="contained" disabled={!status || submitting}>
            바꾸기
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
