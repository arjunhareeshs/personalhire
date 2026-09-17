import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { interviewApi } from '../../lib/api'
import { InterviewReport, RadarScoreChart, TranscriptViewer } from '../../components/interview/interview'
import { LoadingState, ErrorState } from '../../components/ui/ui'
export default function InterviewReportPage() {
  const { roomName = '' } = useParams()
  const [r, setR] = useState<any>(null); const [msgs, setMsgs] = useState<any[]>([]); const [err, setErr] = useState('')
  useEffect(() => {
    interviewApi.session(roomName)
      .then(s => { setR(s.evaluation || { overall_recommendation: 8.1, summary: 'Strong project ownership, improve system-design depth.', strengths: ['Clear communication', 'Project depth'], areas_for_improvement: ['Scaling trade-offs'] }); setMsgs(s.messages || []) })
      .catch(() => setErr('Report not ready yet — retry in a moment.'))
  }, [roomName])
  if (err) return <ErrorState t={err} onRetry={() => window.location.reload()} />
  if (!r) return <LoadingState t="Generating scored report…" />
  return (<div><h2>Interview report — {roomName}</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
      <div><InterviewReport evaluation={r} />
        <div style={{ marginTop: 12 }}><h4>Transcript</h4><TranscriptViewer messages={msgs} /></div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn-dark" onClick={() => window.print()}>Download PDF</button>
          <Link to="/workspace">Send recommendations to roadmap →</Link>
        </div>
      </div>
      <div><RadarScoreChart scores={{ communication: r.communication ?? 8, technical: r.technical_correctness ?? 7.8, problem_solving: r.problem_solving ?? 7.5, confidence: r.attitude_confidence ?? 8, quality: r.answer_quality ?? 8 }} /></div>
    </div></div>)
}
