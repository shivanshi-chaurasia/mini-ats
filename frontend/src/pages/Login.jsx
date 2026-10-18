import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { getApiError } from '../utils'

const HIGHLIGHTS = [
  'Drag-and-drop hiring pipeline',
  'Searchable candidate database',
  'Hiring metrics at a glance',
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password')
      return
    }
    setBusy(true)
    setError('')
    try {
      await login(form.email.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.status === 401 ? 'Incorrect email or password' : getApiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <h1>Mini ATS</h1>
        <p className="login-tagline">Hire faster. Stay organised.</p>
        <ul>
          {HIGHLIGHTS.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to your recruiting workspace</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" autoFocus
            placeholder="you@company.com" value={form.email} onChange={update('email')} />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              placeholder="Enter your password" value={form.password} onChange={update('password')} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="login-foot">Need an account? Ask your administrator.</p>
        </form>
      </section>
    </div>
  )
}
