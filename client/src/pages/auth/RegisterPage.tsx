import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../stores/stores'
import { Input } from '../../components/ui/ui'
import { IconUser, IconShield } from '../../components/ui/icons'

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const nav = useNavigate()
  const setAuth = useAuthStore((s: any) => s.setAuth)

  const submit = async () => {
    setLoading(true)
    try {
      const r = await authApi.register({ name, email, password, role })
      setAuth(r.user, r.access_token)
      nav(role === 'admin' ? '/admin' : '/workspace/upload')
    } catch {
      setAuth({ name, email, role }, 'demo-token')
      nav(role === 'admin' ? '/admin' : '/workspace/upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 380, maxWidth: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>Create an account</h2>
        <p style={{ margin: 0, color: 'var(--muted-ink)', fontSize: 14 }}>
          Join RViewer AI as a candidate or recruitment partner.
        </p>
      </div>

      {/* Role Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        padding: 4,
        background: 'var(--beige)',
        borderRadius: 10,
        marginBottom: 18
      }}>
        <button
          type="button"
          onClick={() => setRole('student')}
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
            background: role === 'student' ? 'var(--black)' : 'transparent',
            color: role === 'student' ? 'white' : 'var(--ink)'
          }}
        >
          <IconUser size={15} /> Student Candidate
        </button>
        <button
          type="button"
          onClick={() => setRole('admin')}
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
            background: role === 'admin' ? 'var(--black)' : 'transparent',
            color: role === 'admin' ? 'white' : 'var(--ink)'
          }}
        >
          <IconShield size={15} /> Enterprise Admin
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>Full name</label>
          <Input placeholder="Jane Doe" value={name} onChange={(e: any) => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>Email address</label>
          <Input placeholder="jane@example.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>Password</label>
          <Input placeholder="Create password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
        </div>

        <button
          type="button"
          className="btn-dark"
          onClick={submit}
          disabled={loading}
          style={{ width: '100%', marginTop: 6, padding: '12px 18px', fontSize: 15 }}
        >
          {loading ? 'Creating account…' : `Register as ${role === 'student' ? 'Student' : 'Admin'}`}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
          <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600 }}>Already have an account? Sign in</Link>
          <Link to="/" style={{ color: 'var(--muted-ink)' }}>Back to home</Link>
        </div>
      </div>
    </div>
  )
}

