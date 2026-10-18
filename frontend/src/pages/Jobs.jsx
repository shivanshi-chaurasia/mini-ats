import { useState } from 'react'
import toast from 'react-hot-toast'
import { jobsApi } from '../api'
import { useFetch } from '../hooks'
import { EmptyState, Skeleton } from '../components/ui'
import { formatDate, getApiError } from '../utils'

const emptyForm = { title: '', department: '', location: '', status: 'OPEN' }
const DEPTS = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'HR', 'Operations']
const LOCS = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Remote', 'Hybrid']

const STATUS_COLORS = { OPEN: '#22c55e', CLOSED: '#ef4444', DRAFT: '#f59e0b' }

export default function Jobs() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editJob, setEditJob] = useState(null)

  const { data: jobs, loading, reload } = useFetch(() => jobsApi.getAll(), [])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this job?')) return
    try {
      await jobsApi.delete(id)
      toast.success('Job deleted')
      reload()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  const handleClose = async (e, job) => {
    e.stopPropagation()
    try {
      await jobsApi.update(job.id, {
        title: job.title, department: job.department, location: job.location, status: 'CLOSED',
      })
      toast.success('Job closed')
      reload()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Job Openings</h2>
          <p>{jobs?.length || 0} jobs total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditJob(null); setModalOpen(true) }}>
          + New Job
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={140} style={{ borderRadius: 12 }} />)}
        </div>
      ) : !jobs?.length ? (
        <EmptyState message="No job openings yet. Create your first job." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>{job.title}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{job.department} · {job.location}</div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                  background: `${STATUS_COLORS[job.status]}20`, color: STATUS_COLORS[job.status],
                }}>
                  {job.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 14 }}>
                {job.candidateCount} candidates · Created {formatDate(job.createdAt)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditJob(job); setModalOpen(true) }}>Edit</button>
                {job.status !== 'CLOSED' && (
                  <button className="btn btn-ghost btn-sm" onClick={e => handleClose(e, job)}>Close</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, job.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <JobModal
          job={editJob}
          onClose={() => setModalOpen(false)}
          onSaved={reload}
          depts={DEPTS}
          locs={LOCS}
        />
      )}
    </div>
  )
}

function JobModal({ job, onClose, onSaved, depts, locs }) {
  const [form, setForm] = useState(job ? {
    title: job.title, department: job.department,
    location: job.location, status: job.status,
  } : emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Required'
    if (!form.department.trim()) errs.department = 'Required'
    if (!form.location.trim()) errs.location = 'Required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      if (job) {
        await jobsApi.update(job.id, form)
        toast.success('Job updated')
      } else {
        await jobsApi.create(form)
        toast.success('Job created')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{job ? 'Edit Job' : 'New Job Opening'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Job Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Senior Backend Engineer" />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Select</option>
                  {depts.map(d => <option key={d}>{d}</option>)}
                </select>
                {errors.department && <div className="form-error">{errors.department}</div>}
              </div>
              <div className="form-group">
                <label>Location *</label>
                <select value={form.location} onChange={e => set('location', e.target.value)}>
                  <option value="">Select</option>
                  {locs.map(l => <option key={l}>{l}</option>)}
                </select>
                {errors.location && <div className="form-error">{errors.location}</div>}
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : job ? 'Update' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
