import { Link } from 'react-router-dom'
import { ScoreBadge } from '../ui/ui'
import { IconSparkles, IconEdit, IconCheckCircle } from '../ui/icons'

// §16.4 Dashboard components
export function ResumeHealthCard({ score, label, onClick }: any) {
  return <div className="card-soft" onClick={onClick} style={{ padding: 16, cursor: onClick ? 'pointer' : 'default' }}><div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Resume health</div><ScoreBadge score={score} /><div>{label}</div></div>
}
export function ATSScoreCard({ score, priority, onClick }: any) {
  return <div className="card-soft" onClick={onClick} style={{ padding: 16, cursor: onClick ? 'pointer' : 'default' }}><div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>ATS score</div><ScoreBadge score={score} /><div>{priority} priority</div></div>
}
export function RoleFitCard({ score, top, onClick }: any) {
  return <div className="card-soft" onClick={onClick} style={{ padding: 16, cursor: onClick ? 'pointer' : 'default' }}><div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Role fit</div><ScoreBadge score={score} /><div>Top: {top}</div></div>
}
export function LinkScoreCard({ score, count, onClick }: any) {
  return <div className="card-soft" onClick={onClick} style={{ padding: 16, cursor: onClick ? 'pointer' : 'default' }}><div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Links</div><ScoreBadge score={score} /><div>{count} links</div></div>
}
export function AISummaryPanel({ text }: any) {
  return (
    <div className="card-soft" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <IconSparkles size={18} style={{ color: 'var(--black)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}
export function SectionCompleteness({ data }: any) {
  return (<div className="card-soft" style={{ padding: 16 }}><div style={{ color: 'var(--muted-ink)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Section completeness</div>
    {Object.entries(data || {}).map(([k, v]: any) => (<div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}><span>{k}</span><span className="chip" style={{ background: v === 'complete' ? 'var(--tea-green)' : v === 'missing' ? '#ffd9d6' : 'var(--papaya-whip)' }}>{v}</span></div>))}</div>)
}
export function SkillMatrix({ byCategory, strong, missing }: any) {
  return (<div className="card-soft" style={{ padding: 16 }}><div style={{ color: 'var(--muted-ink)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Skill intelligence</div>
    {Object.entries(byCategory || {}).slice(0, 6).map(([k, v]: any) => <div key={k} style={{ fontSize: 13, margin: '4px 0' }}><b>{k}</b>: {(v || []).join(', ')}</div>)}
    <div style={{ marginTop: 10, fontSize: 13, borderTop: '1px solid var(--line)', paddingTop: 8 }}><b>Verified:</b> {(strong || []).join(', ')} <br/><b>Target Gaps:</b> {(missing || []).join(', ')}</div></div>)
}
export function SkillGapPanel({ gap, resumeId }: any) {
  return (<div className="card-soft" style={{ padding: 16 }}><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Skill gap → {gap?.target_role}</div>
    <div style={{ fontSize: 13 }}>Need: {(gap?.missing || []).join(', ') || 'none'} • ~{gap?.est_weeks || 0} wks → <Link to={`/workspace/roadmap/${resumeId}`} style={{ fontWeight: 600, textDecoration: 'underline' }}>View Roadmap</Link></div></div>)
}
export function ProjectAnalysisList({ items }: any) {
  return (<div>{(items || []).map((p: any, i: number) => (<div key={i} className="card-soft" style={{ padding: 12, marginBottom: 8 }}><b>{p.title}</b> — complexity {p.complexity_score}<div>{p.suggestion}</div></div>))}</div>)
}
export function BulletQualityList({ items }: any) {
  if (!items?.length) return <div className="card-soft" style={{ padding: 14 }}>All bullet points meet quantitative and impact standards.</div>
  return (<div className="card-soft" style={{ padding: 14 }}>{items.map((b: any, i: number) => (
    <div key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-ink)' }}><IconEdit size={13} /> <span>{b.bullet}</span> <span style={{ fontSize: 11, background: 'var(--beige)', padding: '1px 5px', borderRadius: 4 }}>[{(b.issues || []).join(', ')}]</span></div>
      <div style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 4, fontWeight: 500 }}><IconCheckCircle size={13} /> {b.improved}</div>
    </div>))}</div>)
}
export function ImprovementPriorityList({ items }: any) {
  return (<div className="card-soft" style={{ padding: 16 }}><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>High-Impact Action Items</div>{(items || []).map((p: any, i: number) => (<div key={i} style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, borderBottom: '1px solid var(--line)' }}><span className="chip" style={{ background: p.level === 'critical' ? '#ffd9d6' : 'var(--cornsilk)' }}>{p.level}</span> <span>{p.task}</span></div>))}</div>)
}

