import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import Card, { StatCard } from '../components/Card'
import { getDashboard, getTasks, toggleTask } from '../api'

const ALL_SHORTCUTS = [
  { icon: '📚', label: '读书', to: '/books' },
  { icon: '🎬', label: '纪录片', to: '/documentaries' },
  { icon: '⚖️', label: '身材管理', to: '/body' },
  { icon: '🥗', label: '饮食管理', to: '/diet' },
  { icon: '🛒', label: '价格管理', to: '/grocery' },
  { icon: '💰', label: '收入&支出', to: '/finance' },
  { icon: '🏦', label: '资产总览', to: '/finance/assets' },
  { icon: '📊', label: '投资记录', to: '/finance/investment' },
  { icon: '📈', label: '股票池', to: '/stock' },
  { icon: '🇯🇵', label: '日语', to: '/language/japanese' },
  { icon: '🇰🇷', label: '韩语', to: '/language/korean' },
  { icon: '🇬🇧', label: '英语', to: '/language/english' },
  { icon: '✅', label: '今日任务', to: '/tasks/today' },
  { icon: '📅', label: '本周任务', to: '/tasks/week' },
  { icon: '🗓️', label: '本月任务', to: '/tasks/month' },
  { icon: '📆', label: '本年任务', to: '/tasks/year' },
]

const LS_KEY = 'quick_shortcuts'
const DEFAULT_SHORTCUTS = [
  { icon: '📚', label: '读书', to: '/books' },
  { icon: '⚖️', label: '身材管理', to: '/body' },
  { icon: '🥗', label: '饮食管理', to: '/diet' },
  { icon: '💰', label: '收入&支出', to: '/finance' },
  { icon: '📈', label: '股票池', to: '/stock' },
  { icon: '🇯🇵', label: '日语', to: '/language/japanese' },
]

function loadShortcuts() {
  try {
    const s = localStorage.getItem(LS_KEY)
    return s ? JSON.parse(s) : DEFAULT_SHORTCUTS
  } catch { return DEFAULT_SHORTCUTS }
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [shortcuts, setShortcuts] = useState<any[]>(loadShortcuts)
  const [editing, setEditing] = useState(false)
  const today = dayjs().format('YYYY-MM-DD')
  const nav = useNavigate()

  const saveShortcuts = (list: any[]) => {
    setShortcuts(list)
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  }
  const toggleShortcut = (item: any) => {
    const exists = shortcuts.some(s => s.to === item.to)
    if (exists) {
      saveShortcuts(shortcuts.filter(s => s.to !== item.to))
    } else if (shortcuts.length < 6) {
      saveShortcuts([...shortcuts, item])
    }
  }

  useEffect(() => {
    getDashboard().then(setData)
    getTasks('today', today).then(setTasks)
  }, [today])

  const handleToggle = async (id: number) => {
    const updated = await toggleTask(id)
    setTasks(ts => ts.map(t => t.id === id ? updated : t))
  }

  const done = tasks.filter(t => t.is_done).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6 }}>只要你这样认真的做下去，早晚有一天，你想要的东西都会属于你 👸</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
            {dayjs().format('YYYY年M月D日 · dddd')}
          </div>
        </div>
      </div>

      {/* Today stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="今日体重" value={data?.today.weight ?? '—'} unit="kg" sub="最新记录" />
        <StatCard label="今日热量摄入" value={data?.today.calories ?? 0} unit="kcal" sub="目标 1,600 kcal" />
        <StatCard label="今日饮水" value={data?.today.water_cups ?? 0} unit="杯" sub="目标 8 杯" />
        <StatCard label="今日学习" value={data?.today.study_minutes ?? 0} unit="min" sub="日语 + 英语" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tasks */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>今日任务</span>
            <span style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer', fontWeight: 600 }} onClick={() => nav('/tasks/today')}>
              查看全部 →
            </span>
          </div>
          {tasks.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div onClick={() => handleToggle(t.id)} style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: t.is_done ? '#6c4fa3' : 'transparent',
                border: `2px solid ${t.is_done ? '#6c4fa3' : '#ddd'}`,
                color: '#fff', fontSize: 11,
              }}>{t.is_done ? '✓' : ''}</div>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: t.is_done ? 'line-through' : 'none', color: t.is_done ? '#aaa' : '#1b1b1b' }}>
                {t.title}
              </span>
              {t.module_tag && <span style={{ fontSize: 11, color: '#999' }}>{t.module_tag}</span>}
            </div>
          ))}
          {tasks.length === 0 && <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>暂无任务，前往任务页添加</div>}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 5 }}>
              <span>今日进度</span><span>{done} / {tasks.length}</span>
            </div>
            <div style={{ background: '#eee', borderRadius: 99, height: 6 }}>
              <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: tasks.length ? `${(done / tasks.length) * 100}%` : '0%', transition: 'width .3s' }} />
            </div>
          </div>
        </Card>

        {/* This month */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 14 }}>本月概览</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '读书（本）', value: data?.this_month.books_finished ?? 0 },
              { label: '本月支出', value: data?.this_month.expense_jpy ? `¥${data.this_month.expense_jpy.toLocaleString()}` : '¥0' },
              { label: '学习时长', value: `${data?.this_month.study_hours ?? 0}h` },
              { label: '纪录片（部）', value: data?.this_month.docs_watched ?? 0 },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: 12, background: '#f5f3fa', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#6c4fa3' }}>{item.value}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Latest activity */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 14 }}>各模块最新动态</div>
          {data?.latest.book ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
              <span>📚 <b>{data.latest.book.title}</b> · {data.latest.book.status}</span>
            </div>
          ) : null}
          {data?.latest.documentary ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
              <span>🎬 <b>{data.latest.documentary.title}</b> · 已看</span>
            </div>
          ) : null}
          {!data?.latest.book && !data?.latest.documentary && (
            <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>暂无数据，开始记录吧</div>
          )}
        </Card>

        {/* Quick links */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>快速入口</div>
            <span onClick={() => setEditing(e => !e)}
              style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer', fontWeight: 600 }}>
              {editing ? '完成' : '编辑'}
            </span>
          </div>

          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {shortcuts.map(item => (
                <div key={item.to} onClick={() => nav(item.to)} style={{
                  padding: '12px 8px', background: '#f5f3fa', borderRadius: 8,
                  textAlign: 'center', cursor: 'pointer', fontSize: 12, color: '#555',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                  {item.label}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>最多选 6 个，已选 {shortcuts.length}/6</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {ALL_SHORTCUTS.map(item => {
                  const selected = shortcuts.some(s => s.to === item.to)
                  return (
                    <div key={item.to} onClick={() => toggleShortcut(item)} style={{
                      padding: '10px 6px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                      fontSize: 12, color: selected ? '#6c4fa3' : '#888',
                      background: selected ? '#ede8f7' : '#f5f5f5',
                      border: `1.5px solid ${selected ? '#6c4fa3' : 'transparent'}`,
                      opacity: !selected && shortcuts.length >= 6 ? 0.4 : 1,
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{item.icon}</div>
                      {item.label}
                      {selected && <div style={{ fontSize: 10, color: '#6c4fa3', marginTop: 2 }}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
