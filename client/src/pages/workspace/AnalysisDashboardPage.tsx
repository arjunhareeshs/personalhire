import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { analysisApi, resumeApi } from '../../lib/api'
import { ScoreBadge, Tabs } from '../../components/ui/ui'
import {
  IconDashboard,
  IconResume,
  IconMic,
  IconSparkles,
  IconAlertTriangle,
  IconCheckCircle,
  IconAlertCircle,
  IconExternal,
  IconArrowRight,
  IconRefresh,
  IconDownload,
  IconChevronRight
} from '../../components/ui/icons'

const TABS = ['Overview', 'ATS Analysis', 'Skills', 'Projects', 'Role Match', 'Link Verification', 'Improvements']

function MetricCard({ title, score, subtitle, onClick, badge }: any) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: 'var(--muted-ink)', fontSize: 13, fontWeight: 600 }}>{title}</span>
        {badge && <span className="chip" style={{ background: 'var(--paper)', fontSize: 11 }}>{badge}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <ScoreBadge score={score} />
        <span style={{ fontSize: 13, color: 'var(--muted-ink)', fontWeight: 500 }}>{subtitle}</span>
      </div>
    </div>
  )
}

export default function AnalysisDashboardPage() {
  const { resumeId = '' } = useParams()
  const [d, setD] = useState<any>(null)
  const [tab, setTab] = useState('Overview')
  const [meta, setMeta] = useState<any>({})

  const load = async () => {
    try { setD(await analysisApi.dashboard(resumeId)) } catch { setD(null) }
    try { const r = await resumeApi.get(resumeId); setMeta(r) } catch {}
  }

  useEffect(() => { load() }, [resumeId])

  if (!d) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted-ink)' }}>
        <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid var(--line)', borderTopColor: 'var(--black)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Evaluating Resume Health…</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Processing ATS keywords, skill matrix, projects, and external links</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="chip" style={{ background: 'var(--tea-green)', color: '#14532d' }}>
              <IconCheckCircle size={13} />
              <span>Audit Complete</span>
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>
              {meta.filename || 'resume.pdf'} • Version {resumeId.slice(0, 8)}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
            Career Health & ATS Intelligence
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            <IconRefresh size={14} />
            <span>Re-evaluate</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            <IconDownload size={14} />
            <span>Export Report</span>
          </button>

          <Link
            to={`/workspace/builder/${resumeId}`}
            className="btn-dark"
            style={{ textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}
          >
            <IconResume size={14} />
            <span>Open in Builder →</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Performance Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <MetricCard
          title="Overall Resume Quality"
          score={d.overall_score}
          subtitle={d.status_label}
          badge="Scorecard"
          onClick={() => setTab('Overview')}
        />
        <MetricCard
          title="ATS Optimization"
          score={d.ats_score}
          subtitle={`${d.ats_detail?.passed?.length || 0} checks passed`}
          badge={d.ats_detail?.fix_priority ? `${d.ats_detail.fix_priority} priority` : 'Audited'}
          onClick={() => setTab('ATS Analysis')}
        />
        <MetricCard
          title="Role Alignment"
          score={d.role_fit_score}
          subtitle={d.role_recommendations?.[0]?.role || 'Evaluated'}
          badge="Target Match"
          onClick={() => setTab('Role Match')}
        />
        <MetricCard
          title="Proof of Work"
          score={d.link_verification_score}
          subtitle={`${d.link_analysis?.length || 0} profiles verified`}
          badge="External Proof"
          onClick={() => setTab('Link Verification')}
        />
      </div>

      {/* Executive Summary Callout */}
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'var(--white)',
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink)',
          flexShrink: 0
        }}>
          <IconSparkles size={16} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
            Executive Career Assessment
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>
            {d.ai_summary}
          </p>
        </div>
      </div>

      {/* 3-Column Diagnostic Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(280px, 320px)', gap: 16, marginBottom: 24 }}>
        {/* Column 1: Section Completeness & Warnings */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Section Completeness</h4>
            <div style={{ display: 'grid', gap: 6 }}>
              {Object.entries(d.section_completeness || {}).map(([sec, status]: any) => (
                <div key={sec} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '3px 0' }}>
                  <span style={{ textTransform: 'capitalize', color: 'var(--ink)' }}>{sec.replace(/_/g, ' ')}</span>
                  <span className="chip" style={{
                    background: status === 'complete' ? 'var(--tea-green)' : status === 'missing' ? '#fee2e2' : 'var(--papaya-whip)',
                    fontSize: 11
                  }}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconAlertTriangle size={15} color="var(--danger)" />
              <span>Critical Attention Flags</span>
            </h4>
            <div style={{ display: 'grid', gap: 6 }}>
              {(d.warnings || []).map((w: string) => (
                <div key={w} style={{ fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ lineHeight: 1 }}>•</span>
                  <span>{w}</span>
                </div>
              ))}
              {!(d.warnings?.length) && (
                <div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>No critical warnings found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Skill Intelligence & Target Gap */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Skill Matrix & Categorization</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {Object.entries((d.skills?.by_category || {})).slice(0, 4).map(([cat, skList]: any) => (
                <div key={cat}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'capitalize', marginBottom: 4 }}>
                    {cat.replace(/_/g, ' ')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(skList || []).map((sk: string) => (
                      <span key={sk} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px', fontSize: 12 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 12, fontSize: 12 }}>
              <div style={{ color: '#14532d', marginBottom: 3 }}>
                <b>Strong Skills:</b> {(d.skills?.strong_skills || []).join(', ') || 'N/A'}
              </div>
              <div style={{ color: '#991b1b' }}>
                <b>Missing for Target:</b> {(d.skills?.missing_skills || []).join(', ') || 'None'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>
              Skill Gap for {d.skill_gap?.target_role || 'Target Role'}
            </h4>
            <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
              <div>
                <span style={{ color: 'var(--muted-ink)' }}>Required Gaps: </span>
                <span style={{ fontWeight: 600 }}>{(d.skill_gap?.missing || []).join(', ') || 'None'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--muted-ink)' }}>Priority Upskilling: </span>
                <span style={{ fontWeight: 600 }}>{(d.skill_gap?.priority || []).join(', ') || 'N/A'}</span>
              </div>
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted-ink)' }}>
                  Estimated ramp-up: ~{d.skill_gap?.est_weeks || 4} weeks
                </span>
                <Link to={`/workspace/roadmap/${resumeId}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                  Open 6-Month Roadmap →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Priority Fix List & Next Steps */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Action Items (Ranked by Impact)</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {(d.improvement_priorities || []).map((p: any, i: number) => (
                <div key={i} style={{ fontSize: 13, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span className="chip" style={{
                      background: p.level === 'critical' ? '#fee2e2' : 'var(--papaya-whip)',
                      fontSize: 10,
                      padding: '1px 6px'
                    }}>
                      {p.level}
                    </span>
                  </div>
                  <div style={{ color: 'var(--ink)' }}>{p.task}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700 }}>Recommended Next Steps</h4>
            <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--ink)' }}>
              {(d.next_actions || []).map((n: string) => (
                <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: 'var(--muted-ink)' }}>→</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Link to={`/workspace/links/${resumeId}`} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 12, padding: '5px 10px', flex: 1 }}>
                Proof Verification
              </Link>
              <Link to={`/workspace/roadmap/${resumeId}`} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 12, padding: '5px 10px', flex: 1 }}>
                Learning Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Deep-Dive Analysis Tabs */}
      <div style={{ marginBottom: 32 }}>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'Overview' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Holistic Evaluation</h3>
            <p style={{ color: 'var(--muted-ink)', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
              {d.ai_summary}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to={`/workspace/builder/${resumeId}`} className="btn-dark" style={{ textDecoration: 'none', fontSize: 13 }}>
                Refine Resume Content →
              </Link>
              <Link to="/workspace/interview" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
                Practice Spoken Mock Round →
              </Link>
            </div>
          </div>
        )}

        {tab === 'ATS Analysis' && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#14532d', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCheckCircle size={16} />
                  <span>Passed ATS Criteria ({d.ats_detail?.passed?.length || 0})</span>
                </h4>
                <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                  {d.ats_detail?.passed?.map((p: any) => (
                    <div key={p.check} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ color: '#14532d' }}>✓</span>
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconAlertCircle size={16} />
                  <span>Failed Criteria Needing Attention ({d.ats_detail?.failed?.length || 0})</span>
                </h4>
                <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                  {d.ats_detail?.failed?.map((p: any) => (
                    <div key={p.check} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ color: '#991b1b' }}>✗</span>
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Skills' && (
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 15 }}>Extracted & Categorized Skills</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {Object.entries(d.skills?.by_category || {}).map(([k, v]: any) => (
                <div key={k} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, background: 'var(--paper)' }}>
                  <b style={{ textTransform: 'capitalize', display: 'block', marginBottom: 8, fontSize: 13 }}>
                    {k.replace(/_/g, ' ')}
                  </b>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(v || []).map((sk: string) => (
                      <span key={sk} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Projects' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {(d.project_analysis || []).map((p: any, i: number) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{p.title}</h4>
                  <span className="chip" style={{ background: 'var(--paper)' }}>Complexity: {p.complexity_score}/100</span>
                </div>
                <div style={{ color: 'var(--muted-ink)', fontSize: 13, marginBottom: 8 }}>
                  Tech Stack: {(p.tech_stack || []).join(', ')} • Deployment: {p.deployment_status || 'Unspecified'}
                </div>
                <div style={{ fontSize: 13.5, background: 'var(--paper)', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }}>
                  <b>Optimization Opportunity:</b> {p.suggestion}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Role Match' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {(d.role_recommendations || []).map((r: any) => (
              <div key={r.role} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{r.role}</h4>
                  <ScoreBadge score={r.fit} label="Role Fit" />
                </div>
                <div style={{ fontSize: 13, display: 'grid', gap: 4, color: 'var(--ink)' }}>
                  <div><b>Matching Skills:</b> {(r.matching_skills || []).join(', ')}</div>
                  <div><b>Missing Competencies:</b> {(r.missing_skills || []).join(', ') || 'None'}</div>
                  <div style={{ marginTop: 6, color: 'var(--muted-ink)' }}><b>Recommended Path:</b> {r.next}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Link Verification' && (
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 15 }}>Verified External Profiles</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {(d.link_analysis || []).map((l: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--paper)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconExternal size={16} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.platform}</div>
                      <div style={{ color: 'var(--muted-ink)', fontSize: 12 }}>{l.url}</div>
                    </div>
                  </div>
                  <span className="chip" style={{ background: l.status === 'verified' ? 'var(--tea-green)' : 'var(--papaya-whip)' }}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to={`/workspace/links/${resumeId}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                Open Full GitHub Heatmap & LeetCode Radar →
              </Link>
            </div>
          </div>
        )}

        {tab === 'Improvements' && (
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 15 }}>Bullet Point Optimization (Before vs After)</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              {(d.bullet_analysis || []).map((b: any, i: number) => (
                <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, background: 'var(--paper)' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted-ink)', marginBottom: 4 }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Original: </span>
                    <span>"{b.bullet}"</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#14532d', fontWeight: 600 }}>
                    <span>ATS Optimized: </span>
                    <span>"{b.improved}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next Actions Banner */}
      <div style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '24px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>
            Next Steps in Your Workflow
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted-ink)', marginTop: 2 }}>
            Rebuild your resume on ATS templates or challenge your project claims in a real-time voice interview.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            to={`/workspace/builder/${resumeId}`}
            className="btn-dark"
            style={{ textDecoration: 'none', padding: '10px 20px', fontSize: 13.5 }}
          >
            <IconResume size={15} />
            <span>Customize in Builder →</span>
          </Link>
          <Link
            to="/workspace/interview"
            className="btn-bronze"
            style={{ textDecoration: 'none', padding: '10px 20px', fontSize: 13.5 }}
          >
            <IconMic size={15} />
            <span>Practice Voice Mock →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
