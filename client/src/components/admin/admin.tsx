// §16.9 Admin components
export function AdminMetricCard({ label, value }: any) {
  return <div className="card" style={{ padding: 16 }}><div>{label}</div><h2>{value}</h2></div>
}
export function CandidateTable({ rows }: any) {
  return (<table style={{ width: '100%' }}><thead><tr><th>Name</th><th>Role</th><th>ATS</th><th>Status</th></tr></thead><tbody>{(rows || []).map((c: any) => <tr key={c.candidate_id}><td>{c.name}</td><td>{c.target_role}</td><td>{c.ats_score}</td><td>{c.status}</td></tr>)}</tbody></table>)
}
export function CandidateFilters({ onFilter }: any) {
  return <div style={{ display: 'flex', gap: 8 }}><input placeholder="role" id="f-role" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8 }} /><input placeholder="min ATS" id="f-ats" type="number" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, width: 110 }} /><button className="btn-dark" onClick={() => onFilter({ role: (document.getElementById('f-role') as any)?.value, ats: (document.getElementById('f-ats') as any)?.value })}>Filter</button></div>
}
export function BulkUploadPanel({ onUpload }: any) {
  return <div className="card" style={{ padding: 16 }}><input type="file" multiple onChange={e => e.target.files && onUpload(Array.from(e.target.files))} /><p>Hash-dedup • async queue • per-file status.</p></div>
}
export function CandidateProfileHeader({ name, status }: any) {
  return <div><h2>{name}</h2><span className="chip" style={{ background: 'var(--beige)' }}>{status}</span></div>
}
export function AdminDecisionPanel({ onAct }: any) {
  return (<div style={{ display: 'flex', gap: 8 }}>{['shortlisted', 'rejected', 'follow_up'].map(s => <button key={s} className="btn-dark" onClick={() => onAct(s)}>{s}</button>)}</div>)
}
export function InterviewReportViewer({ report }: any) {
  return <div className="card" style={{ padding: 16 }}><h4>Interview report</h4><pre>{JSON.stringify(report || {}, null, 2)}</pre></div>
}
export function JobMonitorTable({ jobs, onRetry }: any) {
  return (<div>{(jobs || []).map((j: any) => <div key={j.id} className="card" style={{ padding: 10, marginBottom: 6 }}>{j.job_type} — {j.status} <button onClick={() => onRetry(j.id)}>Retry</button></div>)}</div>)
}
export function PipelineBoard({ stages, cards }: any) {
  return (<div style={{ display: 'grid', gridTemplateColumns: `repeat(${(stages || []).length},1fr)`, gap: 12 }}>{(stages || []).map((s: string) => (<div key={s} className="card-soft" style={{ padding: 12 }}><h4>{s}</h4>{(cards || []).filter((c: any) => c.stage === s).map((c: any) => <div key={c.id} className="card" style={{ padding: 8 }}>{c.name}</div>)}</div>))}</div>)
}
