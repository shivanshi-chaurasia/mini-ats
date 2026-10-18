import { useState } from 'react'
import toast from 'react-hot-toast'
import { candidatesApi, jobsApi } from '../api'
import { useDebounce, useFetch } from '../hooks'
import { StageBadge, Skeleton, EmptyState } from '../components/ui'
import CandidateModal from '../components/CandidateModal'
import CandidateDrawer from '../components/CandidateDrawer'
import { STAGES, SOURCES, formatDate, getApiError } from '../utils'

const PAGE_SIZE = 20

export default function Candidates() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ keyword: '', stage: '', jobId: '', source: '', minExp: '', maxExp: '' })
  const [sort, setSort] = useState({ by: 'createdAt', dir: 'desc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editCandidate, setEditCandidate] = useState(null)
  const [drawerCandidateId, setDrawerCandidateId] = useState(null)

  const debouncedKeyword = useDebounce(filters.keyword, 350)
  const { data: jobs } = useFetch(() => jobsApi.getAll(), [])

  const { data, loading, reload } = useFetch(() => candidatesApi.search({
    keyword: debouncedKeyword || undefined,
    stage: filters.stage || undefined,
    jobId: filters.jobId || undefined,
    source: filters.source || undefined,
    minExp: filters.minExp || undefined,
    maxExp: filters.maxExp || undefined,
    page, size: PAGE_SIZE, sortBy: sort.by, sortDir: sort.dir,
  }), [debouncedKeyword, filters.stage, filters.jobId, filters.source, filters.minExp, filters.maxExp, page, sort])

  const candidates = data?.content || []
  const total = data?.totalElements || 0
  const totalPages = data?.totalPages || 0

  const setFilter = (name, value) => {
    setFilters(f => ({ ...f, [name]: value }))
    setPage(0)
  }

  const handleSort = (field) => {
    if (!field) return
    setSort(s => s.by === field ? { by: field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { by: field, dir: 'asc' })
    setPage(0)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this candidate?')) return
    try {
      await candidatesApi.delete(id)
      toast.success('Candidate deleted')
      reload()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  const openEdit = (e, c) => {
    e.stopPropagation()
    setEditCandidate(c)
    setModalOpen(true)
  }

  const cols = [
    { label: 'Name', field: 'name' },
    { label: 'Email', field: 'email' },
    { label: 'Stage', field: 'currentStage' },
    { label: 'Job', field: null },
    { label: 'Experience', field: 'experienceYears' },
    { label: 'Source', field: 'source' },
    { label: 'Applied', field: 'createdAt' },
    { label: '', field: null },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Candidates</h2>
          <p>{total} total candidates</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditCandidate(null); setModalOpen(true) }}>
          + Add Candidate
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            value={filters.keyword}
            onChange={e => setFilter('keyword', e.target.value)}
            placeholder="Search name, email, skills..."
          />
        </div>
        <select className="filter-select" value={filters.stage} onChange={e => setFilter('stage', e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filters.jobId} onChange={e => setFilter('jobId', e.target.value)}>
          <option value="">All Jobs</option>
          {(jobs || []).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="filter-select" value={filters.source} onChange={e => setFilter('source', e.target.value)}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Min exp" min="0" value={filters.minExp}
          onChange={e => setFilter('minExp', e.target.value)} style={{ width: 90 }} />
        <input type="number" placeholder="Max exp" min="0" value={filters.maxExp}
          onChange={e => setFilter('maxExp', e.target.value)} style={{ width: 90 }} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={i} onClick={() => handleSort(c.field)} style={{ cursor: c.field ? 'pointer' : 'default' }}>
                  {c.label}
                  {c.field && sort.by === c.field && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {cols.map((_, j) => <td key={j}><Skeleton height={14} /></td>)}
                </tr>
              ))
            ) : !candidates.length ? (
              <tr><td colSpan={cols.length}><EmptyState message="No candidates match these filters" /></td></tr>
            ) : (
              candidates.map(c => (
                <tr key={c.id} onClick={() => setDrawerCandidateId(c.id)} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{c.email}</td>
                  <td><StageBadge stage={c.currentStage} /></td>
                  <td style={{ color: 'var(--text2)' }}>{c.jobTitle || '-'}</td>
                  <td>{c.experienceYears != null ? `${c.experienceYears} yr` : '-'}</td>
                  <td style={{ color: 'var(--text2)' }}>{c.source || '-'}</td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</td>
                  <td onClick={e => e.stopPropagation()} style={{ width: 80 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={e => openEdit(e, c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                return (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p + 1}
                  </button>
                )
              })}
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <CandidateModal
          candidate={editCandidate}
          onClose={() => setModalOpen(false)}
          onSaved={reload}
        />
      )}

      {drawerCandidateId && (
        <CandidateDrawer
          candidateId={drawerCandidateId}
          onClose={() => setDrawerCandidateId(null)}
          onStageChange={reload}
        />
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}
