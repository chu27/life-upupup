import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card from '../components/Card'
import Button from '../components/Button'
import { getTasks, createTask, toggleTask, deleteTask } from '../api'

const MODULE_TAGS = ['📚 读书', '🎬 纪录片', '⚖️ 身材', '🥗 饮食', '💰 理财', '📈 股票', '🇯🇵 日语', '🇬🇧 英语', '💧 饮水']

export default function Tasks() {
  const today = dayjs().format('YYYY-MM-DD')
  const [tasks, setTasks] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('')

  const load = () => getTasks(today).then(setTasks)
  useEffect(() => { load() }, [])

  const handleToggle = async (id: number) => {
    const updated = await toggleTask(id)
    setTasks(ts => ts.map(t => t.id === id ? updated : t))
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createTask({ date: today, title: newTitle.trim(), module_tag: newTag || null })
    setNewTitle(''); setNewTag(''); load()
  }

  const handleDelete = async (id: number) => {
    await deleteTask(id); load()
  }

  const done = tasks.filter(t => t.is_done).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>✅ 今日任务</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{dayjs().format('YYYY年M月D日')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* AI 占位按钮 */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: '#f5f3fa', border: '1.5px solid #e4dff0', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'not-allowed', color: '#aaa',
          }} title="Claude API 功能待实装">
            🤖 AI 生成任务
          </button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#555' }}>今日完成进度</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6c4fa3' }}>{done} / {tasks.length} 完成</span>
        </div>
        <div style={{ background: '#eee', borderRadius: 99, height: 6, marginBottom: 20 }}>
          <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: tasks.length ? `${(done / tasks.length) * 100}%` : '0%', transition: 'width .3s' }} />
        </div>

        {/* Add task */}
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
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid #f0f0f0' }}>
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
            <span onClick={() => handleDelete(t.id)} style={{ color: '#ddd', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</span>
          </div>
        ))}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
            今天还没有任务，在上方输入框添加，或使用 AI 生成
          </div>
        )}

        {done === tasks.length && tasks.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 14, color: '#6c4fa3', fontWeight: 600 }}>
            🎉 今日任务全部完成！
          </div>
        )}
      </Card>
    </div>
  )
}
