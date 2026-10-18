import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { candidatesApi } from '../api'
import { StageBadge, Skeleton, EmptyState } from './ui'
import { formatDate, formatDateTime, getApiError, STAGE_COLORS, NEXT_STAGE } from '../utils'

export default function CandidateDrawer({ candidateId, onClose, onStageChange }) {
  const [candidate, setCandidate] = useState(null)
  const [history, setHistory] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [movingStage, setMovingStage] = useState(false)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    if (!candidateId) return
    setLoading(true)
    Promise.all([
      candidatesApi.getById(candidateId),
      candidatesApi.getHistory(candidateId),
      candidatesApi.getNotes(candidateId),
    ]).then(([c, h, n]) => {
      setCandidate(c.data)
      setHistory(h.data)
      setNotes(n.data)
    }).catch(() => toast.error('Failed to load candidate'))
      .finally(() => setLoading(false))
  }, [candidateId])

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const r = await candidatesApi.addNote(candidateId, { content: noteText, createdBy: 'Recruiter' })
      setNotes(prev => [r.data, ...prev])
      setNoteText('')
      toast.success('Note added')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setAddingNote(false)
    }
  }

  const handleMoveStage = async (targetStage) => {
    if (movingStage) return
    setMovingStage(true)
    try {
      const r = await candidatesApi.moveStage(candidateId, { targetStage, changedBy: 'Recruiter' })
      setCandidate(r.data)
      const hRes = await candidatesApi.getHistory(candidateId)
      setHistory(hRes.data)
      toast.success(`Moved to ${targetStage}`)
      onStageChange?.(r.data)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setMovingStage(false)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          {loading ? (
            <Skeleton height={24} width={180} />
          ) : (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{candidate?.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{candidate?.email}</div>
              {candidate && <StageBadge stage={candidate.currentStage} />}
            </div>
          )}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 2, padding: '10px 24px 0', borderBottom: '1px solid var(--border)' }}>
          {['info', 'history', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px',
              background: 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              fontSize: '0.85rem',
              fontWeight: tab === t ? 600 : 400,
              marginBottom: -1,
              transition: 'color 0.15s',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {loading ? <DrawerSkeleton /> : (
            <>
              {tab === 'info' && candidate && <InfoTab candidate={candidate} onMoveStage={handleMoveStage} movingStage={movingStage} />}
              {tab === 'history' && <HistoryTab history={history} />}
              {tab === 'notes' && (
                <NotesTab
                  notes={notes} noteText={noteText}
                  setNoteText={setNoteText}
                  onAdd={handleAddNote} adding={addingNote}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function InfoTab({ candidate, onMoveStage, movingStage }) {
  const next = NEXT_STAGE[candidate.currentStage]
  const canReject = !['HIRED', 'REJECTED'].includes(candidate.currentStage)

  return (
    <div>
      <InfoRow label="Job" value={candidate.jobTitle || 'No job linked'} />
      <InfoRow label="Phone" value={candidate.phone || '-'} />
      <InfoRow label="Experience" value={candidate.experienceYears != null ? `${candidate.experienceYears} years` : '-'} />
      <InfoRow label="Source" value={candidate.source || '-'} />
      <InfoRow label="Skills" value={candidate.skills || '-'} />
      {/^https?:\/\//i.test(candidate.resumeUrl || '') && (
        <InfoRow label="Resume" value={
          <a href={candidate.resumeUrl} target="_blank" rel="noreferrer"
             style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>View Resume ↗</a>
        } />
      )}
      <InfoRow label="Applied" value={formatDate(candidate.createdAt)} />

      {(next || canReject) && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Move Stage</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {next && (
              <button className="btn btn-primary btn-sm" onClick={() => onMoveStage(next)} disabled={movingStage}>
                → {next}
              </button>
            )}
            {canReject && (
              <button className="btn btn-danger btn-sm" onClick={() => onMoveStage('REJECTED')} disabled={movingStage}>
                Reject
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 500, minWidth: 90, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text)', flex: 1 }}>{value}</span>
    </div>
  )
}

function HistoryTab({ history }) {
  if (!history.length) return <EmptyState message="No stage changes recorded" />
  return (
    <div className="timeline">
      {history.map(h => (
        <div key={h.id} className="timeline-item">
          <div className="timeline-dot" style={{ background: STAGE_COLORS[h.toStage] }} />
          <div className="timeline-time">{formatDateTime(h.changedAt)}</div>
          <div className="timeline-label">
            {h.fromStage ? `${h.fromStage} → ${h.toStage}` : `Added as ${h.toStage}`}
          </div>
          {h.changedBy && <div className="timeline-sub">by {h.changedBy}</div>}
        </div>
      ))}
    </div>
  )
}

function NotesTab({ notes, noteText, setNoteText, onAdd, adding }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <textarea
          rows={3}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add a recruiter note…"
          style={{ resize: 'vertical' }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={onAdd}
          disabled={adding || !noteText.trim()}
          style={{ marginTop: 8 }}
        >
          {adding ? 'Adding…' : 'Add Note'}
        </button>
      </div>
      {!notes.length && <EmptyState message="No notes yet" />}
      {notes.map(n => (
        <div key={n.id} className="note-item">
          <div style={{ fontSize: '0.875rem' }}>{n.content}</div>
          <div className="note-meta">{formatDateTime(n.createdAt)}{n.createdBy ? ` · ${n.createdBy}` : ''}</div>
        </div>
      ))}
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={18} />)}
    </div>
  )
}
