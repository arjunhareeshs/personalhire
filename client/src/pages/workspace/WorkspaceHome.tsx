import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useResumeStore, useAuthStore } from '../../stores/stores'
import { resumeApi } from '../../lib/api'
import {
  IconDashboard,
  IconResume,
  IconMic,
  IconUpload,
  IconArrowRight,
  IconCheckCircle,
  IconAlertCircle,
  IconSparkles,
  IconBarChart,
  IconChevronRight
} from '../../components/ui/icons'

export default function WorkspaceHome() {
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)
  const user = useAuthStore((s: any) => s.user)
  const [resumes, setResumes] = useState<any[]>([])

  useEffect(() => {
    resumeApi.list().then(r => setResumes(r.resumes || [])).catch(() => {})
  }, [])

  const modules = [
    {
      title: 'Career Health & ATS Dashboard',
      category: 'Analysis & Intelligence',
      desc: 'Comprehensive ATS audit, skill gap identification, verified GitHub contribution heatmap, LeetCode radar, and 6-month roadmap.',
      path: activeResumeId ? `/workspace/dashboard/${activeResumeId}` : '/workspace/upload',
      cta: activeResumeId ? 'Open Dashboard' : 'Upload Resume First',
      icon: <IconDashboard size={22} />,
      status: activeResumeId ? 'Ready' : 'Pending Upload',
      statusColor: activeResumeId ? 'var(--tea-green)' : 'var(--papaya-whip)'
    },
    {
      title: 'Resume Builder Studio',
      category: 'Document Engineering',
      desc: 'Rebuild role-targeted resumes on ATS-compliant templates with live desk preview, AI bullet optimization, and PDF export.',
      path: activeResumeId ? `/workspace/builder/${activeResumeId}` : '/workspace/upload',
      cta: 'Launch Studio',
      icon: <IconResume size={22} />,
      status: activeResumeId ? 'Available' : 'Pending Upload',
      statusColor: activeResumeId ? 'var(--tea-green)' : 'var(--papaya-whip)'
    },
    {
      title: 'Real-Time Voice Mock Interview',
      category: 'Conversational Pre-Screening',
      desc: 'Spoken, adaptive WebRTC mock interview directly cross-examining your resume claims, projects, and technical depth.',
      path: '/workspace/interview',
      cta: 'Enter Interview Lobby',
      icon: <IconMic size={22} />,
      status: 'Session Ready',
      statusColor: 'var(--tea-green)'
    },
    {
      title: 'Document Ingestion & Review',
      category: 'VLM Extraction Engine',
      desc: 'Upload new PDF/DOCX resumes, convert pages to 300 DPI images for Vision Language Model extraction, and inspect structured data.',
      path: '/workspace/upload',
      cta: 'Manage Documents',
      icon: <IconUpload size={22} />,
      status: `${resumes.length} Ingested`,
      statusColor: 'var(--beige)'
    }
  ]

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '28px 32px',
        marginBottom: 32,
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="chip" style={{ background: 'var(--white)', border: '1px solid var(--line)' }}>
              <IconSparkles size={13} />
              <span>Verified Career Workspace</span>
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ink)', letterSpacing: -0.4 }}>
            Welcome, {user?.name || user?.email?.split('@')[0] || 'Candidate'}
          </h1>
          <p style={{ color: 'var(--muted-ink)', margin: 0, fontSize: 14.5, maxWidth: 640, lineHeight: 1.5 }}>
            Your centralized career acceleration hub. Audit resume health, verify proof-of-work links, customize ATS layouts, and practice adaptive mock interviews.
          </p>
        </div>

        <div>
          {activeResumeId ? (
            <Link
              to={`/workspace/dashboard/${activeResumeId}`}
              className="btn-dark"
              style={{ textDecoration: 'none', padding: '11px 20px', fontSize: 14 }}
            >
              <span>Go to Active Dashboard</span>
              <IconArrowRight size={16} />
            </Link>
          ) : (
            <Link
              to="/workspace/upload"
              className="btn-dark"
              style={{ textDecoration: 'none', padding: '11px 20px', fontSize: 14 }}
            >
              <IconUpload size={16} />
              <span>Upload Your Resume</span>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-ink)', letterSpacing: 0.5, marginBottom: 6 }}>
            Active Profile
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            {activeResumeId ? `v${activeResumeId.slice(0, 8)}` : 'None'}
          </div>
          <div style={{ fontSize: 12, color: activeResumeId ? 'var(--success)' : 'var(--muted-ink)', marginTop: 4 }}>
            {activeResumeId ? 'Synchronized across tools' : 'Upload to initiate'}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-ink)', letterSpacing: 0.5, marginBottom: 6 }}>
            Ingested Resumes
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            {resumes.length} {resumes.length === 1 ? 'version' : 'versions'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 4 }}>
            File history preserved
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-ink)', letterSpacing: 0.5, marginBottom: 6 }}>
            Voice AI Rounds
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            Available
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 4 }}>
            WebRTC audio room ready
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-ink)', letterSpacing: 0.5, marginBottom: 6 }}>
            ATS Optimization
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            Active
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 4 }}>
            Multi-template studio ready
          </div>
        </div>
      </div>

      {/* Primary Workspaces Grid */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px 0', color: 'var(--ink)' }}>
          Platform Modules
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {modules.map((m) => (
            <div
              key={m.title}
              className="card"
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'var(--white)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink)'
                  }}>
                    {m.icon}
                  </div>
                  <span className="chip" style={{ background: m.statusColor }}>
                    {m.status}
                  </span>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted-ink)', marginBottom: 4 }}>
                  {m.category}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                  {m.title}
                </h3>
                <p style={{ color: 'var(--muted-ink)', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 24px 0' }}>
                  {m.desc}
                </p>
              </div>

              <Link
                to={m.path}
                className="btn-secondary"
                style={{ textDecoration: 'none', justifyContent: 'space-between', fontSize: 13.5, padding: '10px 16px' }}
              >
                <span>{m.cta}</span>
                <IconChevronRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
