import { IconAward, IconBookOpen } from '../ui/icons'

// §16.6 Roadmap components
export function RoadmapTimeline({ months, selected, onSelect }: any) {
  return (<div>{(months || []).map((m: any) => (<div key={m.month} onClick={() => onSelect(m.month)} className="card" style={{ padding: 12, marginBottom: 8, background: selected === m.month ? 'var(--black)' : 'white', color: selected === m.month ? 'white' : 'inherit', cursor: 'pointer' }}><strong>Month {m.month}: {m.title}</strong><div>{m.goal}</div></div>))}</div>)
}
export function MonthPlan({ month }: any) {
  return <div className="card" style={{ padding: 16 }}><h3>Month {month?.month}: {month?.title}</h3><p>{month?.goal}</p></div>
}
export function WeekChecklist({ weeks }: any) {
  return (<div>{(weeks || []).map((w: any) => (<div key={w.week} style={{ padding: '6px 0' }}><input type="checkbox" /> Week {w.week}: {w.focus} — {(w.tasks || []).join(' • ')}</div>))}</div>)
}
export function SkillDependencyGraph({ deps }: any) {
  return <pre style={{ background: 'var(--beige)', padding: 12 }}>graph TD; {(deps || []).map((d: string) => `A[${d}]`).join('-->')}</pre>
}
export function CertificationCard({ items }: any) {
  return <div className="card-soft" style={{ padding: 14 }}><h4 style={{ margin: '0 0 8px' }}>Recommended Certifications</h4>{(items || []).map((c: string) => <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', fontSize: 13 }}><IconAward size={14} /> {c}</div>)}{!(items?.length) && 'Role-matched certs appear after generation.'}</div>
}
export function ResourceList({ items }: any) {
  return <div><h4 style={{ margin: '0 0 8px' }}>Curated Resources</h4>{(items || []).map((r: string) => <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', fontSize: 13 }}><IconBookOpen size={14} /> {r}</div>)}</div>
}
export function RoadmapProgress({ done, total }: any) {
  const pct = total ? Math.round(100 * done / total) : 0
  return <div><div>Progress {done}/{total}</div><div style={{ height: 8, background: '#eee', borderRadius: 999 }}><div style={{ width: `${pct}%`, height: 8, background: 'var(--tea-green)', borderRadius: 999 }} /></div></div>
}
