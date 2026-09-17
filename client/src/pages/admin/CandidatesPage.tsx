import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../lib/api'
export default function CandidatesPage() {
  const [rows, setRows] = useState<any[]>([{ candidate_id: 'demo1', name: 'Demo Student', target_role: 'Full Stack', ats_score: 78, status: 'analyzed' }])
  useEffect(() => { adminApi.candidates().then(r => setRows(r.candidates || rows)).catch(() => {}) }, [])
  return (<div><h2>Candidates</h2>
    <table style={{ width: '100%', marginTop: 12 }}><thead><tr><th>Name</th><th>Role</th><th>ATS</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.map(c => (<tr key={c.candidate_id}><td>{c.name}</td><td>{c.target_role}</td><td>{c.ats_score}</td><td>{c.status}</td><td><Link to={`/admin/candidates/${c.candidate_id}`}>View</Link></td></tr>))}</tbody></table>
  </div>)
}
