import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
export default function AdminDashboard() {
  const [d, setD] = useState<any>({ total_candidates: 128, avg_ats: 74, failed_jobs: 3 })
  useEffect(() => { adminApi.dashboard().then(setD).catch(() => {}) }, [])
  return (<div><h2>Admin dashboard</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12 }}>
      {[['Candidates', d.total_candidates], ['Avg ATS', d.avg_ats], ['Failed jobs', d.failed_jobs], ['Shortlisted', 24]].map(([l, v]: any) => (<div key={l} className="card" style={{ padding: 16 }}><div>{l}</div><h2>{v}</h2></div>))}
    </div>
    <div className="card" style={{ padding: 16, marginTop: 12 }}>Charts: candidates by role • score trends • link health • processing status (precomputed summaries, lazy detail).</div>
  </div>)
}
