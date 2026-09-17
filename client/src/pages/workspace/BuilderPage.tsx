import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { builderApi } from '../../lib/api'
import { TemplateCard, StyleControls, ScorePanel, JobMatchPanel } from '../../components/builder/builder'
import { Dialog } from '../../components/ui/ui'
import { IconEdit, IconSliders, IconEye, IconFileText, IconUndo, IconRedo, IconSparkles, IconDownload, IconCheckCircle } from '../../components/ui/icons'

const FONT_PX: any = { S: 13, M: 14.5, L: 16 }
const EMPTY_CONTENT = {
  title: 'My Resume', target_role: 'Customer Service Representative',
  personal: { name: 'Sarah Seeker', headline: 'Customer Service Representative', address: 'Street 56, Austin, United States of America', phone: '+99999', email: 'hello@email.com', links: ['http://www.myportfolio.com'] },
  summary: 'Customer service professional with 2 years of experience helping customers.',
  experience: [{ company: 'BrightWave Retail Solutions', location: 'London, United Kingdom', role: 'Customer Service Representative', start: 'May 15', end: 'Now', bullets: ['Responded to customer questions through phone, email, and live chat, providing accurate and timely support.'] }],
  education: [], certificates: [], skills: '',
}
const EMPTY_STYLE = { template_id: 'cedar', accent_color: '#5b50e6', font_family: 'Inter', font_size: 'M', line_spacing: 1.4, headline_case: 'normal', icon_style: 'simple', page_size: 'A4', date_format: 'MMM YYYY', layout: 'one_column', header_style: 'left_accent_bar' }

function head(t: string, mode: string) {
  if (mode === 'UPPER') return t.toUpperCase()
  if (mode === 'Title') return t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
  return t
}
const inp = { width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 7, marginBottom: 6, fontSize: 13 } as any

/* ---------------- live A4 preview: 7 template renders, same content ---------------- */
function PreviewDoc({ content, style }: any) {
  const c = content || EMPTY_CONTENT; const s = { ...EMPTY_STYLE, ...(style || {}) }
  const px = FONT_PX[s.font_size] || 14.5
  const serif = /georgia/i.test(s.font_family)
  const fam = serif ? 'Georgia, serif' : `${s.font_family}, sans-serif`
  const accent = s.accent_color
  const name = head(c.personal?.name || 'Your Name', s.headline_case)
  const contact = [c.personal?.headline, c.personal?.address, c.personal?.phone, c.personal?.email, ...((c.personal?.links || []).slice(0, 5))].filter(Boolean).join('  |  ')
  const secH = (t: string) => (<h3 style={{ fontSize: px + 1, borderBottom: '1px solid #999', paddingBottom: 4, margin: '16px 0 8px', letterSpacing: s.template_id === 'maple' ? 1 : 0, textTransform: s.template_id === 'maple' ? 'uppercase' : 'none', fontFamily: fam }}>{t}</h3>)
  const expBlock = (e: any) => (<div key={e.company + e.role} style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{e.company}</b><span>{e.location}</span></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}><span>{e.role}</span><span>{e.start}{e.start || e.end ? ' - ' : ''}{e.end}</span></div>
    <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{(e.bullets || []).filter(Boolean).map((b: string, i: number) => <li key={i} style={{ marginBottom: 3 }}>{b}</li>)}</ul>
  </div>)
  const body = (<>
    <p style={{ margin: '6px 0' }}>{c.summary}</p>
    {secH('Work Experience')}{(c.experience || []).map(expBlock)}
    {secH('Education')}{((c.education || []).length ? c.education : [{ school: '', degree: '', year: '', location: '' }]).filter((e: any) => e.school || e.degree).map((e: any, i: number) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><div><b>{e.school}</b><div>{e.degree}</div><div style={{ color: '#555' }}>{e.location}</div></div><span>{e.year}</span></div>))}
    {(c.certificates?.length > 0) && (<>{secH('Certificates')}{c.certificates.map((t: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>{t.title}</b>{t.issuer ? ` | ${t.issuer}` : ''}</span><span>{t.year}</span></div>)}</>)}
    {c.skills && (<>{secH('Skills')}<p>{c.skills}</p></>)}
  </>)
  const headCenter = (<div style={{ textAlign: 'center', marginBottom: 6 }}>
    <h1 style={{ fontFamily: serif || s.template_id === 'classic' ? 'Georgia, serif' : fam, fontSize: 30, margin: '4px 0' }}>{name}</h1>
    <div style={{ fontSize: px - 1.5, color: '#333' }}>{contact}</div></div>)
  const headLeft = (<div style={{ borderLeft: `5px solid ${accent}`, paddingLeft: 12, marginBottom: 6 }}>
    <h1 style={{ fontFamily: fam, fontSize: 28, margin: '4px 0' }}>{name}</h1>
    <div style={{ fontSize: px - 1.5, color: '#333' }}>{contact}</div></div>)
  const side = (<div style={{ width: 190, background: accent, color: 'white', padding: 16, fontSize: px - 1 }}>
    <h2 style={{ fontSize: 17, margin: '4px 0' }}>{name}</h2>
    <div style={{ opacity: 0.9 }}>{c.personal?.headline}</div><hr style={{ borderColor: 'rgba(255,255,255,.4)' }} />
    <b>Contact</b><div>{c.personal?.email}</div><div>{c.personal?.phone}</div><div>{c.personal?.address}</div>
    <b>Skills</b><div>{c.skills || '—'}</div><b>Links</b>{(c.personal?.links || []).map((l: string) => <div key={l} style={{ wordBreak: 'break-all' }}>{l}</div>)}
  </div>)
  const main = (<div style={{ flex: 1, padding: s.layout === 'two_column_sidebar' ? '20px 24px' : 0 }}>{s.layout !== 'two_column_sidebar' && body}{s.layout === 'two_column_sidebar' && (<>
    {secH('Profile')}<p>{c.summary}</p>{secH('Work Experience')}{(c.experience || []).map(expBlock)}{secH('Education')}{(c.education || []).map((e: any, i: number) => <div key={i}><b>{e.school}</b> — {e.degree} ({e.year})</div>)}</>)}</div>)
  return (<div className="a4-preview" style={{ padding: s.layout === 'two_column_sidebar' ? 0 : 40, fontFamily: fam, fontSize: px, lineHeight: s.line_spacing, display: s.layout === 'two_column_sidebar' ? 'flex' : 'block', width: s.page_size === 'Letter' ? 816 : 794 }}>
    {s.layout === 'two_column_sidebar' ? (<>{side}{main}</>) : (<>{s.header_style === 'centered_serif' || s.template_id === 'classic' ? headCenter : headLeft}
      <div style={{ padding: '0 4px' }}>{secH('Profile')}{body}</div></>)}
  </div>)
}

/* ---------------- page ---------------- */
export default function BuilderPage() {
  const { resumeId = '' } = useParams(); const nav = useNavigate()
  const [bid, setBid] = useState('')
  const [content, setContent] = useState<any>(EMPTY_CONTENT)
  const [style, setStyle] = useState<any>(EMPTY_STYLE)
  const [templates, setTemplates] = useState<any[]>([])
  const [editorTab, setEditorTab] = useState('Editor')
  const [rightTab, setRightTab] = useState('Templates')
  const [section, setSection] = useState('Work Experience')
  const [selExp, setSelExp] = useState(0)
  const [score, setScore] = useState<any>(null)
  const [saveState, setSaveState] = useState('Saved')
  const [pdfPreview, setPdfPreview] = useState(true)
  const [zoom, setZoom] = useState(0.85)
  const [dlOpen, setDlOpen] = useState(false)
  const [suggest, setSuggest] = useState<any>(null)
  const [suggestList, setSuggestList] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  const [announce, setAnnounce] = useState(false)
  const [titleEdit, setTitleEdit] = useState(false)
  const undo = useRef<any[]>([]); const redo = useRef<any[]>([]); const lastPush = useRef(0)

  useEffect(() => {
    builderApi.templates().then(r => setTemplates(r.templates || [])).catch(() => {})
    builderApi.create(resumeId, { template_id: 'cedar' }).then(r => {
      setBid(r.builder_id); if (r.content?.personal) setContent(r.content); if (r.style) setStyle(r.style)
      undo.current = []
    }).catch(() => {})
  }, [resumeId])
  const push = () => {
    const now = Date.now(); if (now - lastPush.current < 2500) return; lastPush.current = now
    undo.current.push(JSON.stringify({ content, style })); if (undo.current.length > 60) undo.current.shift(); redo.current = []
  }
  const doUndo = () => {
    const p = undo.current.pop(); if (!p) return
    redo.current.push(JSON.stringify({ content, style }))
    const s = JSON.parse(p); setContent(s.content); setStyle(s.style); persist(s.content, s.style)
  }
  const doRedo = () => {
    const p = redo.current.pop(); if (!p) return
    undo.current.push(JSON.stringify({ content, style }))
    const s = JSON.parse(p); setContent(s.content); setStyle(s.style); persist(s.content, s.style)
  }
  const persist = async (c = content, s = style) => {
    if (!bid) return
    setSaveState('Saving…')
    try { const r = await builderApi.save(bid, { content: c, style: s }); setScore(r.score || score); setSaveState('Saved') }
    catch { setSaveState('Saved (offline)') }
  }
  useEffect(() => {
    if (!bid) return
    const t = setTimeout(() => persist(), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, style])
  const refreshScore = async (c = content) => {
    if (!bid) return
    try { setScore(await builderApi.score(bid, { content: c })) } catch {}
  }
  useEffect(() => { if (bid) refreshScore() }, [bid])
  const upd = (c: any) => { push(); setContent(c) }

  /* ----- experience ops ----- */
  const exps = content.experience || []
  const setExp = (i: number, e: any) => { const a = [...exps]; a[i] = e; upd({ ...content, experience: a }) }
  const addExp = () => { push(); setContent({ ...content, experience: [...exps, { company: 'New Company', location: '', role: content.target_role || '', start: '', end: 'Present', bullets: [''] }] }); setSelExp(exps.length) }
  const delExp = (i: number) => { push(); setContent({ ...content, experience: exps.filter((_: any, j: number) => j !== i) }) }
  const dupExp = (i: number) => { push(); const a = [...exps]; a.splice(i + 1, 0, JSON.parse(JSON.stringify(exps[i]))); setContent({ ...content, experience: a }) }
  const moveExp = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= exps.length) return; push(); const a = [...exps]; const t = a[i]; a[i] = a[j]; a[j] = t; setContent({ ...content, experience: a }); setSelExp(j) }
  const sortExp = () => { push(); setContent({ ...content, experience: [...exps].sort((a, b) => (b.start || '').localeCompare(a.start || '')) }) }
  const addBullet = (i: number) => { const e = { ...exps[i], bullets: [...(exps[i].bullets || []), ''] }; setExp(i, e) }

  /* ----- AI ----- */
  const aiFor = async (ei: number, bi: number) => {
    const orig = exps[ei].bullets[bi]
    try { const r = await builderApi.aiImprove(bid || 'demo', { text: orig }); setSuggest({ ei, bi, original: orig, improved: r.improved }) }
    catch { setSuggest({ ei, bi, original: orig, improved: orig + ' (polished with measured impact)' }) }
  }
  const acceptSuggest = () => { if (!suggest) return; push(); const e = { ...exps[suggest.ei], bullets: exps[suggest.ei].bullets.map((b: string, j: number) => j === suggest.bi ? suggest.improved : b) }; const a = [...exps]; a[suggest.ei] = e; setContent({ ...content, experience: a }); setSuggest(null) }
  const weakBullets = useMemo(() => {
    const out: any[] = []
    exps.forEach((e: any, ei: number) => (e.bullets || []).forEach((b: string, bi: number) => {
      if (b && (!/\d/.test(b) || b.split(' ').length < 8)) out.push({ ei, bi, text: b })
    }))
    return out
  }, [exps])
  const openFeedback = async () => {
    try { setFeedback(await builderApi.feedback(bid || 'demo')) }
    catch { setFeedback({ score: score?.score || 0, feedback: ['Add metrics to bullets', 'Add target-role keywords'], checks: score?.checks || [] }) }
  }

  /* ----- templates: switch layout, never content ----- */
  const pickTemplate = (id: string) => {
    const t = templates.find(x => x.id === id); if (!t) return
    push()
    setStyle({ ...style, template_id: t.id, accent_color: (t.swatches || [])[0] || style.accent_color, font_family: (t.font || 'Inter').split(',')[0], layout: t.layout, header_style: t.header })
    persist(content, { ...style, template_id: t.id })
  }

  /* ----- export ----- */
  const downloadPdf = async () => {
    setDlOpen(false)
    try { const r = await builderApi.exportPdf(bid || 'demo'); window.open((r as any).pdf_url || `/api/v1/builder/${bid}/exports`, '_blank') }
    catch { window.print() }
  }
  const exportTxt = () => {
    const txt = `${content.personal?.name}\n${content.personal?.headline}\n${content.personal?.email} | ${content.personal?.phone}\n\n${content.summary}\n\nEXPERIENCE\n` + exps.map((e: any) => `${e.company} — ${e.role}\n${(e.bullets || []).join('\n')}`).join('\n\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = 'resume-ats.txt'; a.click(); setDlOpen(false)
  }

  const matchAt = (i: number) => score?.match_scores?.[i] ?? '—'
  const sections = ['Personal', 'Summary', 'Work Experience', 'Education', 'Skills', 'Certificates']

  return (<div style={{ background: '#f8f7f4', minHeight: '100vh', fontSize: 14 }}>
    {/* top toolbar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'white', borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Workspace › Resumes ›</span>
      {titleEdit
        ? <input autoFocus value={content.title} onChange={e => setContent({ ...content, title: e.target.value })} onBlur={() => setTitleEdit(false)} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '3px 8px', fontSize: 13 }} />
        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
            {content.title}
            <button onClick={() => setTitleEdit(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted-ink)' }} title="Edit Title">
              <IconEdit size={13} />
            </button>
          </span>}
      <span style={{ color: 'var(--muted-ink)', fontSize: 12, marginLeft: 4 }}>({saveState})</span>
      
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={doUndo} disabled={!undo.current.length} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--line)', borderRadius: 6, padding: '6px 12px', background: 'white', cursor: 'pointer', opacity: undo.current.length ? 1 : 0.5, fontSize: 13 }}>
          <IconUndo size={14} /> Undo
        </button>
        <button onClick={doRedo} disabled={!redo.current.length} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', background: 'white', cursor: 'pointer', opacity: redo.current.length ? 1 : 0.5 }}>
          <IconRedo size={14} />
        </button>
        <button onClick={openFeedback} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 6, padding: '6px 12px', background: 'var(--cornsilk)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <IconSparkles size={14} /> Executive Review
        </button>
        <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden' }}>
          <button onClick={downloadPdf} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--black)', color: 'white', border: 'none', padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <IconDownload size={14} /> Export PDF
          </button>
          <button onClick={() => setDlOpen(v => !v)} style={{ background: '#222', color: 'white', border: 'none', borderLeft: '1px solid rgba(255,255,255,.15)', padding: '6px 10px', cursor: 'pointer' }}>▾</button>
        </div>
      </span>
    </div>
    {dlOpen && (<div style={{ position: 'absolute', right: 18, top: 56, background: 'white', border: '1px solid var(--line)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 20, minWidth: 180 }}>
      {[['Download PDF', downloadPdf], ['Export plain ATS (.txt)', exportTxt], ['Save checkpoint', () => { persist(); setDlOpen(false) }]].map(([l, f]: any) => (
        <div key={l} onClick={f} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{l}</div>))}
    </div>)}
    
    {/* mode toolbar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '8px 18px', background: 'white', borderBottom: '1px solid var(--line)' }}>
      {[
        ['ai', 'Executive Review', <IconSparkles size={14} key="i1" />, () => { setEditorTab('AI Review'); openFeedback() }],
        ['ed', 'Content Editor', <IconEdit size={14} key="i2" />, () => setEditorTab('Editor')],
        ['ls', 'Layout & Typography', <IconSliders size={14} key="i3" />, () => setEditorTab('Layout & Style')]
      ].map(([k, label, icon, onClick]: any) => {
        const isActive = (k === 'ai' && editorTab === 'AI Review') || (k === 'ed' && editorTab === 'Editor') || (k === 'ls' && editorTab === 'Layout & Style')
        return (
          <button key={k} onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--black)' : 'var(--muted-ink)', borderBottom: isActive ? '2px solid var(--black)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', padding: '6px 2px', fontSize: 13 }}>
            {icon} {label}
          </button>
        )
      })}
      
      <button onClick={() => setSuggestList(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: 13 }}>
        <IconFileText size={14} /> Suggested Edits {weakBullets.length ? `(${weakBullets.length})` : ''}
      </button>
      
      <button onClick={() => setPdfPreview(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 20, padding: '4px 12px', background: pdfPreview ? 'var(--cornsilk)' : 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
        <IconEye size={13} /> {pdfPreview ? 'Hide Preview' : 'Show PDF Preview'}
      </button>
      
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={() => setRightTab('Score')} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 10px', background: 'white', cursor: 'pointer', fontSize: 12 }}>
          ATS Score: <span style={{ background: 'var(--tea-green)', color: '#1b4d21', fontWeight: 700, borderRadius: 4, padding: '1px 6px', marginLeft: 4 }}>{score?.score ?? '—'}</span>
        </button>
        {[['Templates', 'Templates'], ['ATS Audit', 'Score'], ['Role Match', 'Job Match']].map(([label, t]: any) => (
          <button key={t} onClick={() => setRightTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: rightTab === t ? 700 : 500, color: rightTab === t ? 'var(--black)' : 'var(--muted-ink)', borderBottom: rightTab === t ? '2px solid var(--black)' : 'none', padding: '4px 0', fontSize: 13 }}>
            {label}
          </button>
        ))}
      </span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: pdfPreview ? '360px 1fr 310px' : '360px 1fr', gap: 0 }}>
      {/* left editor */}
      <div style={{ background: 'white', borderRight: '1px solid var(--line)', padding: 16, maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
        {editorTab === 'Layout & Style' && (<>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Layout & Typography</h3>
          <StyleControls style={style} onChange={(s: any) => { push(); setStyle(s) }} />
        </>)}
        {editorTab === 'AI Review' && (<>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSparkles size={16} /> Executive Feedback
          </h3>
          {!feedback ? <p style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Click 'Executive Review' to run instant diagnostic scoring.</p> : (<>
            <div style={{ padding: '8px 12px', background: 'var(--cornsilk)', borderRadius: 6, border: '1px solid var(--line)', marginBottom: 12 }}>
              <span style={{ fontWeight: 700 }}>Composite Score: {feedback.score}/100</span>
            </div>
            {(feedback.feedback || []).map((f: string, i: number) => (
              <div key={i} className="card-soft" style={{ padding: 10, marginBottom: 8, fontSize: 13, borderLeft: '3px solid var(--light-bronze)' }}>
                {f}
              </div>
            ))}
          </>)}
        </>)}
        {editorTab === 'Editor' && (<>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>{sections.map(s => (
            <button key={s} onClick={() => setSection(s)} style={{ border: section === s ? '2px solid #5b50e6' : '1px solid var(--line)', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>{s}</button>))}</div>
          {section === 'Personal' && (<>
            {[['name', 'Full name'], ['headline', 'Headline'], ['address', 'Address'], ['phone', 'Phone'], ['email', 'Email']].map(([k, l]: any) => (
              <div key={k}><label style={{ fontSize: 12 }}>{l}</label><input style={inp} value={content.personal?.[k] || ''} onChange={e => upd({ ...content, personal: { ...content.personal, [k]: e.target.value } })} /></div>))}
            <label style={{ fontSize: 12 }}>Links (one per line)</label>
            <textarea style={{ ...inp, minHeight: 60 }} value={(content.personal?.links || []).join('\n')} onChange={e => upd({ ...content, personal: { ...content.personal, links: e.target.value.split('\n').filter(Boolean) } })} />
            <label style={{ fontSize: 12 }}>Target job title (drives match score)</label>
            <input style={inp} value={content.target_role || ''} onChange={e => upd({ ...content, target_role: e.target.value })} />
          </>)}
          {section === 'Summary' && (<>
            <textarea style={{ ...inp, minHeight: 120 }} value={content.summary} onChange={e => upd({ ...content, summary: e.target.value })} />
            <button className="btn-bronze" onClick={async () => { try { const r = await builderApi.aiImprove(bid || 'demo', { text: content.summary }); setSuggest({ summary: true, original: content.summary, improved: r.improved }) } catch {} }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconSparkles size={14} /> Enhance Summary
            </button>
          </>)}
          {section === 'Work Experience' && (<>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={addExp} style={{ flex: 1, ...inp, marginBottom: 0, fontWeight: 600 }}>+ Add Experience</button>
              <button onClick={sortExp} style={{ ...inp, marginBottom: 0 }}>Sort</button>
            </div>
            {exps.map((e: any, i: number) => (<div key={i} onClick={() => setSelExp(i)} style={{ border: selExp === i ? '2px solid var(--black)' : '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 12, position: 'relative' }}>
              {selExp === i && <span style={{ position: 'absolute', right: -6, top: 18, width: 10, height: 10, borderRadius: 999, background: 'var(--black)' }} />}
              <div style={{ display: 'flex', gap: 6 }}><input style={{ ...inp, fontWeight: 700 }} value={e.company} onChange={ev => setExp(i, { ...e, company: ev.target.value })} /><input style={inp} value={e.location} onChange={ev => setExp(i, { ...e, location: ev.target.value })} /></div>
              <div style={{ display: 'flex', gap: 6 }}><input style={inp} value={e.role} onChange={ev => setExp(i, { ...e, role: ev.target.value })} /><input style={inp} value={`${e.start} to ${e.end}`} onChange={ev => { const [s2, en2] = ev.target.value.split(' to '); setExp(i, { ...e, start: s2 || '', end: en2 || '' }) }} /></div>
              <div style={{ fontSize: 12, margin: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ border: '1px solid #7cc47c', color: '#1b4d21', background: 'var(--tea-green)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{matchAt(i)}</span> Match score for target role
              </div>
              {(e.bullets || []).map((b: string, bi: number) => (<textarea key={bi} style={{ ...inp, minHeight: 56 }} value={b} onChange={ev => { const a = [...e.bullets]; a[bi] = ev.target.value; setExp(i, { ...e, bullets: a }) }} />))}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => addBullet(i)} style={{ ...inp, marginBottom: 0 }}>+ Achievement</button>
                <button onClick={() => { const wi = (e.bullets || []).findIndex((b: string) => b && (!/\d/.test(b) || b.split(' ').length < 8)); aiFor(i, wi >= 0 ? wi : 0) }} style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--cornsilk)', color: 'var(--ink)', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  <IconSparkles size={13} /> Optimize Bullet
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => moveExp(i, -1)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>↑</button>
                <button onClick={() => moveExp(i, 1)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>↓</button>
                <button onClick={() => dupExp(i)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>Duplicate</button>
                <button onClick={() => delExp(i)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', marginLeft: 'auto' }}>Delete</button>
              </div>
            </div>))}
          </>)}
          {section === 'Education' && (<>
            {(content.education || []).map((e: any, i: number) => (<div key={i} className="card" style={{ padding: 8, marginBottom: 8 }}>
              <input style={inp} placeholder="School" value={e.school} onChange={ev => { const a = [...content.education]; a[i] = { ...a[i], school: ev.target.value }; upd({ ...content, education: a }) }} />
              <input style={inp} placeholder="Degree" value={e.degree} onChange={ev => { const a = [...content.education]; a[i] = { ...a[i], degree: ev.target.value }; upd({ ...content, education: a }) }} />
              <input style={inp} placeholder="Year" value={e.year} onChange={ev => { const a = [...content.education]; a[i] = { ...a[i], year: ev.target.value }; upd({ ...content, education: a }) }} />
            </div>))}
            <button onClick={() => upd({ ...content, education: [...(content.education || []), { school: '', degree: '', year: '', location: '' }] })} style={inp}>+ Add Education</button>
          </>)}
          {section === 'Skills' && (<textarea style={{ ...inp, minHeight: 100 }} value={content.skills} onChange={e => upd({ ...content, skills: e.target.value })} />)}
          {section === 'Certificates' && (<>
            {(content.certificates || []).map((t: any, i: number) => (<div key={i} className="card" style={{ padding: 8, marginBottom: 8 }}>
              <input style={inp} placeholder="Title" value={t.title} onChange={ev => { const a = [...content.certificates]; a[i] = { ...a[i], title: ev.target.value }; upd({ ...content, certificates: a }) }} />
              <input style={inp} placeholder="Issuer" value={t.issuer} onChange={ev => { const a = [...content.certificates]; a[i] = { ...a[i], issuer: ev.target.value }; upd({ ...content, certificates: a }) }} />
            </div>))}
            <button onClick={() => upd({ ...content, certificates: [...(content.certificates || []), { title: '', issuer: '', year: '' }] })} style={inp}>+ Add Certificate</button>
          </>)}
        </>)}
      </div>

      {/* center preview */}
      {pdfPreview && (<div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 110px)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}>-</button> {Math.round(zoom * 100)}% <button onClick={() => setZoom(z => Math.min(1.2, +(z + 0.1).toFixed(2)))}>+</button>
          <span style={{ color: 'var(--muted-ink)', fontSize: 12 }}>{style.page_size} • {style.font_family} • live preview = PDF layout</span>
        </div>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}><PreviewDoc content={content} style={style} /></div>
      </div>)}

      {/* right panel */}
      <div style={{ background: 'white', borderLeft: '1px solid var(--line)', padding: 12, maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
        {rightTab === 'Templates' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {templates.map(t => <TemplateCard key={t.id} t={t} active={style.template_id === t.id} onPick={pickTemplate} />)}
          {!templates.length && <p>Loading templates…</p>}
        </div>)}
        {rightTab === 'Score' && <ScorePanel score={score} />}
        {rightTab === 'Job Match' && (<><JobMatchPanel target={content.target_role} matches={score?.match_scores} />
          <label style={{ fontSize: 12 }}>Target role</label><input style={inp} value={content.target_role || ''} onChange={e => upd({ ...content, target_role: e.target.value })} /></>)}
      </div>
    </div>

    {/* AI suggestion dialog */}
    <Dialog open={!!suggest} onClose={() => setSuggest(null)}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
        <IconSparkles size={16} /> Intelligent Enhancement
      </h3>
      <p style={{ color: 'var(--muted-ink)', fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Version</p>
      <p style={{ fontSize: 13, background: 'var(--white)', padding: 10, borderRadius: 6, border: '1px solid var(--line)', margin: '0 0 12px' }}>{suggest?.original}</p>
      <p style={{ color: 'var(--muted-ink)', fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Revision</p>
      <p style={{ background: 'var(--cornsilk)', padding: 10, borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>{suggest?.improved}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-dark" onClick={() => { if (suggest?.summary) { push(); setContent({ ...content, summary: suggest.improved }) } else acceptSuggest(); setSuggest(null) }}>Apply Changes</button>
        <button onClick={() => setSuggest(null)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </Dialog>

    {/* suggested edits */}
    <Dialog open={suggestList} onClose={() => setSuggestList(false)}>
      <h3 style={{ margin: '0 0 12px' }}>Suggested Bullet Refinements ({weakBullets.length})</h3>
      {weakBullets.map((w: any, i: number) => (
        <div key={i} className="card-soft" style={{ padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{w.text}</div>
          <button onClick={() => { setSuggestList(false); aiFor(w.ei, w.bi) }} style={{ color: 'var(--black)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline' }}>
            Enhance with AI →
          </button>
        </div>
      ))}
      {!weakBullets.length && <p style={{ color: 'var(--muted-ink)', fontSize: 13 }}>All bullet points contain measurable outcomes and action verbs.</p>}
    </Dialog>

    {/* feedback */}
    <Dialog open={!!feedback} onClose={() => setFeedback(null)}>
      <h3 style={{ margin: '0 0 12px' }}>Executive Resume Audit — {feedback?.score}/100</h3>
      {(feedback?.feedback || []).map((f: string, i: number) => (
        <div key={i} className="card-soft" style={{ padding: 10, marginBottom: 8, fontSize: 13 }}>
          {f}
        </div>
      ))}
    </Dialog>

    {/* announce */}
    <Dialog open={announce} onClose={() => setAnnounce(false)}>
      <h3 style={{ margin: '0 0 8px' }}>Share to Professional Network</h3>
      <p style={{ color: 'var(--muted-ink)', fontSize: 13, margin: '0 0 16px' }}>Share your updated executive resume link with recruiters and connections.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-dark" onClick={() => window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank')}>
          Share on LinkedIn
        </button>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setAnnounce(false) }} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}>
          Copy Link
        </button>
      </div>
    </Dialog>
  </div>)
}
