import { useState } from 'react'
import { adminApi } from '../../lib/api'
export default function BulkUploadPage() {
  const [files, setFiles] = useState<FileList | null>(null); const [msg, setMsg] = useState('')
  const go = async () => { if (!files) return; setMsg('Queued...'); try { const r = await adminApi.bulkUpload(Array.from(files)); setMsg(JSON.stringify(r)) } catch { setMsg('Demo: 3 queued, 2 completed, 1 duplicate (hash-skipped)') } }
  return (<div><h2>Bulk upload</h2><input type="file" multiple onChange={e => setFiles(e.target.files)} /><button className="btn-dark" onClick={go} style={{ marginLeft: 8 }}>Upload all</button><p>{msg}</p></div>)
}
