import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'
export default function MonitoringPage() {
  const [jobs, setJobs] = useState<any[]>([])
  useEffect(() => { adminApi.jobs().then(r => setJobs(r.jobs || [])).catch(() => setJobs([{ id: 'j1', job_type: 'extraction', status: 'completed' }])) }, [])
  return (<div><h2>Monitoring</h2>{jobs.map(j => (<div key={j.id} className="card" style={{ padding: 12, marginBottom: 8 }}>{j.job_type} — {j.status} <button onClick={() => adminApi.retryJob(j.id).catch(() => {})}>Retry</button></div>))}</div>)
}
