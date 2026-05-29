import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate('/browse')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="brand-logo" style={{ width: 56, height: 56, fontSize: 28 }}>A</div>
        </div>

        <h1 className="login-title">ROI Extractor</h1>
        <p className="login-subtitle">Subject Matter Expert Portal</p>

        {error && (
          <div className="error-box" style={{ marginBottom: 16 }}>
            <div className="error-title">Sign-in Error</div>
            <div className="error-body">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="field-input"
              type="email"
              autoComplete="email"
              placeholder="you@anglepoint.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="field-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            className="btn-signin"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-sm" />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="login-hint">
          Demo: <code>demo@anglepoint.com</code> / <code>anglepoint2025</code>
        </p>
      </div>
    </div>
  )
}
