import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getBodyRecords, getLatestBody, upsertBody, deleteBody, getWorkouts, createWorkout, deleteWorkout } from '../api'

const WORKOUT_TYPES = ['跑步', '力量训练', '瑜伽', '游泳', '骑行', '球类运动', '健走', '拉伸', '其他']
const WORKOUT_ICON: Record<string, string> = {
  '跑步': '🏃', '力量训练': '🏋️', '瑜伽': '🧘', '游泳': '🏊',
  '骑行': '🚴', '球类运动': '⚽', '健走': '🚶', '拉伸': '🤸', '其他': '💪',
}

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

  const [workouts, setWorkouts] = useState<any[]>([])
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [wForm, setWForm] = useState({ date: dayjs().format('YYYY-MM-DD'), workout_type: '跑步', duration_minutes: '', notes: '' })

  const load = () => {
    getBodyRecords().then(setRecords)
    getLatestBody().then(setLatest)
    getWorkouts().then(setWorkouts)
  }
  useEffect(() => { load() }, [])

  const handleSaveWorkout = async () => {
    await createWorkout({
      ...wForm,
      duration_minutes: wForm.duration_minutes ? Number(wForm.duration_minutes) : null,
    })
    setShowWorkoutModal(false)
    load()
  }

  // 本月打卡天数 & 连续打卡
  const today = dayjs().format('YYYY-MM-DD')
  const thisMonth = dayjs().format('YYYY-MM')
  const monthDates = new Set(workouts.filter(w => w.date.startsWith(thisMonth)).map(w => w.date))
  const monthCount = monthDates.size
  let streak = 0
  for (let i = 0; ; i++) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    if (monthDates.has(d) || workouts.some(w => w.date === d)) streak++
    else break
  }

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
        <Button onClick={() => { setForm({ date: dayjs().format('YYYY-MM-DD'), weight: '', waist: '', chest: '', hip: '', arm: '', leg: '' }); setShowModal(true) }}>+ 记录数据</Button>
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

      {/* 锻炼打卡 */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <CardTitle>💪 锻炼打卡</CardTitle>
          <Button onClick={() => { setWForm({ date: today, workout_type: '跑步', duration_minutes: '', notes: '' }); setShowWorkoutModal(true) }}>+ 打卡</Button>
        </div>

        {/* 统计数字 */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#6c4fa3' }}>{streak}</div>
            <div style={{ fontSize: 11, color: '#999' }}>连续天数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#6c4fa3' }}>{monthCount}</div>
            <div style={{ fontSize: 11, color: '#999' }}>本月打卡</div>
          </div>
        </div>

        {/* 本月日历 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{dayjs().format('YYYY年M月')} 打卡日历</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Array.from({ length: dayjs().daysInMonth() }, (_, i) => {
              const d = dayjs().startOf('month').add(i, 'day').format('YYYY-MM-DD')
              const done = workouts.some(w => w.date === d)
              const isToday = d === today
              return (
                <div key={d} style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#6c4fa3' : isToday ? '#ede8f7' : '#f5f5f5',
                  color: done ? '#fff' : isToday ? '#6c4fa3' : '#bbb',
                  fontWeight: isToday ? 700 : 400,
                  border: isToday && !done ? '1.5px solid #6c4fa3' : 'none',
                }}>{i + 1}</div>
              )
            })}
          </div>
        </div>

        {/* 最近记录 */}
        {workouts.length > 0 && (
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>最近记录</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {workouts.slice(0, 8).map(w => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{WORKOUT_ICON[w.workout_type] || '💪'}</span>
                    <span style={{ fontWeight: 600 }}>{w.workout_type}</span>
                    {w.duration_minutes && <span style={{ color: '#888', fontSize: 12 }}>{w.duration_minutes} 分钟</span>}
                    {w.notes && <span style={{ color: '#aaa', fontSize: 12 }}>· {w.notes}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#bbb', fontSize: 12 }}>{w.date}</span>
                    <span onClick={async () => { if (confirm('删除这条打卡？')) { await deleteWorkout(w.id); load() } }}
                      style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

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

      {showWorkoutModal && (
        <Modal title="锻炼打卡" onClose={() => setShowWorkoutModal(false)}>
          <FormRow label="日期"><Input type="date" value={wForm.date} onChange={v => setWForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="运动类型">
            <Select value={wForm.workout_type} onChange={v => setWForm(f => ({ ...f, workout_type: v }))}
              options={WORKOUT_TYPES.map(t => ({ label: `${WORKOUT_ICON[t]} ${t}`, value: t }))} />
          </FormRow>
          <FormRow label="时长（分钟）">
            <Input type="number" value={wForm.duration_minutes} onChange={v => setWForm(f => ({ ...f, duration_minutes: v }))} placeholder="选填，如：45" />
          </FormRow>
          <FormRow label="备注">
            <Input value={wForm.notes} onChange={v => setWForm(f => ({ ...f, notes: v }))} placeholder="选填，如：跑了5公里" />
          </FormRow>
          <ModalFooter onClose={() => setShowWorkoutModal(false)} onSubmit={handleSaveWorkout} />
        </Modal>
      )}

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
