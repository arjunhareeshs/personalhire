import React from 'react'
import { IconCheckCircle, IconAlertCircle, IconAlertTriangle } from './icons'

export function Button({ children, onClick, variant = 'dark', className = '', ...props }: any) {
  const cls = variant === 'bronze' ? 'btn-bronze' : variant === 'secondary' ? 'btn-secondary' : 'btn-dark'
  return (
    <button onClick={onClick} className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input(props: any) {
  return (
    <input
      {...props}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '9px 12px',
        width: '100%',
        fontSize: 14,
        outline: 'none',
        background: 'var(--white)',
        color: 'var(--ink)',
        transition: 'border-color 0.15s ease',
        ...props.style
      }}
    />
  )
}

export function Textarea(props: any) {
  return (
    <textarea
      {...props}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '10px 12px',
        width: '100%',
        minHeight: 90,
        fontSize: 14,
        outline: 'none',
        background: 'var(--white)',
        color: 'var(--ink)',
        fontFamily: 'inherit',
        lineHeight: 1.5,
        ...props.style
      }}
    />
  )
}

export function StatusChip({ status }: { status: string }) {
  const isGood = status === 'verified' || status === 'completed' || status === 'active' || status === 'complete'
  const isBad = status === 'failed' || status === 'broken' || status === 'rejected'
  const bg = isGood ? 'var(--tea-green)' : isBad ? '#fee2e2' : 'var(--papaya-whip)'
  const color = isBad ? '#991b1b' : 'var(--ink)'
  return (
    <span className="chip" style={{ background: bg, color }}>
      {isGood && <IconCheckCircle size={13} />}
      {isBad && <IconAlertTriangle size={13} />}
      <span>{status}</span>
    </span>
  )
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const isHigh = score >= 80
  const isMid = score >= 60
  const bg = isHigh ? 'var(--tea-green)' : isMid ? 'var(--papaya-whip)' : '#fee2e2'
  const color = isHigh ? '#14532d' : isMid ? '#78350f' : '#991b1b'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        background: bg,
        color,
        fontWeight: 800,
        fontSize: 18,
        padding: '4px 12px',
        borderRadius: 8,
        letterSpacing: -0.5
      }}>
        {score}<span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}>/100</span>
      </span>
      {label && <span style={{ fontSize: 13, color: 'var(--muted-ink)' }}>{label}</span>}
    </div>
  )
}

export function ProgressBar({ v, color = 'var(--light-bronze)' }: { v: number; color?: string }) {
  return (
    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, v))}%`, height: 6, background: color, borderRadius: 999, transition: 'width 0.3s ease' }} />
    </div>
  )
}

export function EmptyState({ t, action }: { t: string; action?: React.ReactNode }) {
  return (
    <div className="card-soft" style={{ padding: 36, textAlign: 'center' }}>
      <div style={{ color: 'var(--muted-ink)', fontSize: 14, marginBottom: action ? 12 : 0 }}>{t}</div>
      {action}
    </div>
  )
}

export function ErrorState({ t, onRetry }: any) {
  return (
    <div className="card" style={{ padding: 24, borderColor: 'var(--danger)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>
        <IconAlertCircle size={18} />
        <span>Error</span>
      </div>
      <p style={{ margin: '0 0 14px 0', fontSize: 14 }}>{t}</p>
      {onRetry && <button className="btn-dark" onClick={onRetry}>Retry</button>}
    </div>
  )
}

export function LoadingState({ t = 'Loading...' }: any) {
  return (
    <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--muted-ink)', fontSize: 14 }}>
      <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--line)', borderTopColor: 'var(--black)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 10 }} />
      <div>{t}</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }: any) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, width: 'fit-content', marginBottom: 20, flexWrap: 'wrap' }}>
      {tabs.map((t: string) => {
        const active = value === t
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: active ? 'var(--white)' : 'transparent',
              color: active ? 'var(--black)' : 'var(--muted-ink)',
              fontWeight: active ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}

export function IconButton({ children, onClick, title }: any) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'var(--white)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        width: 34,
        height: 34,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease'
      }}
    >
      {children}
    </button>
  )
}

export function Select({ options, value, onChange }: any) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '9px 12px',
        width: '100%',
        background: 'var(--white)',
        fontSize: 14,
        color: 'var(--ink)'
      }}
    >
      {options.map((o: any) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return <option key={v} value={v}>{l}</option>
      })}
    </select>
  )
}

export function Dialog({ open, onClose, children }: any) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ padding: 24, minWidth: 320, maxWidth: 540, boxShadow: 'var(--shadow-md)' }}>
        {children}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, children }: any) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: 'white', borderLeft: '1px solid var(--line)', padding: 20, zIndex: 50, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
      <button onClick={onClose} className="btn-secondary" style={{ marginBottom: 16, padding: '4px 10px', fontSize: 12 }}>
        ✕ Close
      </button>
      {children}
    </div>
  )
}

let _toast: ((m: string) => void) | null = null
export function ToastHost({ onReady }: any) {
  const [msgs, setMsgs] = React.useState<string[]>([])
  React.useEffect(() => { _toast = (m: string) => setMsgs(p => [...p, m]); onReady?.(_toast) }, [onReady])
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 60, display: 'grid', gap: 8 }}>
      {msgs.map((m, i) => (
        <div key={i} className="card" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-md)' }}>
          {m}
        </div>
      ))}
    </div>
  )
}
export function toast(m: string) { _toast?.(m) }

