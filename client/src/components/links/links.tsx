import { IconStar, IconAlertTriangle } from '../ui/icons'

// §16.5 Links components
export function PlatformStatusCard({ platform, status, metric }: any) {
  return <div className="card" style={{ padding: 14 }}><b>{platform}</b> <span className="chip" style={{ background: status === 'verified' ? 'var(--tea-green)' : 'var(--papaya-whip)' }}>{status}</span><div>{metric}</div></div>
}
export function GitHubHeatmap({ cells = [] }: any) {
  const demo = cells.length ? cells : Array.from({ length: 182 }, (_, i) => (i * 7) % 5)
  return (<div className="github-heatmap">{demo.map((v: number, i: number) => (<div key={i} className="github-cell" title={`${v} contributions`} style={{ background: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'][v] }} />))}</div>)
}
export function GitHubStatsRow({ stats }: any) {
  return <div style={{ display: 'flex', gap: 12 }}>{[['Repos', stats?.public_repos], ['Stars', stats?.total_stars], ['Followers', stats?.followers]].map(([l, v]: any) => <div key={l} className="card" style={{ padding: 10 }}>{l}: <b>{v ?? '—'}</b></div>)}</div>
}
export function GitHubRepoTable({ repos }: any) {
  return (<table style={{ width: '100%' }}><thead><tr><th>Repo</th><th>Lang</th><th><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconStar size={13} /> Stars</span></th></tr></thead><tbody>{(repos || []).map((r: any) => <tr key={r.name}><td>{r.name}</td><td>{r.language}</td><td>{r.stars}</td></tr>)}</tbody></table>)
}
export function LeetCodeRadar({ concepts }: any) {
  const entries = Object.entries(concepts || { arrays: 70, dp: 35, graphs: 40 })
  return (<div className="card" style={{ padding: 14 }}><b>Concept strength</b>{entries.map(([k, v]: any) => (<div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 120 }}>{k}</span><div style={{ flex: 1, height: 8, background: '#eee', borderRadius: 999 }}><div style={{ width: `${v}%`, height: 8, background: 'var(--light-bronze)', borderRadius: 999 }} /></div><span>{v}</span></div>))}</div>)
}
export function DifficultyDonut({ easy = 0, medium = 0, hard = 0 }: any) {
  return <div className="card" style={{ padding: 14 }}>Easy {easy} • Medium {medium} • Hard {hard} • Total {easy + medium + hard}</div>
}
export function LanguageUsageBar({ langs }: any) {
  return (<div className="card" style={{ padding: 14 }}>{(langs || []).map((l: any) => <div key={l.lang}>{l.lang}: {l.count}</div>)}{!(langs?.length) && 'No language data yet.'}</div>)
}
export function LinkWarningList({ warnings }: any) {
  return (<div className="card" style={{ padding: 14 }}><b>Warnings</b>{(warnings || []).map((w: string) => <div key={w} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}><IconAlertTriangle size={14} /> {w}</div>)}{!(warnings?.length) && 'All links healthy.'}</div>)
}
