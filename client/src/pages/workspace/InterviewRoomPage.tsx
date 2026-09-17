import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../../lib/api'
import { IconMic, IconMicOff } from '../../components/ui/icons'

type VState = 'Ready' | 'Listening' | 'Thinking' | 'Speaking'
const CYAN = '#24d9f2'

/* ---------- bead engine: dotted strip + center ring, cyan glow ---------- */
function useBeads(ref: React.RefObject<HTMLCanvasElement>, stateRef: React.MutableRefObject<VState>, levelRef: React.MutableRefObject<number>) {
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    let raf = 0
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = cv.clientWidth, h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit(); window.addEventListener('resize', fit)
    const N = 46
    const draw = (t: number) => {
      const w = cv.clientWidth, h = cv.clientHeight
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2, gap = Math.min(15, w / (N + 4))
      const st = stateRef.current, lvl = levelRef.current
      for (let i = 0; i < N; i++) {
        const x = cx + (i - (N - 1) / 2) * gap
        const dc = Math.abs(i - (N - 1) / 2) / (N / 2) // 0 center → 1 edge
        let glow = 0, r = 2.4
        if (st === 'Speaking') {
          const wave = Math.max(0, Math.sin(t / 260 - dc * 5)) * (1 - dc)
          glow = 0.35 + wave * 0.65; r = 2.4 + wave * 2.6
        } else if (st === 'Listening') {
          glow = (1 - dc) * (0.25 + lvl * 0.75); r = 2.4 + (1 - dc) * lvl * 2.2
        } else if (st === 'Thinking') {
          const trav = Math.max(0, Math.sin(t / 500 - i * 0.35))
          glow = trav * 0.5; r = 2.4 + trav * 1.2
        } else {
          glow = (1 - dc) * 0.12
        }
        ctx.beginPath()
        ctx.fillStyle = glow > 0.08 ? CYAN : '#3b4451'
        ctx.globalAlpha = glow > 0.08 ? Math.min(1, 0.35 + glow) : 0.9
        ctx.shadowBlur = glow > 0.08 ? 12 * glow : 0
        ctx.shadowColor = CYAN
        ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      // center ring + bead (screenshot)
      const breathe = st === 'Ready' ? 1 + Math.sin(t / 900) * 0.03 : 1
      ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5
      ctx.arc(cx, cy, 46 * breathe, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.fillStyle = st === 'Speaking' ? CYAN : '#9aa5b1'
      ctx.shadowBlur = st === 'Speaking' ? 16 : 6; ctx.shadowColor = st === 'Speaking' ? CYAN : '#9aa5b1'
      ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [])
}

export default function InterviewRoomPage() {
  const { roomName = '' } = useParams(); const nav = useNavigate()
  const [sec, setSec] = useState(0)
  const [vstate, setVstate] = useState<VState>('Ready')
  const [phase, setPhase] = useState('Introduction')
  const [caption, setCaption] = useState('Preparing your resume-grounded session…')
  const [showCap, setShowCap] = useState(true)
  const [muted, setMuted] = useState(false)
  const [demo, setDemo] = useState(true)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const stateRef = useRef<VState>('Ready'); const levelRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  useBeads(canvasRef, stateRef, levelRef)
  const setVS = (s: VState) => { stateRef.current = s; setVstate(s) }

  // timer
  useEffect(() => { const t = setInterval(() => setSec(s => s + 1), 1000); return () => clearInterval(t) }, [])

  // mic level (drives beads when user speaks; works without STT)
  useEffect(() => {
    let stop = false, raf = 0
    navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
      if (stop) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      const ac = new AC(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser()
      an.fftSize = 256; src.connect(an)
      const buf = new Uint8Array(an.frequencyBinCount)
      const loop = () => {
        if (muted) { levelRef.current *= 0.9 }
        else { an.getByteFrequencyData(buf); levelRef.current = Math.min(1, (buf.slice(2, 20).reduce((a, b) => a + b, 0) / 18 / 255) * 1.6) }
        if (stateRef.current === 'Listening') raf = requestAnimationFrame(loop)
        else setTimeout(() => { if (stateRef.current === 'Listening' && !stop) raf = requestAnimationFrame(loop) }, 300)
      }
      loop()
    }).catch(() => {})
    return () => { stop = true; cancelAnimationFrame(raf); streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [muted])

  // load opening + token mode
  useEffect(() => {
    interviewApi.token(roomName, 'student').then(t => setDemo(!!t.demo)).catch(() => setDemo(true))
    interviewApi.session(roomName).then(s => {
      const last = [...(s.messages || [])].reverse().find((m: any) => m.role === 'assistant')
      if (last) setCaption(last.content)
      if (s.phase) setPhase(label(s.phase))
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName])
  const label = (p: string) => ({ introduction: 'Introduction', resume_walkthrough: 'Resume Walkthrough', project_deep_dive: 'Project Deep Dive', technical: 'Technical Skills', critical_thinking: 'Critical Thinking', behavioral: 'Behavioral', closing: 'Closing' } as any)[p] || p

  // poll phase
  useEffect(() => {
    const t = setInterval(() => {
      interviewApi.status(roomName).then(s => { if (s.phase_label) setPhase(s.phase_label) }).catch(() => {})
    }, 4000)
    return () => clearInterval(t)
  }, [roomName])

  // try real LiveKit voice; silent fallback to text mode
  useEffect(() => {
    let room: any = null, alive = true
    const join = async () => {
      try {
        const t = await interviewApi.token(roomName, 'student')
        if (t.demo || !t.token?.includes('.')) return
        const LK = await import('livekit-client')
        room = new LK.Room()
        room.on(LK.RoomEvent.ActiveSpeakersChanged, (sp: any[]) => {
          if (!alive) return
          const agent = sp.some(p => p.isAgent || p.identity?.includes('agent'))
          setVS(agent ? 'Speaking' : 'Listening')
        })
        await room.connect(t.url, t.token)
        await room.localParticipant.setMicrophoneEnabled(true)
      } catch { /* text mode */ }
    }
    join()
    return () => { alive = false; try { room?.disconnect() } catch {} }
  }, [roomName])

  const send = async () => {
    const msg = text.trim(); if (!msg || busy) return
    setText(''); setBusy(true); setVS('Listening')
    setTimeout(() => setVS('Thinking'), 900)
    try {
      const r = await interviewApi.message(roomName, msg)
      setVS('Speaking')
      if (r.phase_label) setPhase(r.phase_label)
      if (r.reply) { setCaption(r.reply); speak(r.reply) }
      if (r.ended) setCaption('Wrapping up — generating your report…')
      setTimeout(() => { if (stateRef.current === 'Speaking') setVS('Ready') }, 3500)
    } catch { setVS('Ready') }
    setBusy(false)
  }
  const speak = (t: string) => {
    try {
      if (muted || !('speechSynthesis' in window)) return
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(t.slice(0, 280)); u.rate = 1.05
      speechSynthesis.speak(u)
    } catch {}
  }

  const end = async () => {
    try { speechSynthesis?.cancel() } catch {}
    try { await interviewApi.end(roomName) } catch {}
    nav(`/workspace/interview/${roomName}/report`)
  }

  const mm = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  return (<div className="interview-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px 32px' }}>
    {/* header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ letterSpacing: 4, fontSize: 13, color: '#8b93a1' }}>INTERVIEW SESSION</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'white', marginTop: 4 }}>AI Interviewer</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <span style={{ background: 'rgba(20,24,30,.9)', borderRadius: 14, padding: '10px 16px', color: 'white', fontFamily: 'monospace', fontSize: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: CYAN }}>◷</span> {mm}</span>
        <span style={{ background: 'rgba(20,24,30,.9)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '10px 16px', color: '#aab4c0', fontSize: 13, letterSpacing: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: demo ? '#8b93a1' : '#3ddc84' }} /> {demo ? 'DEMO • CONNECTED' : 'CONNECTED'}</span>
      </div>
    </div>
    {/* beads */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
      <canvas ref={canvasRef} style={{ width: 'min(680px, 80vw)', height: 130 }} />
      <h2 style={{ color: 'white', margin: '10px 0 4px', fontSize: 22 }}>{vstate}</h2>
      <div style={{ color: '#7d8694', fontSize: 14 }}>Interview in progress • {phase}</div>
      {showCap && <div style={{ color: '#c6cdd6', fontSize: 15, maxWidth: 640, textAlign: 'center', marginTop: 12, minHeight: 24 }}>“{caption}”</div>}
    </div>
    {/* bottom */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {demo && (<div style={{ display: 'flex', gap: 8, width: 'min(560px, 90vw)' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Speak or type your answer…" disabled={busy}
          style={{ flex: 1, background: 'rgba(20,24,30,.9)', border: '1px solid rgba(255,255,255,.15)', color: 'white', borderRadius: 12, padding: '12px 16px' }} />
        <button onClick={send} disabled={busy} style={{ background: CYAN, color: '#04222a', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 800 }}>Send</button>
      </div>)}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => setMuted(m => !m)} title={muted ? "Unmute Microphone" : "Mute Microphone"} style={{ background: muted ? 'rgba(255,107,99,.15)' : 'rgba(20,24,30,.9)', color: muted ? '#ff6b63' : 'white', border: `1px solid ${muted ? 'rgba(255,107,99,.4)' : 'rgba(255,255,255,.15)'}`, borderRadius: 999, width: 46, height: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {muted ? <IconMicOff size={18} /> : <IconMic size={18} />}
        </button>
        <button onClick={end} style={{ background: 'rgba(255,107,99,.14)', color: '#ff6b63', border: '1px solid rgba(255,107,99,.4)', borderRadius: 999, padding: '12px 30px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Conclude Interview
        </button>
        <button onClick={() => setShowCap(v => !v)} title="Toggle Live Captions" style={{ background: showCap ? 'rgba(36,217,242,.2)' : 'rgba(20,24,30,.9)', color: showCap ? '#24d9f2' : 'white', border: `1px solid ${showCap ? 'rgba(36,217,242,.4)' : 'rgba(255,255,255,.15)'}`, borderRadius: 999, width: 46, height: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          CC
        </button>
      </div>
    </div>
  </div>)
}
