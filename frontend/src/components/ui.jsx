import { STAGE_COLORS } from '../utils'

export function StageBadge({ stage }) {
  return (
    <span className={`stage-badge stage-${stage}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STAGE_COLORS[stage], display: 'inline-block' }} />
      {stage}
    </span>
  )
}

export function Skeleton({ height = 20, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} />
}

export function EmptyState({ message = 'No data yet', icon }) {
  return (
    <div className="empty-state">
      {icon || <InboxIcon />}
      <p>{message}</p>
    </div>
  )
}

function InboxIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid #2a3350`,
      borderTop: `2px solid #4f8ef7`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  )
}
