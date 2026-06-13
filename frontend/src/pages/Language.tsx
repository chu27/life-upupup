import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getCheckins, upsertCheckin, getStudyGoals, createStudyGoal, getResources, createResource, deleteResource } from '../api'

const RESOURCE_TYPES = ['教材', '网站', '视频', 'App']

export default function Language({ lang }: { lang: 'japanese' | 'english' }) {
  const emoji = lang === 'japanese' ? '🇯🇵' : '🇬🇧'
  const title = lang === 'japanese' ? '日语学习' : '英语学习'
  const today = dayjs()

  const [checkins, setCheckins] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [cForm, setCForm] = useState({ date: today.format('YYYY-MM-DD'), duration_minutes: '', content: '', apps_used: '' })
  const [gForm, setGForm] = useState({ name: '', target_date: '', progress_notes: '' })
  const [rForm, setRForm] = useState({ title: '', url: '', resource_type: '网站', notes: '' })

  const load = () => {
    getCheckins(lang, { year: today.year(), month: today.month() + 1 }).then(setCheckins)
    getStudyGoals(lang).then(setGoals)
    getResources(lang).then(setResources)
  }
  useEffect(() => { load() }, [lang])

  const totalMinutes = checkins.reduce((s, c) => s + c.duration_minutes, 0)
  const streak = (() => {
    let count = 0
    let d = today
    const set = new Set(checkins.map(c => c.date))
    while (set.has(d.format('YYYY-MM-DD'))) { count++; d = d.subtract(1, 'day') }
    return count
  })()

  // Chart data: last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = today.subtract(6 - i, 'day')
    const key = d.format('YYYY-MM-DD')
    const c = checkins.find(x => x.date === key)
    return { date: d.format('M/D'), minutes: c?.duration_minutes || 0 }
  })

  // Calendar: days in current month
  const daysInMonth = today.daysInMonth()
  const startDow = today.startOf('month').day()
  const checkinDates = new Set(checkins.map(c => c.date))

  const handleSaveCheckin = async () => {
    await upsertCheckin({ ...cForm, language: lang, duration_minutes: Number(cForm.duration_minutes) })
    setShowCheckinModal(false); load()
  }

  const handleSaveGoal = async () => {
    await createStudyGoal({ ...gForm, language: lang, target_date: gForm.target_date || null })
    setShowGoalModal(false); load()
  }

  const handleSaveResource = async () => {
    await createResource({ ...rForm, language: lang })
    setShowResourceModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{emoji} {title}</div>
        <Button onClick={() => { setCForm({ date: today.format('YYYY-MM-DD'), duration_minutes: '', content: '', apps_used: '' }); setShowCheckinModal(true) }}>+ 今日打卡</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="连续打卡" value={streak} unit="天" sub={`本月累计 ${checkins.length} 天`} />
        <StatCard label="本月学习时长" value={(totalMinutes / 60).toFixed(1)} unit="h" sub={`日均 ${checkins.length ? Math.round(totalMinutes / today.date()) : 0} 分钟`} />
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(108,79,163,.08)', padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>学习目标</div>
          {goals[0] ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#6c4fa3' }}>{goals[0].name}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                {goals[0].target_date ? `距考试 ${dayjs(goals[0].target_date).diff(today, 'day')} 天` : '目标日期未设置'}
              </div>
            </>
          ) : <div style={{ fontSize: 13, color: '#aaa' }}>暂无目标 <span onClick={() => setShowGoalModal(true)} style={{ color: '#6c4fa3', cursor: 'pointer' }}>+ 设置</span></div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Calendar */}
        <Card>
          <CardTitle>本月打卡日历 · {today.format('M月')}</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
            {['日','一','二','三','四','五','六'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#aaa' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = today.startOf('month').add(i, 'day')
              const key = d.format('YYYY-MM-DD')
              const isToday = key === today.format('YYYY-MM-DD')
              const isDone = checkinDates.has(key)
              return (
                <div key={key} style={{
                  aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                  background: isDone ? '#6c4fa3' : isToday ? 'transparent' : '#f5f3fa',
                  color: isDone ? '#fff' : isToday ? '#6c4fa3' : '#aaa',
                  border: isToday && !isDone ? '2px solid #6c4fa3' : 'none',
                  fontWeight: isToday ? 700 : 400,
                }}>{i + 1}</div>
              )
            })}
          </div>
        </Card>

        {/* Chart */}
        <Card>
          <CardTitle>近7天学习时长（分钟）</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#a07fd4" radius={[4, 4, 0, 0]} name="学习时长" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Resources */}
        <Card style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <CardTitle>学习资源收藏</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setRForm({ title: '', url: '', resource_type: '网站', notes: '' }); setShowResourceModal(true) }}>+ 收藏</Button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['标题', '类型', '备注', '链接', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{r.title}</td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}><Badge variant="purple">{r.resource_type}</Badge></td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{r.notes || '—'}</td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6c4fa3', fontSize: 12 }}>打开 ↗</a> : '—'}
                  </td>
                  <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    <span onClick={async () => { await deleteResource(r.id); load() }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>暂无资源</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      {showCheckinModal && (
        <Modal title="今日打卡" onClose={() => setShowCheckinModal(false)}>
          <FormRow label="日期"><Input type="date" value={cForm.date} onChange={v => setCForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="学习时长（分钟）*"><Input type="number" value={cForm.duration_minutes} onChange={v => setCForm(f => ({ ...f, duration_minutes: v }))} placeholder="如：60" /></FormRow>
          <FormRow label="学习内容"><Textarea value={cForm.content} onChange={v => setCForm(f => ({ ...f, content: v }))} rows={3} placeholder="今天学了什么…" /></FormRow>
          <FormRow label="使用的 App"><Input value={cForm.apps_used} onChange={v => setCForm(f => ({ ...f, apps_used: v }))} placeholder="如：Anki, NHK Web（逗号分隔）" /></FormRow>
          <ModalFooter onClose={() => setShowCheckinModal(false)} onSubmit={handleSaveCheckin} />
        </Modal>
      )}

      {showGoalModal && (
        <Modal title="设置学习目标" onClose={() => setShowGoalModal(false)}>
          <FormRow label="目标名称 *"><Input value={gForm.name} onChange={v => setGForm(f => ({ ...f, name: v }))} placeholder={lang === 'japanese' ? '如：JLPT N1' : '如：英语六级'} /></FormRow>
          <FormRow label="目标日期"><Input type="date" value={gForm.target_date} onChange={v => setGForm(f => ({ ...f, target_date: v }))} /></FormRow>
          <FormRow label="当前进度备注"><Textarea value={gForm.progress_notes} onChange={v => setGForm(f => ({ ...f, progress_notes: v }))} rows={3} /></FormRow>
          <ModalFooter onClose={() => setShowGoalModal(false)} onSubmit={handleSaveGoal} />
        </Modal>
      )}

      {showResourceModal && (
        <Modal title="收藏学习资源" onClose={() => setShowResourceModal(false)}>
          <FormRow label="标题 *"><Input value={rForm.title} onChange={v => setRForm(f => ({ ...f, title: v }))} /></FormRow>
          <FormRow label="类型"><Select value={rForm.resource_type} onChange={v => setRForm(f => ({ ...f, resource_type: v }))} options={RESOURCE_TYPES.map(t => ({ label: t, value: t }))} /></FormRow>
          <FormRow label="链接"><Input value={rForm.url} onChange={v => setRForm(f => ({ ...f, url: v }))} placeholder="https://..." /></FormRow>
          <FormRow label="备注"><Input value={rForm.notes} onChange={v => setRForm(f => ({ ...f, notes: v }))} /></FormRow>
          <ModalFooter onClose={() => setShowResourceModal(false)} onSubmit={handleSaveResource} />
        </Modal>
      )}
    </div>
  )
}
