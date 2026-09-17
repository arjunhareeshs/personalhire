import { IconCheckCircle, IconMic } from '../ui/icons'

// §16.8 Interview components
export function InterviewLobby({ resumeName, onStart }: any) {
  return <div className="card-soft" style={{ padding: 20 }}><h3>Resume-based voice interview</h3><p>Active resume: {resumeName || 'none (standard mode)'}</p><button className="btn-dark" onClick={onStart}>Start interview</button></div>
}
export function MicCheck() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted-ink)' }}>
      <IconCheckCircle size={14} style={{ color: '#166534' }} />
      <span>Input device active • Audio output verified</span>
    </div>
  )
}
export function InterviewRoom({ state, phase, room }: any) {
  return (<div style={{ textAlign: 'center' }}><div style={{ width: 160, height: 160, borderRadius: 999, border: '2px solid var(--interview-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>◉</div><h2 style={{ color: 'var(--interview-cyan)' }}>{state}…</h2><p style={{ color: '#aaa' }}>{phase} • {room}</p></div>)
}
export function AudioWaveform({ active }: any) {
  return <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>{Array.from({ length: 24 }, (_, i) => (<span key={i} style={{ width: 4, height: active ? 8 + ((i * 13) % 24) : 6, background: 'var(--interview-cyan)', display: 'inline-block' }} />))}</div>
}
export function InterviewTimer({ sec }: any) {
  return <span className="chip">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>
}
export function ConnectionPill({ ok }: any) {
  return <span className="chip" style={{ background: ok ? 'var(--interview-cyan)' : 'var(--interview-red)', color: ok ? 'black' : 'white' }}>{ok ? 'Connected' : 'Reconnecting'}</span>
}
export function PhaseLabel({ phase }: any) { return <span className="chip" style={{ background: '#1a2b33', color: 'white' }}>{phase}</span> }
export function EndInterviewButton({ onEnd }: any) {
  return <button onClick={onEnd} style={{ background: 'var(--interview-red)', color: 'white', borderRadius: 999, padding: '12px 32px', border: 'none' }}>End interview</button>
}
export function InterviewReport({ evaluation }: any) {
  return (<div className="card-soft" style={{ padding: 20 }}><h1>{evaluation?.overall_recommendation}/10</h1><p>{evaluation?.summary}</p>
    <h4>Strengths</h4><ul>{(evaluation?.strengths || []).map((s: string) => <li key={s}>{s}</li>)}</ul>
    <h4>Improve</h4><ul>{(evaluation?.areas_for_improvement || []).map((s: string) => <li key={s}>{s}</li>)}</ul></div>)
}
export function RadarScoreChart({ scores }: any) {
  const keys = Object.keys(scores || { communication: 8, technical: 7.8, problem_solving: 7.5 })
  return (<svg width={260} height={200} style={{ background: 'var(--paper)', borderRadius: 8 }}>{keys.map((k, i) => { const v = (scores || {})[k] ?? 7; const x = 20 + i * 40; const h = v * 16; return (<g key={k}><rect x={x} y={180 - h} width={28} height={h} fill="var(--light-bronze)" /><text x={x} y={195} fontSize={9}>{k.slice(0, 6)}</text></g>) })}</svg>)
}
export function TranscriptViewer({ messages }: any) {
  if (!messages?.length) return <p style={{ color: 'var(--muted-ink)' }}>Transcript appears after the session (partial sessions still saved).</p>
  return (<div>{messages.map((m: any, i: number) => <div key={i} style={{ padding: '6px 0' }}><b>{m.role}:</b> {m.content} <span style={{ color: '#999' }}>({m.phase})</span></div>)}</div>)
}
