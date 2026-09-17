import { Link } from 'react-router-dom'
export default function LandingPage() {
  return (<div>
    <div style={{ padding: '64px 32px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800 }}>RViewer AI</h1>
      <p style={{ fontSize: 18, color: 'var(--muted-ink)' }}>Turn a static resume into verified career intelligence.</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/register" className="btn-dark" style={{ textDecoration: 'none' }}>Upload Resume</Link>
        <Link to="/login" className="btn-bronze" style={{ textDecoration: 'none' }}>Login</Link>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
        {['Upload', 'Analyze', 'Verify', 'Build', 'Interview'].map(s => (<span key={s} className="chip" style={{ background: 'var(--white)', border: '1px solid var(--line)' }}>{s}</span>))}
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, padding: 32 }}>
      {[
        ['Extraction', 'Structured JSON with confidence + editable review'],
        ['Analysis', 'ATS, role fit, skill gaps, project quality'],
        ['Link Intelligence', 'GitHub heatmap, LeetCode radar, verification'],
        ['Roadmap', '6-month role-targeted learning plan'],
        ['Builder', 'Live A4 preview, templates, AI bullets, PDF'],
        ['Voice Interview', 'Resume-grounded LiveKit interview + report'],
      ].map(([t, d]) => (<div key={t} className="card" style={{ padding: 20 }}><h3>{t}</h3><p style={{ color: 'var(--muted-ink)' }}>{d}</p></div>))}
    </div>
  </div>)
}
