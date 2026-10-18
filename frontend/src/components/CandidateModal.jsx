import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { candidatesApi, jobsApi } from '../api'
import { SOURCES, getApiError } from '../utils'

const emptyForm = {
  name: '', email: '', phone: '', skills: '',
  experienceYears: '', source: '', resumeUrl: '', jobId: '',
}

export default function CandidateModal({ candidate, onClose, onSaved }) {
  const [form, setForm] = useState(candidate ? {
    name: candidate.name || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    skills: candidate.skills || '',
    experienceYears: candidate.experienceYears ?? '',
    source: candidate.source || '',
    resumeUrl: candidate.resumeUrl || '',
    jobId: candidate.jobId || '',
  } : emptyForm)

  const [jobs, setJobs] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    jobsApi.getAll().then(r => setJobs(r.data)).catch(() => {})
  }, [])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (form.experienceYears !== '' && isNaN(Number(form.experienceYears))) errs.experienceYears = 'Must be a number'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : null,
        jobId: form.jobId || null,
      }
      if (candidate) {
        await candidatesApi.update(candidate.id, payload)
        toast.success('Candidate updated')
      } else {
        await candidatesApi.create(payload)
        toast.success('Candidate added')
      }
      onSaved()
      onClose()
    } catch (err) {
      const msg = getApiError(err)
      const fieldErrs = err?.response?.data?.fieldErrors
      if (fieldErrs) setErrors(fieldErrs)
      else toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{candidate ? 'Edit Candidate' : 'Add Candidate'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <Field label="Full Name *" error={errors.name}>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="priya@example.com" />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Phone">
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" />
              </Field>
              <Field label="Experience (years)" error={errors.experienceYears}>
                <input type="number" min="0" max="40" value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} placeholder="3" />
              </Field>
            </div>
            <Field label="Skills">
              <input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Java, Spring Boot, React, MySQL" />
            </Field>
            <div className="form-row">
              <Field label="Source">
                <select value={form.source} onChange={e => set('source', e.target.value)}>
                  <option value="">Select source</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Job Opening">
                <select value={form.jobId} onChange={e => set('jobId', e.target.value)}>
                  <option value="">No job linked</option>
                  {jobs.filter(j => j.status === 'OPEN').map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Resume URL">
              <input value={form.resumeUrl} onChange={e => set('resumeUrl', e.target.value)} placeholder="https://drive.google.com/..." />
            </Field>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : candidate ? 'Update' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}
