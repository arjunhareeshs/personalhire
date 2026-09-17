import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useResumeStore } from '../../stores/stores'
import {
  IconDashboard,
  IconResume,
  IconMic,
  IconUpload,
  IconLogOut,
  IconUser,
  IconShield,
  IconChevronRight,
  IconSparkles,
  IconAlertCircle,
  IconCheckCircle,
  IconDownload
} from '../ui/icons'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--cornsilk)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        background: 'var(--white)',
        borderBottom: '1px solid var(--line)'
      }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: 'var(--ink)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--black)' }} />
          <span>RViewer AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', fontSize: 14 }}>
            Sign In
          </Link>
          <Link to="/register" className="btn-dark" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>
            Get Started
          </Link>
        </div>
      </nav>
      <div style={{ flex: 1 }}>{children}</div>
      <footer style={{ padding: 24, textAlign: 'center', color: 'var(--muted-ink)', borderTop: '1px solid var(--line)', background: 'var(--white)', fontSize: 13 }}>
        RViewer AI — Modern Resume Intelligence & Real-Time Voice Interview Platform
      </footer>
    </div>
  )
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 460px) 1fr', minHeight: '100vh', background: 'var(--cornsilk)' }}>
      <div style={{
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--paper)',
        borderRight: '1px solid var(--line)'
      }}>
        <div>
          <Link to="/" style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--black)' }} />
            <span>RViewer AI</span>
          </Link>

          <div style={{ marginTop: 48 }}>
            <span className="chip" style={{ background: 'var(--tea-green)', color: '#14532d', marginBottom: 16 }}>
              Career Intelligence Platform
            </span>
            <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.25, color: 'var(--ink)', margin: '0 0 16px 0', letterSpacing: -0.5 }}>
              Objective verification.<br />Actionable career acceleration.
            </h1>
            <p style={{ color: 'var(--muted-ink)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Convert unverified PDFs into structured, evidence-grounded career intelligence. Powered by Vision Language Models, external proof verification, and spoken AI mock interviews.
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: 20, borderRadius: 10, border: '1px solid var(--line)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Core Ecosystem
          </div>
          <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconDashboard size={16} />
              <span><b>Dashboard:</b> ATS scoring & link intelligence radar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconResume size={16} />
              <span><b>Resume Builder:</b> Multi-template ATS studio editor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconMic size={16} />
              <span><b>Voice Interview:</b> Real-time WebRTC spoken assessment</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--white)', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

/* ---------------- Student Persistent Sidebar Layout ---------------- */
export function StudentWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const nav = useNavigate()
  const logout = useAuthStore((s: any) => s.logout)
  const user = useAuthStore((s: any) => s.user)
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)

  const navItems = [
    {
      label: 'Dashboard',
      path: activeResumeId ? `/workspace/dashboard/${activeResumeId}` : '/workspace/dashboard',
      matchPrefix: '/workspace/dashboard',
      icon: <IconDashboard size={18} />
    },
    {
      label: 'Resume Builder',
      path: activeResumeId ? `/workspace/builder/${activeResumeId}` : '/workspace/builder',
      matchPrefix: '/workspace/builder',
      icon: <IconResume size={18} />
    },
    {
      label: 'Voice Interview',
      path: '/workspace/interview',
      matchPrefix: '/workspace/interview',
      icon: <IconMic size={18} />
    },
    {
      label: 'Upload & Intake',
      path: '/workspace/upload',
      matchPrefix: '/workspace/upload',
      icon: <IconUpload size={18} />
    },
  ]

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--white)' }}>
      {/* Persistent Enterprise Sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--paper)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 30,
        flexShrink: 0
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--line)' }}>
            <Link to="/workspace" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--black)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                R
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', letterSpacing: -0.3 }}>
                  RViewer AI
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-ink)', fontWeight: 500 }}>
                  Career Intelligence Studio
                </div>
              </div>
            </Link>
          </div>

          {/* Active Resume Pinned Card */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '10px 12px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-ink)', letterSpacing: 0.5 }}>
                  Active Resume
                </span>
                {activeResumeId ? (
                  <span className="chip" style={{ background: 'var(--tea-green)', fontSize: 10, padding: '1px 6px' }}>
                    Loaded
                  </span>
                ) : (
                  <span className="chip" style={{ background: 'var(--papaya-whip)', fontSize: 10, padding: '1px 6px' }}>
                    None
                  </span>
                )}
              </div>

              {activeResumeId ? (
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    v{activeResumeId.slice(0, 10)}…
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 11 }}>
                    <Link to={`/workspace/dashboard/${activeResumeId}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                      View Health →
                    </Link>
                    <Link to="/workspace/upload" style={{ color: 'var(--muted-ink)', textDecoration: 'none' }}>
                      Replace
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginBottom: 6 }}>
                    No resume uploaded yet.
                  </div>
                  <Link to="/workspace/upload" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Upload PDF/DOCX</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Primary Navigation */}
          <div style={{ padding: '4px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 10px', marginBottom: 2 }}>
              Navigation
            </div>
            <nav style={{ display: 'grid', gap: 3 }}>
              {navItems.map((item) => {
                const isActive = loc.pathname.startsWith(item.matchPrefix) || (item.label === 'Dashboard' && loc.pathname === '/workspace')
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.75, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div style={{ padding: '16px 16px 20px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--beige)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--ink)'
            }}>
              {(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email?.split('@')[0] || 'Student Candidate'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.email || 'student@demo.ai'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--line)',
              background: 'var(--white)',
              color: 'var(--danger)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s ease'
            }}
          >
            <IconLogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          height: 60,
          borderBottom: '1px solid var(--line)',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--muted-ink)' }}>Portal</span>
            <span style={{ color: 'var(--line)' }}>/</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {loc.pathname.includes('dashboard') ? 'Dashboard' :
               loc.pathname.includes('builder') ? 'Resume Builder' :
               loc.pathname.includes('interview') ? 'Voice AI Interview' :
               loc.pathname.includes('upload') ? 'Upload & Intake' : 'Workspace'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {activeResumeId && (
              <span className="chip" style={{ background: 'var(--paper)' }}>
                <IconCheckCircle size={13} />
                <span>Active Profile Synchronized</span>
              </span>
            )}
            <Link
              to="/workspace/upload"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 12.5 }}
            >
              <IconUpload size={14} />
              <span>New Upload</span>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="page" style={{ flex: 1, width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

/* ---------------- Isolated Admin Sidebar Layout ---------------- */
export function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()
  const logout = useAuthStore((s: any) => s.logout)
  const user = useAuthStore((s: any) => s.user)

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: <IconDashboard size={17} /> },
    { label: 'Candidates', path: '/admin/candidates', icon: <IconUser size={17} /> },
    { label: 'Bulk Upload', path: '/admin/bulk-upload', icon: <IconUpload size={17} /> },
    { label: 'NL Search', path: '/admin/search', icon: <IconDashboard size={17} /> },
    { label: 'Interviews', path: '/admin/interviews', icon: <IconMic size={17} /> },
    { label: 'Reports', path: '/admin/reports', icon: <IconResume size={17} /> },
    { label: 'Pipeline', path: '/admin/pipeline', icon: <IconCheckCircle size={17} /> },
    { label: 'Compare', path: '/admin/compare', icon: <IconDashboard size={17} /> },
    { label: 'Users', path: '/admin/users', icon: <IconUser size={17} /> },
    { label: 'Monitoring', path: '/admin/monitoring', icon: <IconAlertCircle size={17} /> },
    { label: 'Settings', path: '/admin/settings', icon: <IconShield size={17} /> },
  ]

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--white)' }}>
      {/* Isolated Admin Sidebar */}
      <aside style={{
        width: 250,
        background: 'var(--paper)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 30,
        flexShrink: 0
      }}>
        <div>
          <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--line)' }}>
            <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--black)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                A
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
                  RViewer Admin
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted-ink)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Recruitment Operations
                </div>
              </div>
            </Link>
          </div>

          <div style={{ padding: '12px 10px' }}>
            <nav style={{ display: 'grid', gap: 2 }}>
              {adminNav.map((item) => {
                const active = loc.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${active ? 'active' : ''}`}
                  >
                    <span style={{ opacity: active ? 1 : 0.75, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Admin Footer */}
        <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
            {user?.name || user?.email || 'Administrator'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-ink)', marginBottom: 10 }}>
            Operations & Screening Hub
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--line)',
              background: 'var(--white)',
              color: 'var(--danger)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <IconLogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 60,
          padding: '0 32px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--white)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ fontSize: 13, color: 'var(--muted-ink)' }}>
            Institutional Candidate Processing & Pre-Screening Engine
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="chip" style={{ background: 'var(--tea-green)' }}>
              <IconCheckCircle size={13} />
              <span>Queue Status: Active</span>
            </span>
          </div>
        </header>

        <main className="page" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

/* ---------------- Studio Builder Layout ---------------- */
export function BuilderWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        background: 'var(--white)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => nav(activeResumeId ? `/workspace/dashboard/${activeResumeId}` : '/workspace/dashboard')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 15 }}>Resume Builder Studio</strong>
            <span className="chip" style={{ background: 'var(--cornsilk)' }}>ATS Optimized</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            <IconDownload size={15} />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            className="btn-dark"
            onClick={() => nav('/workspace/interview')}
            style={{ padding: '7px 16px', fontSize: 13 }}
          >
            <IconMic size={15} />
            <span>Launch Voice Interview →</span>
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}

export function InterviewRoomLayout({ children }: { children: React.ReactNode }) {
  return <div className="interview-dark">{children}</div>
}
