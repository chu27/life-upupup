import { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Card from '../components/Card'
import Button from '../components/Button'
import { getTasks, createTask, updateTask, toggleTask, deleteTask } from '../api'

dayjs.extend(isoWeek)

const MODULE_TAGS = ['📚 读书', '🎬 纪录片', '⚖️ 身材', '🥗 饮食', '💰 理财', '📈 股票', '🇯🇵 日语', '🇬🇧 英语', '💧 饮水']

type Period = 'today' | 'week' | 'month' | 'year'

// 根据 period 和当前锚点日期，计算展示标题、date_key 和导航单位
function getPeriodInfo(period: Period, anchor: Dayjs) {
  switch (period) {
    case 'today':
      return {
        label: anchor.format('YYYY年M月D日 dddd'),
        dateKey: anchor.format('YYYY-MM-DD'),
        prev: anchor.subtract(1, 'day'),
        next: anchor.add(1, 'day'),
        isToday: anchor.isSame(dayjs(), 'day'),
      }
    case 'week': {
      const start = anchor.startOf('isoWeek')
      const end = anchor.endOf('isoWeek')
      return {
        label: `${start.format('YYYY年M月D日')} — ${end.format('M月D日')}`,
        dateKey: start.format('YYYY-MM-DD'),
        prev: start.subtract(1, 'week'),
        next: start.add(1, 'week'),
        isToday: start.isSame(dayjs().startOf('isoWeek'), 'day'),
      }
    }
    case 'month':
      return {
        label: anchor.format('YYYY年M月'),
        dateKey: anchor.startOf('month').format('YYYY-MM-DD'),
        prev: anchor.subtract(1, 'month'),
        next: anchor.add(1, 'month'),
        isToday: anchor.isSame(dayjs(), 'month'),
      }
    case 'year':
      return {
        label: anchor.format('YYYY年'),
        dateKey: anchor.startOf('year').format('YYYY-MM-DD'),
        prev: anchor.subtract(1, 'year'),
        next: anchor.add(1, 'year'),
        isToday: anchor.isSame(dayjs(), 'year'),
      }
  }
}

const periodTitle: Record<Period, string> = {
  today: '今日任务', week: '本周任务', month: '本月任务', year: '本年任务',
}

const navLabel: Record<Period, [string, string]> = {
  today: ['昨天', '明天'],
  week: ['上一周', '下一周'],
  month: ['上个月', '下个月'],
  year: ['上一年', '下一年'],
}

const backLabel: Record<Period, string> = {
  today: '回到今天', week: '回到本周', month: '回到本月', year: '回到今年',
}

export default function Tasks({ period }: { period: Period }) {
  const [anchor, setAnchor] = useState<Dayjs>(dayjs())
  const [tasks, setTasks] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('')

  // 切换 period 时重置到当前时间
  useEffect(() => { setAnchor(dayjs()) }, [period])

  const info = getPeriodInfo(period, anchor)

  const load = () => getTasks(period, info.dateKey).then(setTasks)
  useEffect(() => { load() }, [period, info.dateKey])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createTask({ period, date_key: info.dateKey, title: newTitle.trim(), module_tag: newTag || null })
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
    setEditingId(t.id); setEditTitle(t.title); setEditTag(t.module_tag || '')
  }

  const saveEdit = async (id: number) => {
    await updateTask(id, { title: editTitle.trim(), module_tag: editTag || null })
    setEditingId(null); load()
  }

  const done = tasks.filter(t => t.is_done).length
  const [prevLabel, nextLabel] = navLabel[period]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>✅ {periodTitle[period]}</div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: '#f5f3fa', border: '1.5px solid #e4dff0', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'not-allowed', color: '#aaa',
        }} title="Claude API 功能待实装">🤖 AI 生成任务</button>
      </div>

      {/* Period navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setAnchor(info.prev)} style={{
          padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e4dff0',
          background: '#f5f3fa', fontSize: 13, cursor: 'pointer', color: '#555',
        }}>← {prevLabel}</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1b1b1b' }}>{info.label}</span>
        </div>

        <button onClick={() => setAnchor(info.next)} style={{
          padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e4dff0',
          background: '#f5f3fa', fontSize: 13, cursor: 'pointer', color: '#555',
        }}>{nextLabel} →</button>

        {!info.isToday && (
          <button onClick={() => setAnchor(dayjs())} style={{
            padding: '6px 12px', borderRadius: 8, border: '1.5px solid #6c4fa3',
            background: '#ede8f7', fontSize: 12, cursor: 'pointer', color: '#6c4fa3', fontWeight: 600,
          }}>{backLabel[period]}</button>
        )}
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
            {MODULE_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
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
            🎉 全部完成！
          </div>
        )}
      </Card>
    </div>
  )
}
