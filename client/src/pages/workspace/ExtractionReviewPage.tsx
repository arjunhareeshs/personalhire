import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resumeApi, analysisApi } from '../../lib/api'
import { ConfidenceBadge as Badge, ExtractionSectionList } from '../../components/extraction/extraction'
const SECTIONS = ['Personal', 'Education', 'Skills', 'Projects', 'Experience', 'Internships', 'Certifications', 'Links', 'Achievements', 'Target role']
const inp = { width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 8, marginBottom: 8 } as any
export default function ExtractionReviewPage() {
  const { resumeId = '' } = useParams(); const nav = useNavigate()
  const [d, setD] = useState<any>(null); const [conf, setConf] = useState<any>({}); const [sec, setSec] = useState('Personal')
  useEffect(() => { resumeApi.getExtraction(resumeId).then(r => { setD(r.profile_json || {}); setConf(r.confidence || {}) }).catch(() => setD({ personal_information: { full_name: 'Demo Student', target_role: 'Full Stack Developer' }, skills: { technical_skills: ['React'] }, projects: [] })) }, [resumeId])
  if (!d) return <p>Loading extraction…</p>
  const pi = d.personal_information || {}
  const set = (patch: any) => setD({ ...d, ...patch })
  const confirm = async () => { try { await resumeApi.patchExtraction(resumeId, { profile_json: d }); await resumeApi.confirmExtraction(resumeId); await analysisApi.start(resumeId) } catch {} nav(`/workspace/dashboard/${resumeId}`) }
  return (<div>
    <h2>Extraction review</h2>
    <p style={{ color: 'var(--muted-ink)' }}>Confirm the structured profile before analysis. Low-confidence fields are highlighted. This JSON feeds dashboard, roadmap, builder, interview.</p>
    {(d.missing_fields?.length > 0) && <div className="card" style={{ padding: 10, borderColor: 'var(--warning)', marginTop: 8 }}>Missing: {d.missing_fields.join(', ')}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 300px', gap: 16, marginTop: 12 }}>
      <div className="card" style={{ padding: 12 }}><ExtractionSectionList sections={SECTIONS} value={sec} onChange={setSec} /></div>
      <div className="card" style={{ padding: 16 }}>
        {sec === 'Personal' && (<>
          <label>Full name <Badge v={conf.email} /></label><input style={inp} value={pi.full_name || ''} onChange={e => set({ personal_information: { ...pi, full_name: e.target.value } })} />
          <label>Email <Badge v={conf.email} /></label><input style={inp} value={pi.email || ''} onChange={e => set({ personal_information: { ...pi, email: e.target.value } })} />
          <label>Phone <Badge v={conf.phone} /></label><input style={inp} value={pi.phone || ''} onChange={e => set({ personal_information: { ...pi, phone: e.target.value } })} />
          <label>Location</label><input style={inp} value={pi.location || ''} onChange={e => set({ personal_information: { ...pi, location: e.target.value } })} />
        </>)}
        {sec === 'Skills' && (<>
          <label>Technical (comma-separated) <Badge v={conf.skills} /></label>
          <textarea style={{ ...inp, minHeight: 80 }} value={(d.skills?.technical_skills || []).join(', ')} onChange={e => set({ skills: { ...d.skills, technical_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
          <label>Soft</label><input style={inp} value={(d.skills?.soft_skills || []).join(', ')} onChange={e => set({ skills: { ...d.skills, soft_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
        </>)}
        {sec === 'Projects' && (<>
          {(d.projects || []).map((p: any, i: number) => (<div key={i} className="card-soft" style={{ padding: 10, marginBottom: 8 }}>
            <input style={inp} value={p.project_title || ''} onChange={e => { const a = [...d.projects]; a[i] = { ...a[i], project_title: e.target.value }; set({ projects: a }) }} />
            <textarea style={{ ...inp, minHeight: 60 }} value={p.description || ''} onChange={e => { const a = [...d.projects]; a[i] = { ...a[i], description: e.target.value }; set({ projects: a }) }} />
            <input style={inp} value={(p.tech_stack || []).join(', ')} onChange={e => { const a = [...d.projects]; a[i] = { ...a[i], tech_stack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }; set({ projects: a }) }} />
          </div>))}
          <button className="btn-bronze" onClick={() => set({ projects: [...(d.projects || []), { project_title: 'New project', description: '', tech_stack: [] }] })}>+ Add project</button>
        </>)}
        {sec === 'Education' && (<>
          {(d.education?.length ? d.education : [{ institution_name: '', degree: '' }]).map((e2: any, i: number) => (<div key={i}>
            <input style={inp} placeholder="Institution" value={e2.institution_name || ''} onChange={e => { const a = [...(d.education?.length ? d.education : [{}])]; a[i] = { ...a[i], institution_name: e.target.value }; set({ education: a }) }} />
            <input style={inp} placeholder="Degree / field" value={e2.degree || e2.field_of_study || ''} onChange={e => { const a = [...(d.education?.length ? d.education : [{}])]; a[i] = { ...a[i], degree: e.target.value }; set({ education: a }) }} />
          </div>))}
        </>)}
        {sec === 'Links' && (<>{(d.portfolio_links || []).map((l: any, i: number) => (<div key={i} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--line)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper)', fontSize: 13 }}><span style={{ fontWeight: 600 }}>{l.platform}</span> — <span style={{ color: 'var(--muted-ink)' }}>{l.url}</span> <span style={{ color: 'var(--muted-ink)', marginLeft: 'auto', fontSize: 11 }}>({l.source}, p{l.page_number})</span></div>))}{!(d.portfolio_links?.length) && <p style={{ color: 'var(--muted-ink)' }}>No embedded or visible links detected.</p>}</>)}
        {sec === 'Target role' && (<><input style={inp} value={pi.target_role || ''} onChange={e => set({ personal_information: { ...pi, target_role: e.target.value } })} /><p style={{ color: 'var(--muted-ink)', fontSize: 13 }}>Primary role used for role fit, skill gaps, learning roadmap, and voice interview.</p></>)}
        {['Experience', 'Internships', 'Certifications', 'Achievements'].includes(sec) && <p style={{ color: 'var(--muted-ink)', fontSize: 13 }}>{sec}: No raw records extracted — you can add these in the Resume Builder studio or leave blank.</p>}
        <button className="btn-dark" onClick={confirm} style={{ marginTop: 16, padding: '10px 20px' }}>Confirm Profile & Run Analysis →</button>
      </div>
      <div className="card-soft" style={{ padding: 18, fontSize: 13 }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Source Evidence</h4>
        <p style={{ margin: '0 0 6px 0' }}>File: {(d.file_metadata?.file_name || 'Uploaded document')} • {d.file_metadata?.number_of_pages || 1} page(s)</p>
        <p style={{ margin: '0 0 10px 0', color: 'var(--muted-ink)' }}>Type: {d.file_metadata?.selectable_text_available ? 'Selectable native text layer' : 'Rasterized page image'}</p>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, color: 'var(--muted-ink)', fontSize: 12, lineHeight: 1.5 }}>
          <b>Deterministic Pipeline:</b> Upload → 300 DPI Rasterization → VLM Layout Extraction → Canonical Schema Normalization → <b>Human Confirmation</b> → Career Analysis.
        </div>
      </div>
    </div>
  </div>)
}

