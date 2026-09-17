import { IconCheckCircle, IconAlertCircle } from '../ui/icons'

// §16.7 Builder components
export const BUILDER_STEPS = ['Personal', 'Summary', 'Work Experience', 'Education', 'Skills', 'Projects', 'Analyze', 'Publish']
export function BuilderTopBar({ title, onExport, onSave }: any) {
  return (<div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 20px', background: 'white', borderBottom: '1px solid var(--line)' }}>
    <strong>{title || 'Resume Builder'}</strong><span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><button className="btn-bronze" onClick={onSave}>Save</button><button className="btn-dark" onClick={onExport}>Download PDF</button></span></div>)
}
export function BuilderStepper({ step, onStep }: any) {
  return (<div style={{ display: 'flex', gap: 6, padding: 12 }}>{BUILDER_STEPS.map((s, i) => (<button key={s} onClick={() => onStep(i)} style={{ padding: '6px 10px', borderRadius: 999, background: i === step ? 'var(--black)' : 'var(--beige)', color: i === step ? 'white' : 'inherit' }}>{i + 1}. {s}</button>))}</div>)
}
export function BuilderEditorPanel({ children }: any) { return <div className="card" style={{ padding: 16 }}>{children}</div> }
export function BuilderPreview({ children, zoom = 1 }: any) {
  return <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}><div className="a4-preview" style={{ padding: 40 }}>{children}</div></div>
}
export function TemplateGallery({ templates, value, onPick }: any) {
  return (<div><h4>Templates</h4>{(templates || []).map((t: any) => (<div key={t.id || t} onClick={() => onPick(t.id || t)} style={{ padding: 8, border: (value === (t.id || t)) ? '2px solid var(--light-bronze)' : '1px solid var(--line)', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>{t.name || t}</div>))}</div>)
}
export function StylePanel({ accent, onAccent }: any) {
  return (<div><h4>Accent</h4>{['#d4a373', '#2563eb', '#141414', '#637a46'].map(c => (<span key={c} onClick={() => onAccent(c)} style={{ display: 'inline-block', width: 24, height: 24, background: c, borderRadius: 999, marginRight: 8, border: accent === c ? '2px solid black' : 'none', cursor: 'pointer' }} />))}</div>)
}
export function AISuggestionPanel({ onImprove }: any) {
  return (<div><h4>AI Improve</h4>{['Improve summary', 'Fix weak bullets', 'Add metrics', 'ATS-friendly'].map(a => <div key={a}><button className="btn-bronze" style={{ marginBottom: 6 }} onClick={() => onImprove(a)}>{a}</button></div>)}</div>)
}
export function BuilderChecksPanel({ checks }: any) {
  return (<div><h4>Checks</h4>{(checks || ['ATS readable', 'No overflow', 'Links valid']).map((c: string) => <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', fontSize: 13 }}><IconCheckCircle size={13} style={{ color: '#166534' }} /> {c}</div>)}</div>)
}
export function PDFZoomControls({ zoom, onZoom }: any) {
  return (<div style={{ display: 'flex', gap: 6 }}>Zoom <button onClick={() => onZoom(Math.max(0.5, +(zoom - 0.1).toFixed(2)))}>-</button> {Math.round(zoom * 100)}% <button onClick={() => onZoom(Math.min(1.5, +(zoom + 0.1).toFixed(2)))}>+</button></div>)
}
export function SectionReorderControl({ order, onMove }: any) {
  return (<div>{(order || []).map((s: string, i: number) => (<div key={s} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{s}<button onClick={() => onMove(i, -1)}>↑</button><button onClick={() => onMove(i, 1)}>↓</button></div>))}</div>)
}

// ---- High-fidelity gallery + style controls (screenshot-grade) ----
export function TemplateThumbnail({ t, active, name }: any) {
  const accent = (t.swatches || [])[0] || '#141414'
  const sidebar = t.layout === 'two_column_sidebar'
  const serif = (t.font || '').toLowerCase().includes('georgia')
  return (<div style={{ border: active ? '2px solid #5b50e6' : '1px solid var(--line)', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
    <div style={{ height: 150, display: 'flex', fontFamily: serif ? 'Georgia, serif' : 'Inter, sans-serif' }}>
      {sidebar && <div style={{ width: 52, background: accent, opacity: 0.85, padding: 6 }}>
        <div style={{ height: 5, background: 'rgba(255,255,255,.9)', marginBottom: 4 }} />
        {[22, 30, 18].map((w, i) => <div key={i} style={{ height: 3, width: w, background: 'rgba(255,255,255,.7)', marginBottom: 3 }} />)}
      </div>}
      <div style={{ flex: 1, padding: 8 }}>
        <div style={{ height: 7, width: '70%', background: '#222', marginBottom: 3, marginLeft: t.header === 'centered_serif' ? '15%' : 0 }} />
        <div style={{ height: 3, width: '90%', background: accent, marginBottom: 6 }} />
        {[85, 95, 75, 90, 60].map((w, i) => <div key={i} style={{ height: 2.5, width: `${w}%`, background: '#ddd', marginBottom: 3 }} />)}
      </div>
    </div>
  </div>)
}

export function TemplateCard({ t, active, onPick }: any) {
  return (<div onClick={() => onPick(t.id)} style={{ cursor: 'pointer', marginBottom: 14 }}>
    <TemplateThumbnail t={t} active={active} name={t.name} />
    <div style={{ fontWeight: 700, marginTop: 6 }}>{t.name}</div>
    <div style={{ color: 'var(--muted-ink)', fontSize: 12 }}>{t.category}</div>
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{(t.swatches || []).map((c: string) => (
      <span key={c} style={{ width: 16, height: 16, borderRadius: 5, background: c, border: '1px solid #ccc', display: 'inline-block' }} />))}</div>
  </div>)
}

export function StyleControls({ style, onChange }: any) {
  const set = (p: any) => onChange({ ...style, ...p })
  const row = { marginBottom: 12 } as any
  return (<div>
    <div style={row}><div><b>Color</b></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {['#5b50e6', '#141414', '#2f4f2f', '#2563eb', '#f08a24', '#2aa198', '#7c5cd6', '#d4a373'].map(c => (
          <span key={c} onClick={() => set({ accent_color: c })} style={{ width: 22, height: 22, borderRadius: 999, background: c, border: style.accent_color === c ? '2px solid #000' : '1px solid #ccc', cursor: 'pointer' }} />))}
      </div></div>
    <div style={row}><div><b>Headline capitalization</b></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{['normal', 'UPPER', 'Title'].map(h => (
        <button key={h} onClick={() => set({ headline_case: h })} style={{ border: style.headline_case === h ? '2px solid #5b50e6' : '1px solid var(--line)', borderRadius: 6, padding: '4px 10px' }}>{h === 'normal' ? 'Aa' : h === 'UPPER' ? 'AA' : 'Aa'}</button>))}</div></div>
    <div style={row}><div><b>Font style</b></div>
      <select value={style.font_family} onChange={e => set({ font_family: e.target.value })} style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 8, marginTop: 6 }}>
        {['Inter', 'Manrope', 'Plus Jakarta Sans', 'Georgia', 'IBM Plex Sans', 'Arial'].map(f => <option key={f}>{f}</option>)}
      </select></div>
    <div style={row}><div><b>Font size: {style.font_size}</b></div>
      <input type="range" min={0} max={2} step={1} value={['S', 'M', 'L'].indexOf(style.font_size)} onChange={e => set({ font_size: ['S', 'M', 'L'][+e.target.value] })} style={{ width: '100%' }} /></div>
    <div style={row}><div><b>Line spacing: {style.line_spacing}</b></div>
      <input type="range" min={1.15} max={1.8} step={0.05} value={style.line_spacing} onChange={e => set({ line_spacing: +e.target.value })} style={{ width: '100%' }} /></div>
    <div style={row}><div><b>Icon style</b></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{['simple', 'filled', 'none'].map(ic => (
        <button key={ic} onClick={() => set({ icon_style: ic })} style={{ border: style.icon_style === ic ? '2px solid #5b50e6' : '1px solid var(--line)', borderRadius: 6, padding: '4px 10px' }}>{ic}</button>))}</div></div>
    <div style={row}><div><b>Page size</b></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{['A4', 'Letter'].map(p => (
        <button key={p} onClick={() => set({ page_size: p })} style={{ border: style.page_size === p ? '2px solid #5b50e6' : '1px solid var(--line)', borderRadius: 6, padding: '4px 14px' }}>{p}</button>))}</div></div>
    <div style={row}><div><b>Date format</b></div>
      <select value={style.date_format} onChange={e => set({ date_format: e.target.value })} style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 8, marginTop: 6 }}>
        {['MMM YYYY', 'MM/YYYY', 'YYYY only'].map(f => <option key={f}>{f}</option>)}
      </select></div>
  </div>)
}

export function ScorePanel({ score }: any) {
  if (!score) return <div className="card-soft" style={{ padding: 14 }}>Score computes on save.</div>
  return (<div className="card-soft" style={{ padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>ATS Audit Score</h3>
      <span style={{ background: 'var(--tea-green)', color: '#14532d', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 15 }}>{score.score}/100</span>
    </div>
    <div style={{ color: 'var(--muted-ink)', fontSize: 12, marginBottom: 12 }}>{score.status}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(score.checks || []).map((c: any) => (
        <div key={c.label} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            {c.ok ? <IconCheckCircle size={15} style={{ color: '#166534', flexShrink: 0 }} /> : <IconAlertCircle size={15} style={{ color: '#991b1b', flexShrink: 0 }} />}
            <span style={{ color: c.ok ? 'var(--ink)' : '#991b1b' }}>{c.label}</span>
          </div>
          {!c.ok && <div style={{ color: 'var(--muted-ink)', fontSize: 12, marginTop: 2, paddingLeft: 21 }}>Recommendation: {c.fix}</div>}
        </div>
      ))}
    </div>
  </div>)
}

export function JobMatchPanel({ target, matches }: any) {
  return (<div className="card" style={{ padding: 14 }}><h4>Job Match — {target}</h4>
    {(matches || []).map((m: number, i: number) => <div key={i}>Experience {i + 1}: <b>{m}</b>/100</div>)}
    {!(matches?.length) && 'Add experience to see match.'}</div>)
}
