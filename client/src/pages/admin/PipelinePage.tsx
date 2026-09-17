import { useState } from 'react'
const STAGES = ['New', 'Analyzed', 'Interview', 'Shortlisted', 'Hired']
export default function PipelinePage() {
  const [cards] = useState([{ id: '1', name: 'Demo Student', stage: 'Analyzed' }])
  return (<div><h2>Pipeline (Kanban)</h2><div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length},1fr)`, gap: 12 }}>{STAGES.map(s => (<div key={s} className="card-soft" style={{ padding: 12 }}><h4>{s}</h4>{cards.filter(c => c.stage === s).map(c => <div key={c.id} className="card" style={{ padding: 8 }}>{c.name}</div>)}</div>))}</div></div>)
}
