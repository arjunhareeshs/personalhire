import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { interviewApi } from '../../lib/api'
import { useResumeStore } from '../../stores/stores'
import {
  IconMic,
  IconCheckCircle,
  IconAlertTriangle,
  IconResume,
  IconDashboard,
  IconArrowRight,
  IconChevronRight
} from '../../components/ui/icons'

export default function InterviewLobbyPage() {
  const nav = useNavigate()
  const resumeId = useResumeStore((s: any) => s.activeResumeId)
  const [role, setRole] = useState('Full Stack Developer')
  const [dur, setDur] = useState(10)
  const [starting, setStarting] = useState(false)

  const start = async () => {
    setStarting(true)
    try {
      const r = await interviewApi.start({ resume_id: resumeId, target_role: role, duration_minutes: dur })
      nav(`/workspace/interview/${r.room_name}`)
    } catch {
      nav(`/workspace/interview/demo-${Date.now()}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="chip" style={{ background: 'var(--tea-green)', color: '#14532d' }}>
              <IconMic size={13} />
              <span>Real-Time Voice AI</span>
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>
              Resume-Grounded Spoken Assessment
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
            AI Mock Interview Chamber
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {resumeId && (
            <>
              <Link
                to={`/workspace/dashboard/${resumeId}`}
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: 13 }}
              >
                <IconDashboard size={14} />
                <span>Dashboard</span>
              </Link>
              <Link
                to={`/workspace/builder/${resumeId}`}
                className="btn-secondary"
                style={{ textDecoration: 'none', fontSize: 13 }}
              >
                <IconResume size={14} />
                <span>Builder</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', gap: 24 }}>
        {/* Setup Configuration Card */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            Session Parameters
          </h3>

          {!resumeId ? (
            <div style={{
              background: 'var(--papaya-whip)',
              border: '1px solid var(--line)',
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <IconAlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                No active resume profile detected. Standard technical questions will be asked. For personalized questions challenging your specific projects,{' '}
                <Link to="/workspace/upload" style={{ fontWeight: 600, color: 'var(--ink)' }}>upload a resume</Link>.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <IconCheckCircle size={16} color="var(--success)" />
              <span>
                <b>Resume Grounded:</b> Questions will directly cross-examine claims in version {resumeId.slice(0, 8)}.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Target Role
              </label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                  background: 'var(--white)'
                }}
                placeholder="e.g. Full Stack Developer"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={dur}
                onChange={e => setDur(+e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                  background: 'var(--white)'
                }}
              />
            </div>

            <div style={{
              background: 'var(--paper)',
              padding: 14,
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 13
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <IconMic size={15} />
                <span>Microphone: Auto-detected (WebRTC ready)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-ink)' }}>
                <IconCheckCircle size={15} />
                <span>Audio Engine: Ultra low-latency streaming TTS</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-dark"
              onClick={start}
              disabled={starting}
              style={{
                width: '100%',
                padding: '13px 20px',
                fontSize: 15,
                fontWeight: 700,
                marginTop: 6,
                cursor: starting ? 'wait' : 'pointer'
              }}
            >
              <IconMic size={16} />
              <span>{starting ? 'Initializing Session…' : 'Enter Spoken Interview Room →'}</span>
            </button>
          </div>
        </div>

        {/* Phase Breakdown Card */}
        <div className="card-soft" style={{ padding: 28 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            Structured Interview Progression
          </h3>
          <p style={{ color: 'var(--muted-ink)', fontSize: 13.5, margin: '0 0 20px 0', lineHeight: 1.5 }}>
            The AI interviewer listens naturally through your microphone and dynamically adapts questions across 6 core phases:
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { num: '1', title: 'Introduction & Elevator Pitch', desc: 'Composure, background clarity, target role aspirations.' },
              { num: '2', title: 'Resume Walkthrough', desc: 'Validation of education, tech stack choices, and timeline consistency.' },
              { num: '3', title: 'Project Deep Dive', desc: 'Architecture trade-offs, database queries, and bug resolution.' },
              { num: '4', title: 'Technical Rigor', desc: 'Role-specific language, framework, and system design questions.' },
              { num: '5', title: 'Behavioral & Problem Solving', desc: 'Collaboration, deadlines, decision-making under pressure.' },
              { num: '6', title: 'Evaluation & Scorecard', desc: 'Detailed radar chart scoring with strengths and actionable advice.' }
            ].map(p => (
              <div key={p.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--white)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--line)', boxShadow: 'var(--shadow-xs)' }}>
                <span style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--black)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {p.num}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{p.title}</div>
                  <div style={{ color: 'var(--muted-ink)', fontSize: 12.5, marginTop: 2 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
