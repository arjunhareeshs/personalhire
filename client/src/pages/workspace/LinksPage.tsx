import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { linksApi, resumeApi } from '../../lib/api'
import { Tabs, StatusChip, ScoreBadge } from '../../components/ui/ui'
import { IconCheckCircle, IconAlertCircle, IconAlertTriangle, IconStar, IconAward, IconFolder, IconUsers, IconGitBranch, IconExternal } from '../../components/ui/icons'

const GH_C = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const LC_C = ['#eeeeee', '#c8e6c9', '#7bc96f', '#439d38', '#216e39']
const TABS = ['Overview', 'GitHub', 'LeetCode', 'Codeforces', 'CodeChef', 'HackerRank', 'Kaggle', 'Professional', 'Warnings']

/* exact GitHub-style calendar: weeks as columns, month labels */
function GitCal({ days }: any) {
  const cells = useMemo(() => {
    if (!days?.length) return null
    const byDate: any = {}; days.forEach((d: any) => byDate[d.date] = d)
    const first = new Date(days[0].date), last = new Date(days[days.length - 1].date)
    const start = new Date(first); start.setDate(start.getDate() - ((start.getDay() + 7) % 7))
    const weeks: any[] = []; let cur: any[] = new Array((start.getDay() + 7) % 7).fill(null)
    const months: any[] = []
    for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      if (d.getDay() === 0 && cur.length) { weeks.push(cur); cur = [] }
      if (d.getDate() === 1) months.push({ col: weeks.length, label: d.toLocaleString('en', { month: 'short' }) })
      cur.push(byDate[key] || { date: key, count: 0, level: 0, empty: true })
      if (d.getDay() === 6) { weeks.push(cur); cur = [] }
    }
    if (cur.length) weeks.push(cur)
    return { weeks, months }
  }, [days])
  if (!cells) return <p style={{ color: 'var(--muted-ink)' }}>No contribution data — profile may be private.</p>
  return (<div style={{ overflowX: 'auto' }}>
    <div style={{ display: 'flex', gap: 3, marginLeft: 30 }}>{cells.months.filter((m: any, i: number, a: any[]) => i === 0 || m.col - a[i - 1].col > 3).map((m: any, i: number) => (
      <span key={i} style={{ position: 'relative', fontSize: 10, color: 'var(--muted-ink)', left: (m.col - (i === 0 ? 0 : cells.months[i - 1]?.col || 0)) * 0, minWidth: 30 }}>{m.label}</span>))}</div>
    <div style={{ display: 'flex', gap: 3 }}>{cells.weeks.map((w: any[], wi: number) => (
      <div key={wi} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 11px)', gap: 3 }}>
        {w.map((d: any, di: number) => d ? (
          <div key={di} title={`${d.count} contributions on ${d.date}`} style={{ width: 11, height: 11, borderRadius: 2, background: GH_C[Math.min(4, d.level || 0)], outline: d.empty ? '1px dashed #ddd' : 'none' }} />
        ) : <div key={di} style={{ width: 11, height: 11 }} />)}
      </div>))}</div>
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 6, fontSize: 11, color: 'var(--muted-ink)' }}>Less {GH_C.map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c, display: 'inline-block' }} />)} More</div>
  </div>)
}

function LCHeat({ heat }: any) {
  const cells = useMemo(() => {
    if (!heat?.length) return null
    const weeks: any[] = []; let cur: any[] = []
    const sorted = [...heat].sort((a, b) => a.ts - b.ts).slice(-140)
    sorted.forEach((h: any, i: number) => { cur.push(h); if (cur.length === 7) { weeks.push(cur); cur = [] } })
    if (cur.length) weeks.push(cur)
    return weeks
  }, [heat])
  if (!cells) return <p style={{ color: 'var(--muted-ink)' }}>No submission activity.</p>
  return (<div style={{ display: 'flex', gap: 3 }}>{cells.map((w: any[], wi: number) => (
    <div key={wi} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 11px)', gap: 3 }}>
      {w.map((h: any, i: number) => { const lvl = h.count === 0 ? 0 : h.count === 1 ? 1 : h.count <= 3 ? 2 : h.count <= 6 ? 3 : 4
        return <div key={i} title={`${h.count} on ${new Date(h.ts * 1000).toDateString()}`} style={{ width: 11, height: 11, borderRadius: 2, background: LC_C[lvl] }} /> })}
    </div>))}</div>)
}

function Donut({ easy, med, hard }: any) {
  const t = Math.max(1, easy + med + hard); const R = 52, C = 2 * Math.PI * R
  const segs = [[easy, '#00b8a3'], [med, '#ffc01e'], [hard, '#ff375f']]
  let off = 0
  return (<svg width={150} height={150} viewBox="0 0 150 150">
    <circle cx={75} cy={75} r={R} fill="none" stroke="#eee" strokeWidth={18} />
    {segs.map(([v, c]: any, i: number) => { const el = <circle key={i} cx={75} cy={75} r={R} fill="none" stroke={c} strokeWidth={18} strokeDasharray={`${(v / t) * C} ${C}`} strokeDashoffset={-off} transform="rotate(-90 75 75)" />; off += (v / t) * C; return el })}
    <text x={75} y={72} textAnchor="middle" fontSize={22} fontWeight={800}>{t}</text>
    <text x={75} y={90} textAnchor="middle" fontSize={11} fill="#888">solved</text></svg>)
}

function Radar({ data }: any) {
  const axes = Object.keys(data || {}).slice(0, 12)
  if (!axes.length) return <p style={{ color: 'var(--muted-ink)' }}>Solve more topics to build the radar.</p>
  const N = axes.length, R = 80, cx = 110, cy = 100
  const pt = (i: number, v: number) => { const a = (2 * Math.PI * i) / N - Math.PI / 2; const r = (v / 100) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
  const poly = axes.map((a, i) => pt(i, data[a] || 0).join(',')).join(' ')
  return (<svg width={220} height={200}>
    {[25, 50, 75, 100].map(g => <polygon key={g} points={axes.map((_, i) => pt(i, g).join(',')).join(' ')} fill="none" stroke="#ddd" />)}
    {axes.map((a, i) => { const [x, y] = pt(i, 100); return <g key={a}><line x1={cx} y1={cy} x2={x} y2={y} stroke="#eee" /><text x={x} y={y} fontSize={8} textAnchor="middle">{a.slice(0, 10)}</text></g> })}
    <polygon points={poly} fill="rgba(212,163,115,.4)" stroke="var(--light-bronze)" strokeWidth={2} /></svg>)
}

function RatingLine({ hist }: any) {
  if (!hist?.length) return <p style={{ color: 'var(--muted-ink)' }}>No contest history.</p>
  const W = 560, H = 160, vals = hist.map((h: any) => h.rating)
  const mn = Math.min(...vals) - 50, mx = Math.max(...vals) + 50
  const X = (i: number) => 30 + (i / Math.max(1, hist.length - 1)) * (W - 50)
  const Y = (v: number) => H - 20 - ((v - mn) / Math.max(1, mx - mn)) * (H - 50)
  const d = hist.map((h: any, i: number) => `${i ? 'L' : 'M'}${X(i)},${Y(h.rating)}`).join(' ')
  return (<svg width={W} height={H} style={{ background: 'var(--paper)', borderRadius: 8 }}>
    <path d={d} fill="none" stroke="#5b50e6" strokeWidth={2} />
    {hist.map((h: any, i: number) => i % Math.ceil(hist.length / 12) === 0 && <circle key={i} cx={X(i)} cy={Y(h.rating)} r={3} fill="#5b50e6"><title>{h.contest}: {h.rating}</title></circle>)}
    <text x={34} y={16} fontSize={11}>{mx} ↑ {mn} ↓</text></svg>)
}

const card = { padding: 16, marginBottom: 12 } as any

export default function LinksPage() {
  const { resumeId = '' } = useParams()
  const [tab, setTab] = useState('Overview')
  const [sum, setSum] = useState<any>(null)
  const [gh, setGh] = useState<any>(null); const [lc, setLc] = useState<any>(null)
  const [cf, setCf] = useState<any>(null); const [cc, setCc] = useState<any>(null)
  const [hr, setHr] = useState<any>(null); const [kg, setKg] = useState<any>(null)
  const [projects, setProjects] = useState<string[]>([])
  const [posts, setPosts] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem(`posts-${resumeId}`) || '[]') } catch { return [] } })
  const [newPost, setNewPost] = useState(''); const [checking, setChecking] = useState(false)

  const load = async () => {
    try { setSum(await linksApi.get(resumeId)) } catch {}
    try { setGh(await linksApi.github(resumeId)) } catch {}
    try { setLc(await linksApi.leetcode(resumeId)) } catch {}
    try { const e = await resumeApi.getExtraction(resumeId); setProjects(((e.profile_json || {}).projects || []).map((p: any) => p.project_title)) } catch {}
  }
  useEffect(() => { load() }, [resumeId])
  useEffect(() => {
    if (tab === 'Codeforces' && !cf) linksApi.codeforces(resumeId).then(setCf).catch(() => setCf({ status: 'unknown' }))
    if (tab === 'CodeChef' && !cc) linksApi.codechef(resumeId).then(setCc).catch(() => setCc({ status: 'unknown' }))
    if (tab === 'HackerRank' && !hr) linksApi.hackerrank(resumeId).then(setHr).catch(() => setHr({ status: 'unknown' }))
    if (tab === 'Kaggle' && !kg) linksApi.kaggle(resumeId).then(setKg).catch(() => setKg({ status: 'unknown' }))
  }, [tab])
  const verify = async () => { try { await linksApi.verify(resumeId) } catch {}; load() }
  const addPost = async () => {
    if (!newPost.trim()) return; setChecking(true)
    try { const r = await linksApi.checkLink(resumeId, newPost.trim()); const p = [...posts, { url: newPost.trim(), title: r.title || newPost.trim(), status: r.status }]; setPosts(p); localStorage.setItem(`posts-${resumeId}`, JSON.stringify(p)); setNewPost('') }
    catch { const p = [...posts, { url: newPost.trim(), title: newPost.trim(), status: 'unknown' }]; setPosts(p); localStorage.setItem(`posts-${resumeId}`, JSON.stringify(p)); setNewPost('') }
    setChecking(false)
  }
  const matchRepos = useMemo(() => {
    if (!gh?.all_repo_names?.length || !projects.length) return []
    return projects.map(p => {
      const words = p.toLowerCase().split(/[^a-z]+/).filter((w: string) => w.length > 3)
      const hit = gh.all_repo_names.find((r: string) => words.some((w: string) => r.toLowerCase().includes(w)))
      return { project: p, repo: hit || null }
    })
  }, [gh, projects])

  return (<div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Link intelligence</h2>
      {sum && <><ScoreBadge score={sum.overall_link_score} /><span style={{ color: 'var(--muted-ink)', fontSize: 13 }}>{sum.verified_links}/{sum.links_found} verified • {sum.broken_links} broken</span></>}
      <button className="btn-dark" onClick={verify} style={{ marginLeft: 'auto' }}>Re-check links</button>
    </div>
    <div style={{ marginTop: 12 }}><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>

    {tab === 'Overview' && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
      {[['GitHub', gh, `${gh?.public_repos ?? '—'} repos • ${gh?.total_stars ?? '—'} stars`], ['LeetCode', lc, `${lc?.total_solved ?? '—'} solved`], ['Codeforces', cf, cf ? `Rating ${cf.rating ?? '—'}` : 'open tab to load'], ['CodeChef', cc, cc ? `Rating ${cc.rating ?? '—'}` : 'open tab'], ['HackerRank', hr, hr ? `${(hr.badges || []).length} badges` : 'open tab'], ['Kaggle', kg, kg ? 'profile' : 'open tab']].map(([p, d, m]: any) => (
        <div key={p} className="card-soft" style={{ padding: 14 }}><b>{p}</b> <StatusChip status={d?.status || 'pending'} /><div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted-ink)' }}>{m}</div>
          <button onClick={() => setTab(p === 'GitHub' ? 'GitHub' : p)} style={{ marginTop: 8, color: 'var(--black)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline' }}>Details →</button></div>))}
    </div>)}

    {tab === 'GitHub' && (<div>
      {!gh ? <p>Loading live GitHub data…</p> : gh.status !== 'verified' ? <p>GitHub {gh.status}. <a href={gh.profile_url} target="_blank" rel="noreferrer">Open profile</a></p> : (<>
        <div className="card-soft" style={{ ...card, padding: 16 }}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <img src={gh.avatar} alt="" width={64} height={64} style={{ borderRadius: 999, border: '1px solid var(--line)' }} />
          <div><h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>@{gh.username} {gh.superstar && <span className="chip" style={{ background: 'var(--cornsilk)', border: '1px solid var(--light-bronze)', color: 'var(--ink)' }}>SUPERSTAR</span>}</h3>
            <div style={{ color: 'var(--muted-ink)', fontSize: 13, margin: '2px 0 6px' }}>{gh.bio}</div>
            <div style={{ fontSize: 13, display: 'flex', gap: 14, flexWrap: 'wrap', color: 'var(--muted-ink)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconFolder size={14} /> {gh.public_repos} repos</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconUsers size={14} /> {gh.followers} followers</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconStar size={14} /> {gh.total_stars} stars</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconGitBranch size={14} /> {gh.total_forks} forks</span>
            </div></div></div></div>
        <div className="card-soft" style={card}><h4>{gh.total_contributions} contributions • streak {gh.current_streak}d (best {gh.longest_streak}d)</h4><GitCal days={gh.contribution_calendar} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card-soft" style={card}><h4>Languages (by bytes)</h4>{(gh.languages || []).map((l: any) => (
            <div key={l.lang} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><span style={{ width: 110, fontSize: 13 }}>{l.lang}</span>
              <div style={{ flex: 1, height: 8, background: '#eee', borderRadius: 999 }}><div style={{ width: `${l.pct}%`, height: 8, background: 'var(--light-bronze)', borderRadius: 999 }} /></div><span style={{ fontSize: 12 }}>{l.pct}%</span></div>))}</div>
          <div className="card-soft" style={card}><h4>Activity (recent 90d events)</h4><p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>Commits {gh.recent_commits_90d} • PRs {gh.recent_prs_90d} • Issues {gh.recent_issues_90d}</p>
            <h4 style={{ marginTop: 14 }}>Resume project ↔ repo match</h4>{matchRepos.map((m: any) => <div key={m.project} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '4px 0' }}>{m.repo ? <IconCheckCircle size={14} style={{ color: '#166534' }} /> : <IconAlertCircle size={14} style={{ color: '#991b1b' }} />} <span>{m.project}{m.repo ? ` → ${m.repo}` : ' — not found on GitHub'}</span></div>)}{!matchRepos.length && 'Add projects to resume for matching.'}</div>
        </div>
        <div className="card-soft" style={card}><h4>Top repositories (by stars)</h4>
          <table style={{ width: '100%', fontSize: 13 }}><thead><tr><th>Repo</th><th>Lang</th><th>Stars</th><th>Forks</th><th>Updated</th><th>License</th></tr></thead>
            <tbody>{(gh.top_repositories || []).map((r: any) => <tr key={r.name}><td><a href={r.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{r.name}</a></td><td>{r.language}</td><td>{r.stars}</td><td>{r.forks}</td><td>{r.updated}</td><td>{r.license || '—'}</td></tr>)}</tbody></table></div>
      </>)}
    </div>)}

    {tab === 'LeetCode' && (<div>
      {!lc ? <p>Loading LeetCode GraphQL…</p> : lc.status !== 'verified' ? <p>LeetCode {lc.status} — <a href={lc.profile_url} target="_blank" rel="noreferrer">open profile</a> (private/blocked profiles can't be read).</p> : (<>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="card-soft" style={{ padding: 14 }}><Donut easy={lc.easy_solved} med={lc.medium_solved} hard={lc.hard_solved} /></div>
          <div className="card-soft" style={{ padding: 14 }}><h4>Easy {lc.easy_solved} • Medium {lc.medium_solved} • Hard {lc.hard_solved}</h4>
            <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>Acceptance {lc.acceptance_rate ?? '—'}% • Rank {lc.ranking ?? '—'} • Streak {lc.streak}d • Active {lc.active_days}d</p>
            <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>Contest {lc.contest?.rating ? `${Math.round(lc.contest.rating)} • top ${lc.contest.top_pct}%` : 'unrated'} {lc.contest?.badge && `• ${lc.contest.badge}`}</p></div>
          <div className="card-soft" style={{ padding: 14 }}><h4>Badges ({(lc.badges || []).length})</h4>{(lc.badges || []).slice(0, 8).map((b: any) => <span key={b.name} className="chip" style={{ background: 'var(--cornsilk)', margin: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconAward size={13} /> {b.name}</span>)}{!(lc.badges || []).length && 'No badges yet.'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="card-soft" style={card}><h4>Submission heatmap</h4><LCHeat heat={lc.submission_heatmap} /></div>
          <div className="card-soft" style={card}><h4>Concept strength radar</h4><Radar data={lc.concept_radar} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card-soft" style={card}><h4>Languages</h4>{(lc.language_counts || []).map((l: any) => <div key={l.lang} style={{ fontSize: 13 }}>{l.lang}: <b>{l.count}</b></div>)}{!(lc.language_counts || []).length && '—'}</div>
          <div className="card-soft" style={card}><h4>Recent submissions</h4>{(lc.recent_submissions || []).slice(0, 8).map((s: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '4px 0' }}>{s.statusDisplay === 'Accepted' ? <IconCheckCircle size={14} style={{ color: '#166534' }} /> : <IconAlertCircle size={14} style={{ color: '#991b1b' }} />} <span>{s.title}</span> <span style={{ color: '#888' }}>({s.lang})</span></div>)}{!(lc.recent_submissions || []).length && '—'}</div>
        </div>
      </>)}
    </div>)}

    {tab === 'Codeforces' && (<div className="card-soft" style={card}>{!cf ? <p>Loading Codeforces API…</p> : cf.status !== 'verified' ? <p>Codeforces {cf.status}. <a href={cf.profile_url} target="_blank" rel="noreferrer">Open profile</a></p> : (<>
      <h3>{cf.handle} — <span className="chip" style={{ background: 'var(--cornsilk)' }}>{cf.rank} {cf.rating}</span> (max {cf.max_rating})</h3>
      <RatingLine hist={cf.rating_history} />
      <p style={{ fontSize: 13, color: 'var(--muted-ink)' }}>Solved {cf.solved} • Attempted {cf.attempted} • Contribution {cf.contribution} • Friends {cf.friends}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><h4>Languages</h4>{(cf.languages || []).map(([l, n]: any) => <div key={l} style={{ fontSize: 13 }}>{l}: <b>{n}</b></div>)}</div>
        <div><h4>Topic coverage</h4>{(cf.topic_coverage || []).map(([t, n]: any) => <div key={t} style={{ fontSize: 13 }}>{t}: <b>{n}</b></div>)}</div>
      </div></>)}</div>)}

    {tab === 'CodeChef' && (<div className="card-soft" style={card}>{!cc ? <p>Loading…</p> : (<><h3>CodeChef {cc.rating ? `Rating ${cc.rating}` : `(${cc.status})`}</h3><a href={cc.profile_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}><IconExternal size={14} /> Open profile</a></>)}</div>)}
    {tab === 'HackerRank' && (<div className="card-soft" style={card}>{!hr ? <p>Loading…</p> : (<><h3>Badges ({(hr.badges || []).length})</h3>{(hr.badges || []).map((b: string) => <span key={b} className="chip" style={{ background: 'var(--tea-green)', margin: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconAward size={13} /> {b}</span>)}
      <h4 style={{ marginTop: 12 }}>Skills</h4>{(hr.skills || []).join(', ') || '—'}<div style={{ marginTop: 8 }}><a href={hr.profile_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconExternal size={14} /> Open profile</a></div></>)}</div>)}
    {tab === 'Kaggle' && (<div className="card-soft" style={card}>{!kg ? <p>Loading…</p> : (<><h3>Kaggle ({kg.status})</h3><p>{kg.page_title}</p><p>Tiers seen: {(kg.tiers_seen || []).join(', ') || '—'}</p><a href={kg.profile_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}><IconExternal size={14} /> Open profile</a></>)}</div>)}

    {tab === 'Professional' && (<div>
      <div className="card-soft" style={card}><h4>Resume links</h4>{(sum?.links || []).filter((l: any) => ['linkedin', 'portfolio', 'other', 'medium', 'dev_to'].includes(l.platform)).map((l: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0', fontSize: 13 }}><IconExternal size={14} /> <span>{l.platform} — {l.url}</span> <StatusChip status={l.status} /></div>))}</div>
      <div className="card-soft" style={card}><h4>Featured LinkedIn / Portfolio Artifacts</h4>
        <div style={{ display: 'flex', gap: 8 }}><input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Paste publication or artifact URL…" style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: 8 }} />
          <button className="btn-dark" onClick={addPost} disabled={checking}>{checking ? 'Checking…' : 'Add Artifact'}</button></div>
        {posts.map((p: any, i: number) => (<div key={i} className="card" style={{ padding: 10, marginTop: 8 }}><b>{p.title}</b><div style={{ fontSize: 12, color: '#666' }}>{p.url}</div><StatusChip status={p.status} />
          <button onClick={() => { const a = posts.filter((_: any, j: number) => j !== i); setPosts(a); localStorage.setItem(`posts-${resumeId}`, JSON.stringify(a)) }} style={{ marginLeft: 8 }}>Remove</button></div>))}
        {!posts.length && <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Add your best articles, research, or GitHub showcase links to strengthen verification.</p>}</div>
    </div>)}

    {tab === 'Warnings' && (<div className="card-soft" style={card}>
      {(sum?.links || []).filter((l: any) => l.status !== 'verified').map((l: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0', fontSize: 13, color: 'var(--danger)' }}>
          <IconAlertTriangle size={15} /> <span>{l.platform}: {l.url} — {l.status}. Review link accessibility or replace.</span>
        </div>))}
      {!(sum?.links || []).some((l: any) => l.status !== 'verified') && 'All links verified. Add missing platform links to strengthen proof.'}
    </div>)}
  </div>)
}
