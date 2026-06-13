import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getBooks, createBook, updateBook, deleteBook } from '../api'

const STATUSES = ['全部', '在读', '读完', '想读']
const STATUS_MAP: Record<string, string> = { '在读': 'orange', '读完': 'green', '想读': 'gray' }

function Stars({ n }: { n: number | null }) {
  if (!n) return <span style={{ color: '#ccc' }}>—</span>
  return <span style={{ color: '#f4a261', letterSpacing: 1 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

function staleDays(lastRead: string | null) {
  if (!lastRead) return null
  return dayjs().diff(dayjs(lastRead), 'day')
}

export default function Books() {
  const [books, setBooks] = useState<any[]>([])
  const [tab, setTab] = useState('全部')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', status: '想读', rating: '', notes: '', tags: '', finish_date: '' })

  const load = async () => {
    const status = tab === '全部' ? undefined : tab
    setBooks(await getBooks(status))
  }

  useEffect(() => { load() }, [tab])

  const openNew = () => { setEditing(null); setForm({ title: '', status: '想读', rating: '', notes: '', tags: '', finish_date: '' }); setShowModal(true) }
  const openEdit = (b: any) => {
    setEditing(b)
    setForm({ title: b.title, status: b.status, rating: b.rating ?? '', notes: b.notes ?? '', tags: b.tags ?? '', finish_date: b.finish_date ?? '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = { ...form, rating: form.rating ? Number(form.rating) : null, finish_date: form.finish_date || null }
    if (editing) await updateBook(editing.id, payload)
    else await createBook(payload)
    setShowModal(false); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除？')) return
    await deleteBook(id); load()
  }

  const displayed = tab === '全部' ? books : books.filter(b => b.status === tab)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>📚 读书</div>
        <Button onClick={openNew}>+ 新增书籍</Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e4dff0', marginBottom: 18 }}>
        {STATUSES.map(s => (
          <div key={s} onClick={() => setTab(s)} style={{
            padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: tab === s ? '#6c4fa3' : '#999',
            borderBottom: `2px solid ${tab === s ? '#6c4fa3' : 'transparent'}`, marginBottom: -2, fontWeight: tab === s ? 600 : 400,
          }}>{s}</div>
        ))}
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr>
              {['书名', '状态', '最后阅读', '评分', '标签', '读完日期', '操作'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(b => {
              const days = b.status === '在读' ? staleDays(b.last_read_at) : null
              return (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(b)}>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{b.title}</td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={STATUS_MAP[b.status]}>{b.status}</Badge></td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {b.status === '在读' && b.last_read_at
                      ? days === 0
                        ? <span style={{ color: '#6c4fa3', fontWeight: 600 }}>今天</span>
                        : days !== null && days > 14
                          ? <span style={{ color: '#e65100', fontSize: 12 }}>⚠️ 已搁置 {days} 天</span>
                          : <span style={{ color: '#555' }}>{days} 天前</span>
                      : <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}><Stars n={b.rating} /></td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {b.tags ? b.tags.split(',').map((t: string) => (
                      <span key={t} style={{ background: '#ede8f7', color: '#6c4fa3', borderRadius: 20, fontSize: 11, padding: '2px 8px', marginRight: 4 }}>{t.trim()}</span>
                    )) : '—'}
                  </td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{b.finish_date ?? '—'}</td>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span onClick={e => { e.stopPropagation(); handleDelete(b.id) }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                  </td>
                </tr>
              )
            })}
            {displayed.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>暂无书籍记录</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title={editing ? '编辑书籍' : '新增书籍'} onClose={() => setShowModal(false)}>
          <FormRow label="书名 *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="书名" /></FormRow>
          <FormRow label="阅读状态">
            <Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['想读','在读','读完'].map(s => ({ label: s, value: s }))} />
          </FormRow>
          <FormRow label="评分（1-5）">
            <Select value={String(form.rating)} onChange={v => setForm(f => ({ ...f, rating: v }))} options={[{ label: '—', value: '' }, ...['1','2','3','4','5'].map(s => ({ label: '★'.repeat(+s), value: s }))]} />
          </FormRow>
          <FormRow label="标签（逗号分隔）"><Input value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="如：心理, 历史" /></FormRow>
          {form.status === '读完' && (
            <FormRow label="读完日期"><Input type="date" value={form.finish_date} onChange={v => setForm(f => ({ ...f, finish_date: v }))} /></FormRow>
          )}
          <FormRow label="心得感悟"><Textarea value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="写下你的读后感…" rows={5} /></FormRow>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
