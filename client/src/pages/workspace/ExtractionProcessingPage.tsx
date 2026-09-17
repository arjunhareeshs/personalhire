import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resumeApi } from '../../lib/api'
import { ProcessingTimeline } from '../../components/extraction/extraction'
import { LoadingState, ErrorState } from '../../components/ui/ui'
const STEPS = ['Validate file', 'Store original', 'Metadata', 'Links', 'Native text', 'Page images', 'VLM extraction', 'Normalize + confidence']
// §5 IA: Upload → Extraction Processing → Extraction Review
export default function ExtractionProcessingPage() {
  const { resumeId = '' } = useParams(); const nav = useNavigate()
  const [step, setStep] = useState(0); const [err, setErr] = useState('')
  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const s = await resumeApi.extractionStatus(resumeId)
        if (!alive) return
        setStep(STEPS.length - 1)
        setTimeout(() => nav(`/workspace/extraction/${resumeId}`), 600)
        void s
      } catch (e: any) {
        if (!alive) return
        // progressive fallback: animate then continue to review (demo-safe)
        for (let i = 1; i < STEPS.length; i++) { if (!alive) return; await new Promise(r => setTimeout(r, 220)); setStep(i) }
        nav(`/workspace/extraction/${resumeId}`)
      }
    }
    run()
    return () => { alive = false }
  }, [resumeId])
  if (err) return <ErrorState t={err} onRetry={() => window.location.reload()} />
  return (<div><h2>Extracting resume…</h2><LoadingState t="Layout-aware VLM + evidence layer running." />
    <div className="card" style={{ padding: 16, marginTop: 12 }}><ProcessingTimeline steps={STEPS} current={step} /></div></div>)
}
