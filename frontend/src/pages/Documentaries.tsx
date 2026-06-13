import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getDocs, createDoc, updateDoc, deleteDoc } from '../api'

const STATUS_MAP: Record<string, string> = { '已看': 'green', '想看': 'gray' }

function Stars({ n }: { n: number | null }) {
  if (!n) return <span style={{ color: '#ccc' }}>—</span>
  return <span style={{ color: '#f4a261' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export default function Documentaries() {
  const [docs, setDocs] = useState<any[]>([])
  const [tab, setTab] = useState('全部')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', status: '想看', rating: '', notes: '', platform: '', video_url: '', tags: '', watch_date: '' })

  const load = async () => setDocs(await getDocs(tab === '全部' ? undefined : tab))
  useEffect(() => { load() }, [tab])

  const openNew = () => { setEditing(null); setForm({ title: '', status: '想看', rating: '', notes: '', platform: '', video_url: '', tags: '', watch_date: '' }); setShowModal(true) }
  const openEdit = (d: any) => { setEditing(d); setForm({ title: d.title, status: d.status, rating: d.rating ?? '', notes: d.notes ?? '', platform: d.platform ?? '', video_url: d.video_url ?? '', tags: d.tags ?? '', watch_date: d.watch_date ?? '' }); setShowModal(true) }

  const handleSave = async () => {
    const payload = { ...form, rating: form.rating ? Number(form.rating) : null, watch_date: form.watch_date || null }
    editing ? await updateDoc(editing.id, payload) : await createDoc(payload)
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🎬 纪录片</div>
        <Button onClick={openNew}>+ 新增</Button>
      </div>
      <div style={{ display: 'flex', borderBottom: '2px solid #e4dff0', marginBottom: 18 }}>
        {['全部', '已看', '想看'].map(s => (
          <div key={s} onClick={() => setTab(s)} style={{ padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: tab === s ? '#6c4fa3' : '#999', borderBottom: `2px solid ${tab === s ? '#6c4fa3' : 'transparent'}`, marginBottom: -2, fontWeight: tab === s ? 600 : 400 }}>{s}</div>
        ))}
      </div>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr>{['片名', '状态', '评分', '平台', '分类', '观看日期', '链接'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id} onClick={() => openEdit(d)} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{d.title}</td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={STATUS_MAP[d.status]}>{d.status}</Badge></td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}><Stars n={d.rating} /></td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{d.platform || '—'}</td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  {d.tags ? d.tags.split(',').map((t: string) => <span key={t} style={{ background: '#ede8f7', color: '#6c4fa3', borderRadius: 20, fontSize: 11, padding: '2px 8px', marginRight: 4 }}>{t.trim()}</span>) : '—'}
                </td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{d.watch_date || '—'}</td>
                <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  {d.video_url ? <a href={d.video_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#6c4fa3', fontSize: 12 }}>打开 ↗</a> : '—'}
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>暂无纪录片记录</td></tr>}
          </tbody>
        </table>
      </Card>
      {showModal && (
        <Modal title={editing ? '编辑纪录片' : '新增纪录片'} onClose={() => setShowModal(false)}>
          <FormRow label="片名 *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="片名" /></FormRow>
          <FormRow label="状态"><Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['想看','已看'].map(s => ({ label: s, value: s }))} /></FormRow>
          <FormRow label="评分"><Select value={String(form.rating)} onChange={v => setForm(f => ({ ...f, rating: v }))} options={[{ label: '—', value: '' }, ...['1','2','3','4','5'].map(s => ({ label: '★'.repeat(+s), value: s }))]} /></FormRow>
          <FormRow label="观看平台"><Input value={form.platform} onChange={v => setForm(f => ({ ...f, platform: v }))} placeholder="Netflix / B站 / YouTube" /></FormRow>
          <FormRow label="视频链接"><Input value={form.video_url} onChange={v => setForm(f => ({ ...f, video_url: v }))} placeholder="https://..." /></FormRow>
          <FormRow label="标签（逗号分隔）"><Input value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="如：自然, 历史" /></FormRow>
          {form.status === '已看' && <FormRow label="观看日期"><Input type="date" value={form.watch_date} onChange={v => setForm(f => ({ ...f, watch_date: v }))} /></FormRow>}
          <FormRow label="观后感"><Textarea value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} rows={4} /></FormRow>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
