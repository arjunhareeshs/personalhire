import React from 'react'
import { IconCheckCircle, IconResume } from '../ui/icons'

// §16.3 Resume and Extraction components
export function ResumeDropzone({ onPick }: { onPick: (f: File) => void }) {
  return (
    <div className="card-soft" style={{ padding: 28, borderStyle: 'dashed' }}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onPick(f) }}>
      <input type="file" accept=".pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
      <p style={{ color: 'var(--muted-ink)' }}>PDF / DOCX only. Drag & drop or browse.</p>
    </div>
  )
}

export function UploadProgress({ pct }: { pct: number }) {
  return (
    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: 6, background: 'var(--black)', borderRadius: 999, transition: 'width 200ms ease' }} />
    </div>
  )
}

export function ProcessingTimeline({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, opacity: i <= current ? 1 : 0.35 }}>
          {i < current ? (
            <span style={{ color: '#14532d' }}><IconCheckCircle size={15} /></span>
          ) : i === current ? (
            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--black)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--line)' }} />
          )}
          <span>{s}</span>
        </div>
      ))}
    </div>
  )
}

export function ExtractionSectionList({ sections, value, onChange }: any) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      {sections.map((s: string) => {
        const active = value === s
        return (
          <div
            key={s}
            onClick={() => onChange(s)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              background: active ? 'var(--black)' : 'transparent',
              color: active ? 'white' : 'var(--ink)',
              transition: 'all 0.15s ease'
            }}
          >
            {s}
          </div>
        )
      })}
    </div>
  )
}

export function ExtractionFieldEditor({ label, value, confidence, onChange }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {label} <ConfidenceBadge v={confidence} />
      </label>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13.5
        }}
      />
    </div>
  )
}

export function ResumePreview({ filename, pages }: any) {
  return (
    <div className="card-soft" style={{ padding: 16 }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700 }}>Source Document: {filename}</h4>
      <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
        {(pages || []).map((p: any) => (
          <div key={p.page_number} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconResume size={14} />
            <span>Page {p.page_number} — {p.width}×{p.height} ({p.dpi} DPI)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConfidenceBadge({ v }: { v?: number }) {
  if (v == null) return null
  const low = v < 0.5
  return (
    <span className="chip" style={{ background: low ? 'var(--papaya-whip)' : 'var(--tea-green)', fontSize: 11, padding: '1px 6px' }}>
      {low ? `low ${Math.round(v * 100)}%` : `${Math.round(v * 100)}%`}
    </span>
  )
}

