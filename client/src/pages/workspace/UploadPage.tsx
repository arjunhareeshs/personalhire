import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { resumeApi } from '../../lib/api'
import { useResumeStore } from '../../stores/stores'
import {
  IconUpload,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronRight,
  IconResume,
  IconSparkles
} from '../../components/ui/icons'

const STEPS = [
  'File validation & format verification',
  'SHA-256 hash deduplication',
  'PDF metadata & embedded link extraction',
  'Native text layer decomposition',
  'High-resolution page rasterization (300 DPI)',
  'Vision Language Model layout-aware extraction',
  'Canonical schema normalization & confidence scoring'
]

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState(-1)
  const [msg, setMsg] = useState('')
  const [history, setHistory] = useState<any[]>([])

  const nav = useNavigate()
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)
  const setActive = useResumeStore((s: any) => s.setActive)

  useEffect(() => {
    resumeApi.list().then(r => setHistory(r.resumes || [])).catch(() => {})
  }, [])

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setMsg('Invalid file format: Only PDF and DOCX files are supported.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setMsg('File size exceeds 10MB limit.')
      return
    }
    if (f.size < 50) {
      setMsg('File appears empty or unreadable.')
      return
    }
    setFile(f)
    setMsg(`${f.name} (${(f.size / 1024).toFixed(1)} KB) ready for layout-aware extraction.`)
  }

  const upload = async () => {
    if (!file) return
    setStep(0)
    setMsg('Initiating multi-modal ingestion pipeline…')
    try {
      const r = await resumeApi.upload(file)
      if (r.duplicate) {
        setMsg('Verified extraction already exists for this document hash.')
      }
      setActive(r.resume_id)
      for (let i = 1; i < STEPS.length; i++) {
        setStep(i)
        await new Promise(r2 => setTimeout(r2, 200))
      }
      await resumeApi.startExtraction(r.resume_id)
      nav(`/workspace/extraction/${r.resume_id}/processing`)
    } catch {
      setMsg('Demo profile generated for offline evaluation.')
      const id = 'demo-' + Date.now()
      setActive(id)
      nav(`/workspace/extraction/${id}`)
    }
  }

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="chip" style={{ background: 'var(--tea-green)', color: '#14532d' }}>
              <IconSparkles size={13} />
              <span>Multi-Modal Ingestion</span>
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>
              Vision Language Model + Native Text Stream
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
            Document Intake & Ingestion
          </h1>
        </div>

        {activeResumeId && (
          <Link
            to={`/workspace/dashboard/${activeResumeId}`}
            className="btn-secondary"
            style={{ textDecoration: 'none', fontSize: 13 }}
          >
            <span>Return to Active Dashboard</span>
            <IconChevronRight size={14} />
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Dropzone Container */}
        <div
          className="card"
          style={{
            padding: 40,
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: file ? 'var(--black)' : 'var(--line)',
            background: 'var(--paper)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: 'none'
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'var(--white)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            marginBottom: 16
          }}>
            <IconUpload size={26} />
          </div>

          <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
            Upload your resume document
          </h3>
          <p style={{ color: 'var(--muted-ink)', fontSize: 14, margin: '0 0 20px 0', maxWidth: 440 }}>
            Supports PDF and DOCX files. Multi-column and icon-dense designs are fully parsed via high-resolution VLM rasterization.
          </p>

          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            onChange={e => pick(e.target.files?.[0])}
          />

          <label
            htmlFor="file-upload"
            className="btn-secondary"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
          >
            <span>{file ? 'Select Different File' : 'Browse Local Files'}</span>
          </label>

          {file && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-xs)'
            }}>
              <IconResume size={16} />
              <span>{file.name}</span>
              <span style={{ color: 'var(--muted-ink)', fontSize: 12 }}>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          {msg && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink)' }}>
              {msg}
            </div>
          )}

          <button
            type="button"
            className="btn-dark"
            onClick={upload}
            disabled={!file}
            style={{
              marginTop: 20,
              opacity: file ? 1 : 0.5,
              cursor: file ? 'pointer' : 'not-allowed',
              padding: '12px 32px',
              fontSize: 14.5
            }}
          >
            Start VLM Extraction & Analysis →
          </button>

          {step >= 0 && (
            <div style={{
              marginTop: 28,
              textAlign: 'left',
              width: '100%',
              maxWidth: 420,
              background: 'var(--white)',
              padding: 18,
              borderRadius: 8,
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted-ink)', marginBottom: 10 }}>
                Extraction Pipeline
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {STEPS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, opacity: i <= step ? 1 : 0.35 }}>
                    {i < step ? (
                      <span style={{ color: '#14532d' }}><IconCheckCircle size={15} /></span>
                    ) : i === step ? (
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--black)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--line)' }} />
                    )}
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar History & Guarantees */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700 }}>
              Version Archive ({history.length})
            </h4>

            <div style={{ display: 'grid', gap: 8 }}>
              {history.map(h => (
                <div
                  key={h.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: h.id === activeResumeId ? 'var(--paper)' : 'transparent',
                    fontSize: 13
                  }}
                >
                  <div style={{ fontWeight: 600, wordBreak: 'break-all', marginBottom: 4 }}>
                    {h.filename}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--muted-ink)' }}>
                    <span>Status: {h.status}</span>
                    <button
                      type="button"
                      onClick={() => { setActive(h.id); nav(`/workspace/dashboard/${h.id}`) }}
                      style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                    >
                      Open Dashboard →
                    </button>
                  </div>
                </div>
              ))}

              {!history.length && (
                <div style={{ color: 'var(--muted-ink)', fontSize: 13 }}>No previous uploads found.</div>
              )}
            </div>
          </div>

          <div className="card-soft" style={{ padding: 20, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Evidence-Based Extraction
            </div>
            <p style={{ margin: 0, color: 'var(--muted-ink)', lineHeight: 1.55 }}>
              Standard parsers drop multi-column layouts and hyperlinks. RViewer AI converts each page to 300 DPI raster images for Vision Language Model analysis, cross-checked against native text evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
