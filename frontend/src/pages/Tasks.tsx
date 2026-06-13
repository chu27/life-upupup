import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Card from '../components/Card'
import Button from '../components/Button'
import { getTasks, createTask, updateTask, toggleTask, deleteTask } from '../api'

dayjs.extend(isoWeek)

const MODULE_TAGS = ['📚 读书', '🎬 纪录片', '⚖️ 身材', '🥗 饮食', '💰 理财', '📈 股票', '🇯🇵 日语', '🇬🇧 英语', '💧 饮水']

type Period = 'today' | 'week' | 'month' | 'year'

function getRange(period: Period) {
  const today = dayjs()
  switch (period) {
    case 'today': return { date: today.format('YYYY-MM-DD'), label: today.format('YYYY年M月D日') }
    case 'week': return {
      start: today.startOf('isoWeek').format('YYYY-MM-DD'),
      end: today.endOf('isoWeek').format('YYYY-MM-DD'),
      label: `${today.startOf('isoWeek').format('M月D日')} — ${today.endOf('isoWeek').format('M月D日')}`,
    }
    case 'month': return {
      start: today.startOf('month').format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
      label: today.format('YYYY年M月'),
    }
    case 'year': return {
      start: today.startOf('year').format('YYYY-MM-DD'),
      end: today.endOf('year').format('YYYY-MM-DD'),
      label: today.format('YYYY年'),
    }
  }
}

const periodTitle: Record<Period, string> = {
  today: '今日任务', week: '本周任务', month: '本月任务', year: '本年任务',
}

export default function Tasks({ period }: { period: Period }) {
  const today = dayjs().format('YYYY-MM-DD')
  const [tasks, setTasks] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('')

  const range = getRange(period)

  const load = () => getTasks(range).then(setTasks)
  useEffect(() => { load() }, [period])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createTask({ date: today, title: newTitle.trim(), module_tag: newTag || null })
    setNewTitle(''); setNewTag(''); load()
  }

  const handleToggle = async (id: number) => {
    const updated = await toggleTask(id)
    setTasks(ts => ts.map(t => t.id === id ? updated : t))
  }

  const handleDelete = async (id: number) => {
    await deleteTask(id); load()
  }

  const startEdit = (t: any) => {
    setEditingId(t.id)
    setEditTitle(t.title)
    setEditTag(t.module_tag || '')
  }

  const saveEdit = async (id: number) => {
    await updateTask(id, { title: editTitle.trim(), module_tag: editTag || null })
    setEditingId(null); load()
  }

  const done = tasks.filter(t => t.is_done).length
  const showDate = period !== 'today'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>✅ {periodTitle[period]}</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{range.label}</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: '#f5f3fa', border: '1.5px solid #e4dff0', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'not-allowed', color: '#aaa',
        }} title="Claude API 功能待实装">
          🤖 AI 生成任务
        </button>
      </div>

      <Card>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#555' }}>完成进度</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6c4fa3' }}>{done} / {tasks.length} 完成</span>
        </div>
        <div style={{ background: '#eee', borderRadius: 99, height: 6, marginBottom: 20 }}>
          <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: tasks.length ? `${(done / tasks.length) * 100}%` : '0%', transition: 'width .3s' }} />
        </div>

        {/* Add row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="添加新任务…"
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e4dff0', borderRadius: 8, fontSize: 13, background: '#f5f3fa', outline: 'none' }}
          />
          <select value={newTag} onChange={e => setNewTag(e.target.value)}
            style={{ padding: '8px 10px', border: '1.5px solid #e4dff0', borderRadius: 8, fontSize: 12, background: '#f5f3fa', outline: 'none' }}>
            <option value="">模块标签</option>
            {MODULE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button onClick={handleAdd} size="md">+ 添加</Button>
        </div>

        {/* Task list */}
        {tasks.map(t => (
          <div key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
            {editingId === t.id ? (
              <div style={{ display: 'flex', gap: 8, padding: '10px 0', alignItems: 'center' }}>
                <input
                  value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(t.id)}
                  autoFocus
                  style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #6c4fa3', borderRadius: 7, fontSize: 13, outline: 'none' }}
                />
                <select value={editTag} onChange={e => setEditTag(e.target.value)}
                  style={{ padding: '6px 8px', border: '1.5px solid #e4dff0', borderRadius: 7, fontSize: 12, background: '#f5f3fa', outline: 'none' }}>
                  <option value="">无标签</option>
                  {MODULE_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <button onClick={() => saveEdit(t.id)} style={{ padding: '6px 12px', background: '#6c4fa3', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>保存</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', background: '#f0f0f0', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>取消</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
                <div onClick={() => handleToggle(t.id)} style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: t.is_done ? '#6c4fa3' : 'transparent',
                  border: `2px solid ${t.is_done ? '#6c4fa3' : '#ccc'}`, color: '#fff', fontSize: 12,
                }}>{t.is_done ? '✓' : ''}</div>
                <span style={{ flex: 1, fontSize: 14, textDecoration: t.is_done ? 'line-through' : 'none', color: t.is_done ? '#aaa' : '#1b1b1b' }}>
                  {t.title}
                </span>
                {showDate && (
                  <span style={{ fontSize: 11, color: '#bbb' }}>{dayjs(t.date).format('M/D')}</span>
                )}
                {t.module_tag && (
                  <span style={{ fontSize: 11, padding: '2px 8px', background: '#ede8f7', color: '#6c4fa3', borderRadius: 20 }}>{t.module_tag}</span>
                )}
                <span onClick={() => startEdit(t)} style={{ color: '#bbb', cursor: 'pointer', fontSize: 13, padding: '0 2px' }} title="编辑">✏️</span>
                <span onClick={() => handleDelete(t.id)} style={{ color: '#ddd', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</span>
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
            暂无任务，在上方输入框添加
          </div>
        )}

        {done === tasks.length && tasks.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 14, color: '#6c4fa3', fontWeight: 600 }}>
            🎉 {periodTitle[period]}全部完成！
          </div>
        )}
      </Card>
    </div>
  )
}
