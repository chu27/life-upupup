import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, ModalFooter } from '../components/Modal'
import { getBodyRecords, getLatestBody, upsertBody, deleteBody } from '../api'

const FIELDS = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'waist', label: '腰围', unit: 'cm' },
  { key: 'chest', label: '胸围', unit: 'cm' },
  { key: 'hip', label: '臀围', unit: 'cm' },
  { key: 'arm', label: '臂围', unit: 'cm' },
  { key: 'leg', label: '腿围', unit: 'cm' },
]

export default function Body() {
  const [records, setRecords] = useState<any[]>([])
  const [latest, setLatest] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ date: dayjs().format('YYYY-MM-DD'), weight: '', waist: '', chest: '', hip: '', arm: '', leg: '' })
  const [range, setRange] = useState(30)

  const load = () => {
    getBodyRecords().then(setRecords)
    getLatestBody().then(setLatest)
  }
  useEffect(() => { load() }, [])

  const chartData = records.slice(0, range).reverse().map(r => ({
    date: dayjs(r.date).format('M/D'),
    weight: r.weight,
  }))

  const handleSave = async () => {
    const payload: any = { date: form.date, weight: Number(form.weight) }
    FIELDS.slice(1).forEach(f => { if (form[f.key]) payload[f.key] = Number(form[f.key]) })
    await upsertBody(payload)
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>⚖️ 身材管理</div>
        <Button onClick={() => { setForm({ date: dayjs().format('YYYY-MM-DD'), weight: '', waist: '', chest: '', hip: '', arm: '', leg: '' }); setShowModal(true) }}>+ 记录今日数据</Button>
      </div>

      {/* Latest snapshot */}
      {latest && (
        <Card>
          <CardTitle>最新记录 · {latest.date}</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, textAlign: 'center' }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 22, fontWeight: 700, color: f.key === 'weight' ? '#6c4fa3' : '#1b1b1b' }}>
                  {latest[f.key] ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{f.label} {f.unit}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weight chart */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <CardTitle>体重变化</CardTitle>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 30, 90].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                background: range === r ? '#6c4fa3' : 'transparent',
                color: range === r ? '#fff' : '#888',
                border: `1.5px solid ${range === r ? '#6c4fa3' : '#e4dff0'}`,
              }}>近{r}天</button>
            ))}
          </div>
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#6c4fa3" strokeWidth={2.5} dot={{ r: 3, fill: '#6c4fa3' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>记录至少 2 天数据后显示图表</div>
        )}
      </Card>

      {/* History list */}
      <Card>
        <CardTitle>历史记录</CardTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['日期', ...FIELDS.map(f => `${f.label}(${f.unit})`), '操作'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>{r.date}</td>
                {FIELDS.map(f => <td key={f.key} style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>{r[f.key] ?? '—'}</td>)}
                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                  <span onClick={async () => { if (confirm('确认删除？')) { await deleteBody(r.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无记录</td></tr>}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="记录身体数据" onClose={() => setShowModal(false)}>
          <FormRow label="日期"><Input type="date" value={form.date} onChange={v => setForm((f: any) => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="体重 (kg) *"><Input type="number" value={form.weight} onChange={v => setForm((f: any) => ({ ...f, weight: v }))} placeholder="如：52.3" /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {FIELDS.slice(1).map(f => (
              <FormRow key={f.key} label={`${f.label} (${f.unit})`}>
                <Input type="number" value={form[f.key]} onChange={v => setForm((ff: any) => ({ ...ff, [f.key]: v }))} placeholder="选填" />
              </FormRow>
            ))}
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
