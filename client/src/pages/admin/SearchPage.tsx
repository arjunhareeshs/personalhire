import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../lib/api'
export default function SearchPage() {
  const [q, setQ] = useState('React candidates with ATS above 60')
  const [res, setRes] = useState<any>(null); const [stats, setStats] = useState<any>(null)
  const go = async () => { try { setRes(await adminApi.search(q)) } catch { setRes({ count: 0, candidates: [] }) } }
  const rebuild = async () => { try { await adminApi.indexRebuild(); setStats(await adminApi.indexStats()) } catch {} }
  useEffect(() => { adminApi.indexStats().then(setStats).catch(() => {}) }, [])
  return (<div><h2>Stored-index search</h2>
    <p style={{ color: '#666', fontSize: 13 }}>No chat text is scanned. Every query runs NLP → BM25 over the <b>stored resume index</b>
      {stats && <span> ({stats.documents} resumes, {stats.vocab} terms)</span>} <button onClick={rebuild} style={{ marginLeft: 8 }}>Rebuild index</button></p>
    <div style={{ display: 'flex', gap: 8 }}><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
      placeholder='e.g. "machine learning" python ATS above 70' style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: 10 }} />
      <button className="btn-dark" onClick={go}>Search</button></div>
    {res && (<div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, color: '#666' }}>{res.explanation} — <b>{res.count}</b> candidates</div>
      {(res.candidates || []).map((c: any) => (<div key={c.candidate_id} className="card" style={{ padding: 12, marginTop: 8 }}>
        <Link to={`/admin/candidates/${c.candidate_id}`}><b>{c.name}</b></Link> — {c.target_role} • ATS {c.ats_score}
        {c.bm25 > 0 && <span className="chip" style={{ background: '#ffe45e', marginLeft: 8 }}>index {c.bm25}</span>}
        <div style={{ fontSize: 12, color: '#666' }}>[{c.matched_terms.join(', ')}] — {c.why}</div>
      </div>))}
      {!res.count && <p>No index hits — try fewer terms, check spelling (fuzzy matches typos), or rebuild the index.</p>}
    </div>)}
  </div>)
}
