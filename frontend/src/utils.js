export const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']

export const STAGE_COLORS = {
  APPLIED:   '#4f8ef7',
  SCREENING: '#f59e0b',
  INTERVIEW: '#a855f7',
  OFFER:     '#14b8a6',
  HIRED:     '#22c55e',
  REJECTED:  '#ef4444',
}

export const SOURCES = ['LinkedIn', 'Referral', 'Job Board', 'Company Website', 'Naukri', 'Campus', 'Other']

// the API returns UTC timestamps without an offset
const parseUtc = (iso) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)

export function formatDate(iso) {
  if (!iso) return '-'
  return parseUtc(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '-'
  return parseUtc(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function getApiError(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong'
}

export const NEXT_STAGE = {
  APPLIED:   'SCREENING',
  SCREENING: 'INTERVIEW',
  INTERVIEW: 'OFFER',
  OFFER:     'HIRED',
}
