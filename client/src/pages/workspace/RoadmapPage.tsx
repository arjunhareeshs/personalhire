import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { roadmapApi } from '../../lib/api'
import { LoadingState, ErrorState } from '../../components/ui/ui'
import { IconBookOpen, IconEdit, IconTarget, IconAward, IconCheckCircle } from '../../components/ui/icons'

export default function RoadmapPage() {
  const { resumeId = '' } = useParams()
  const [rm, setRm] = useState<any>(null); const [sel, setSel] = useState(1)
  const [role, setRole] = useState('Full Stack Developer'); const [view, setView] = useState('Timeline')
  const [progress, setProgress] = useState<any>({})
  const [err, setErr] = useState(''); const [mindSvg, setMindSvg] = useState('')

  const load = async () => {
    try { const r = await roadmapApi.get(resumeId); setRm(r); setRole(r.target_role || role); setProgress(r.progress || {}) }
    catch { setErr('Could not load roadmap — retry.') }
  }
  useEffect(() => { load() }, [resumeId])
  const gen = async () => { try { const r = await roadmapApi.generate(resumeId, role); setRm(r); setProgress({}) } catch { setErr('Generation failed — retry.') } }
  const regen = async () => { if (!rm?.roadmap_id) return gen(); try { const r = await roadmapApi.regenerate(rm.roadmap_id, role); setRm(r); setProgress({}) } catch { setErr('Regeneration failed.') } }

  const toggle = async (key: string) => {
    const p = { ...progress, [key]: !progress[key] }
    setProgress(p)
    if (rm?.roadmap_id) try { await roadmapApi.progress(rm.roadmap_id, p) } catch {}
  }
  const counts = useMemo(() => {
    let done = 0, total = 0
    ;(rm?.months || []).forEach((m: any) => (m.weeks || []).forEach((w: any) => (w.tasks || []).forEach((t: string) => { total++; if (progress[`${m.month}-${w.week}-${t}`]) done++ })))
    return { done, total }
  }, [rm, progress])

  useEffect(() => {
    if (view !== 'Mind map' || !rm) return
    let alive = true
    const nodes = (rm.months || []).map((m: any) => `M${m.month}[Month ${m.month}: ${m.title}]`).join('\n')
    const edges = (rm.months || []).map((m: any) => `R --> M${m.month}`).join('\n')
    const def = `graph TD\nR[${rm.target_role} — 6 months]\n${nodes}\n${edges}`
    import('mermaid').then(m => {
      m.default.initialize({ startOnLoad: false, theme: 'neutral' })
      return m.default.render('rmm', def)
    }).then(r => { if (alive) setMindSvg(r.svg) }).catch(() => { if (alive) setMindSvg('') })
    return () => { alive = false }
  }, [view, rm])

  if (err && !rm) return <ErrorState t={err} onRetry={() => { setErr(''); load() }} />
  if (!rm) return <LoadingState t="Building your 6-month plan…" />
  const month = (rm.months || []).find((m: any) => m.month === sel) || (rm.months || [])[0]
  const deps: string[] = rm.skill_dependencies || []

  return (<div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0 }}>Six-month roadmap — {rm.target_role}</h2>
      <span className="chip" style={{ background: 'var(--tea-green)' }}>{rm.current_level}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <input value={role} onChange={e => setRole(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8 }} />
        <button className="btn-bronze" onClick={gen}>Generate</button>
        <button className="btn-dark" onClick={regen}>Regenerate</button>
      </span>
    </div>
    <p style={{ color: 'var(--muted-ink)' }}>{rm.roadmap_summary}</p>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {['Timeline', 'Mind map', 'Dependencies'].map(v => (
        <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 999, background: view === v ? 'var(--black)' : 'var(--beige)', color: view === v ? 'white' : 'inherit' }}>{v}</button>))}
      <span style={{ marginLeft: 'auto' }}>Progress {counts.done}/{counts.total}</span>
      <div style={{ width: 160, height: 8, background: '#eee', borderRadius: 999 }}><div style={{ width: `${counts.total ? Math.round(100 * counts.done / counts.total) : 0}%`, height: 8, background: 'var(--tea-green)', borderRadius: 999 }} /></div>
    </div>

    {view === 'Mind map' && (<div className="card" style={{ padding: 16, marginTop: 12, overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: mindSvg || 'Rendering…' }} />)}
    {view === 'Dependencies' && (<div className="card" style={{ padding: 16, marginTop: 12 }}>
      <svg width={640} height={90}>{deps.map((d, i) => (<g key={d}>
        {i > 0 && <line x1={40 + (i - 1) * 120} y1={45} x2={40 + i * 120} y2={45} stroke="#999" markerEnd="url(#a)" />}
        <rect x={10 + i * 120} y={20} width={100} height={50} rx={8} fill="var(--beige)" stroke="var(--line)" />
        <text x={60 + i * 120} y={48} textAnchor="middle" fontSize={11}>{d.slice(0, 16)}</text></g>))}
        <defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#999" /></marker></defs></svg>
    </div>)}

    {view === 'Timeline' && (<div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 16, marginTop: 12 }}>
      <div>{(rm.months || []).map((m: any) => {
        const keys = (m.weeks || []).flatMap((w: any) => (w.tasks || []).map((t: string) => `${m.month}-${w.week}-${t}`))
        const d = keys.filter((k: string) => progress[k]).length
        return (<div key={m.month} onClick={() => setSel(m.month)} className="card" style={{ padding: 12, marginBottom: 8, background: sel === m.month ? 'var(--black)' : 'white', color: sel === m.month ? 'white' : 'inherit', cursor: 'pointer' }}>
          <strong>Month {m.month}: {m.title}</strong><div style={{ fontSize: 12 }}>{m.goal}</div><div style={{ fontSize: 12 }}>{d}/{keys.length} done</div></div>)
      })}</div>
      <div className="card" style={{ padding: 16 }}>
        <h3>Month {month?.month}: {month?.title}</h3><p style={{ color: '#666' }}>{month?.goal}</p>
        {(month?.weeks || []).map((w: any) => (<div key={w.week} style={{ marginBottom: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
          <b>Week {w.week}: {w.focus}</b>
          {(w.tasks || []).map((t: string) => { const k = `${month.month}-${w.week}-${t}`; return (
            <div key={k}><input type="checkbox" checked={!!progress[k]} onChange={() => toggle(k)} /> {t}</div>) })}
          {!!(w.resources || []).length && (
            <div style={{ fontSize: 12, color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <IconBookOpen size={13} /> {(w.resources || []).join(' • ')}
            </div>
          )}
          {!!(w.practice || []).length && (
            <div style={{ fontSize: 12, color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <IconEdit size={13} /> {(w.practice || []).join(' • ')}
            </div>
          )}
          {!!(w.deliverables || []).length && (
            <div style={{ fontSize: 12, color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <IconTarget size={13} /> {(w.deliverables || []).join(' • ')}
            </div>
          )}
        </div>))}
        {!!(month?.project_work || []).length && <div><b>Project milestone:</b> {(month.project_work || []).join(' • ')}</div>}
      </div>
      <div>
        <div className="card-soft" style={{ padding: 14, marginBottom: 12 }}>
          <h4 style={{ margin: '0 0 8px' }}>Recommended Certifications</h4>
          {((month?.certification_recommendations || []).length ? month.certification_recommendations : rm.certifications || []).map((c: string) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '4px 0' }}>
              <IconAward size={14} /> {c}
            </div>
          ))}
        </div>
        <div className="card-soft" style={{ padding: 14 }}>
          <h4 style={{ margin: '0 0 8px' }}>Target Competencies</h4>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-ink)' }}>{(month?.skills_covered || []).join(', ')}</p>
        </div>
      </div>
    </div>)}
  </div>)
}
