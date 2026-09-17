import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import { Tabs, StatusChip, ScoreBadge } from '../../components/ui/ui'
import { IconExternal } from '../../components/ui/icons'

function Hi({ text, terms }: any) {
  if (!terms?.length || !text) return <span>{text}</span>
  const rx = new RegExp(`(${terms.map((t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = String(text).split(rx)
  return (<span>{parts.map((p, i) => terms.some((t: string) => p.toLowerCase() === t.toLowerCase())
    ? <mark key={i} style={{ background: '#ffe45e' }}>{p}</mark> : <span key={i}>{p}</span>)}</span>)
}

export default function CandidateDetailPage() {
  const { candidateId = '' } = useParams()
  const [tab, setTab] = useState('Resume')
  const [d, setD] = useState<any>(null)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState<any>(null)
  const [note, setNote] = useState('')

  const load = async () => { try { setD(await adminApi.candidate(candidateId)) } catch {} }
  useEffect(() => { load() }, [candidateId])
  useEffect(() => {
    const t = setTimeout(async () => {
      try { setIdx(await adminApi.resumeSearch(candidateId, q)) } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [q, candidateId])
  const act = async (s: string) => { try { await adminApi.setStatus(candidateId, s); load() } catch {} }
  const addNote = async () => { if (!note.trim()) return; try { await adminApi.note(candidateId, note); setNote(''); load() } catch {} }

  const visibleSections = useMemo(() => {
    if (!idx || !q.trim()) return null // null = show full resume
    return idx.sections
  }, [idx, q])

  return (<div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0 }}>{d?.name || `Candidate ${candidateId}`}</h2>
      <StatusChip status={d?.resume_status || 'none'} />
      {d?.scores && (<span style={{ display: 'flex', gap: 6 }}>
        <ScoreBadge score={d.scores.overall} /><span style={{ fontSize: 12 }}>ATS {d.scores.ats} • fit {d.scores.role_fit}</span></span>)}
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {['shortlisted', 'rejected', 'follow_up'].map(s => (<button key={s} className="btn-dark" onClick={() => act(s)}>{s}</button>))}
      </span>
    </div>

    {/* index search — resume refreshes from this */}
    <div className="card" style={{ padding: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Indexed resume search — e.g. React, metrics, GitHub… (highlights as you type)"
          style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: 10 }} />
        {q && <button onClick={() => setQ('')} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '0 14px' }}>Clear</button>}
      </div>
      {idx && q.trim() && <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        {idx.indexed && <span className="chip" style={{ background: 'var(--tea-green)', marginRight: 6 }}>stored index</span>}
        Index: <b>{idx.total} hits</b> across <b>{idx.section_count} sections</b> for “{idx.query}” — resume below refreshes to matches only.</div>}
    </div>

    <div style={{ marginTop: 12 }}><Tabs tabs={['Resume', 'Extraction', 'Analysis', 'Links', 'Interview', 'Notes']} value={tab} onChange={setTab} />

      {tab === 'Resume' && (
        visibleSections
          ? (visibleSections.length
            ? visibleSections.map((s: any, i: number) => (
              <div key={i} className="card" style={{ padding: 12, marginBottom: 8, borderLeft: '4px solid #ffe45e' }}>
                <div style={{ fontSize: 12, color: '#666' }}>{s.section} • {s.hits} hits • {s.matched_terms.join(', ')}</div>
                <div><Hi text={s.snippet} terms={idx.terms} /></div>
              </div>))
            : <div className="card" style={{ padding: 16 }}>No index hits — try fewer terms.</div>)
          : (<div className="card" style={{ padding: 16 }}>
            {!d?.profile ? 'Loading resume…' : (<>
              <h3>{d.profile.personal_information?.full_name}</h3>
              <p>{d.profile.personal_information?.email} • {d.profile.personal_information?.phone} • {d.profile.personal_information?.target_role}</p>
              <h4>Skills</h4><p>{(d.profile.skills?.technical_skills || []).join(', ')}</p>
              <h4>Projects ({(d.profile.projects || []).length})</h4>
              {(d.profile.projects || []).map((p: any, i: number) => (<div key={i} style={{ marginBottom: 8 }}><b>{p.project_title}</b> [{(p.tech_stack || []).join(', ')}]<div>{p.description}</div></div>))}
              <h4>Experience</h4>{(d.profile.work_experience || []).map((e: any, i: number) => <div key={i}>{e.role_title} @ {e.company_name}</div>)}
            </>)}
          </div>)
      )}
      {tab === 'Extraction' && <div className="card" style={{ padding: 14 }}><h4>Confidence</h4><pre>{JSON.stringify(d?.confidence, null, 2)}</pre></div>}
      {tab === 'Analysis' && <div className="card" style={{ padding: 14 }}>
        <p>Overall {d?.scores?.overall} • ATS {d?.scores?.ats} • Role fit {d?.scores?.role_fit} • Links {d?.scores?.links}</p>
        <Link to={d?.resume_id ? `/workspace/dashboard/${d.resume_id}` : '#'}>Open student dashboard →</Link></div>}
      {tab === 'Links' && <div className="card" style={{ padding: 14 }}>{(d?.links || []).map((l: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}><IconExternal size={13} /> <span>{l.platform} — {l.url}</span> <StatusChip status={l.status} /></div>))}{!(d?.links || []).length && 'No links extracted.'}</div>}
      {tab === 'Interview' && <div className="card" style={{ padding: 14 }}>{(d?.interviews || []).map((v: any) => (
        <div key={v.room}>{v.room} — {v.status} • {v.phase} • {v.score ?? '—'} <Link to={`/workspace/interview/${v.room}/report`}>report →</Link></div>))}{!(d?.interviews || []).length && 'No interviews yet.'}</div>}
      {tab === 'Notes' && (<div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}><input value={note} onChange={e => setNote(e.target.value)} placeholder="Add admin note…" style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: 8 }} />
          <button className="btn-dark" onClick={addNote}>Add</button></div>
        {(d?.notes || []).map((n: any, i: number) => <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}><b>{n.action}</b> — {n.note} <span style={{ color: '#999' }}>{n.at}</span></div>)}
      </div>)}
    </div>
  </div>)
}
