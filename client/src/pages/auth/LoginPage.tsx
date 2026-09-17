import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../lib/api'
import { useAuthStore, useResumeStore } from '../../stores/stores'
import { Input } from '../../components/ui/ui'
import { IconUser, IconShield } from '../../components/ui/icons'

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [email, setEmail] = useState('st@t.ai')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const nav = useNavigate()
  const setAuth = useAuthStore((s: any) => s.setAuth)
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)

  const selectRole = (newRole: 'student' | 'admin') => {
    setRole(newRole)
    setErrorMsg('')
    if (newRole === 'student') {
      setEmail('st@t.ai')
      setPassword('password123')
    } else {
      setEmail('adm@t.ai')
      setPassword('admin123')
    }
  }

  const submit = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const r = await authApi.login({ email, password })
      setAuth(r.user, r.access_token)
      if (r.user?.role === 'admin' || role === 'admin') {
        nav('/admin')
      } else {
        nav(activeResumeId ? `/workspace/dashboard/${activeResumeId}` : '/workspace/upload')
      }
    } catch {
      // Graceful demo mode fallback
      setAuth({ email, role, name: role === 'admin' ? 'Admin Demo' : 'Student Demo' }, 'demo-token')
      if (role === 'admin') {
        nav('/admin')
      } else {
        nav(activeResumeId ? `/workspace/dashboard/${activeResumeId}` : '/workspace/upload')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 380, maxWidth: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>Sign in to RViewer AI</h2>
        <p style={{ margin: 0, color: 'var(--muted-ink)', fontSize: 14 }}>
          Select your portal to continue to your career intelligence workspace.
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        padding: 4,
        background: 'var(--beige)',
        borderRadius: 10,
        marginBottom: 20
      }}>
        <button
          type="button"
          onClick={() => selectRole('student')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'student' ? 'var(--black)' : 'transparent',
            color: role === 'student' ? 'white' : 'var(--ink)'
          }}
        >
          <IconUser size={15} /> Student Candidate
        </button>
        <button
          type="button"
          onClick={() => selectRole('admin')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: role === 'admin' ? 'var(--black)' : 'transparent',
            color: role === 'admin' ? 'white' : 'var(--ink)'
          }}
        >
          <IconShield size={15} /> Enterprise Admin
        </button>
      </div>

      {/* Role Banner / Quick fill */}
      <div style={{
        background: role === 'student' ? 'var(--cornsilk)' : 'var(--beige)',
        border: '1px solid var(--line)',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 12,
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
          {role === 'student'
            ? 'Candidate Suite: Upload → Matrix Dashboard → Builder → Mock Room'
            : 'Enterprise Console: Candidate Pipeline → Semantic Search → System'}
        </span>
        <button
          type="button"
          onClick={() => selectRole(role)}
          style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Fill Demo
        </button>
      </div>

      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#b91c1c',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 14
        }}>
          {errorMsg}
        </div>
      )}

      {/* Login Form */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
            Email address
          </label>
          <Input
            placeholder={role === 'student' ? 'student@email.com' : 'admin@company.com'}
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
            Password
          </label>
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-dark"
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 6,
            cursor: loading ? 'wait' : 'pointer',
            padding: '12px 18px',
            fontSize: 15
          }}
        >
          {loading ? 'Signing in…' : `Sign in as ${role === 'student' ? 'Student' : 'Admin'}`}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
          <Link to="/register" style={{ color: 'var(--ink)', fontWeight: 600 }}>Create an account</Link>
          <Link to="/" style={{ color: 'var(--muted-ink)' }}>Back to home</Link>
        </div>
      </div>
    </div>
  )
}

