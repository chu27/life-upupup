import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguages } from '../App'
import { addLanguage, deleteLanguage } from '../api'

const LANG_LOOKUP: Record<string, { code: string; emoji: string }> = {
  '日语': { code: 'japanese', emoji: '🇯🇵' },
  '英语': { code: 'english', emoji: '🇬🇧' },
  '中文': { code: 'chinese', emoji: '🇨🇳' },
  '普通话': { code: 'mandarin', emoji: '🇨🇳' },
  '粤语': { code: 'cantonese', emoji: '🇭🇰' },
  '韩语': { code: 'korean', emoji: '🇰🇷' },
  '法语': { code: 'french', emoji: '🇫🇷' },
  '德语': { code: 'german', emoji: '🇩🇪' },
  '西班牙语': { code: 'spanish', emoji: '🇪🇸' },
  '葡萄牙语': { code: 'portuguese', emoji: '🇵🇹' },
  '意大利语': { code: 'italian', emoji: '🇮🇹' },
  '俄语': { code: 'russian', emoji: '🇷🇺' },
  '阿拉伯语': { code: 'arabic', emoji: '🇸🇦' },
  '泰语': { code: 'thai', emoji: '🇹🇭' },
  '越南语': { code: 'vietnamese', emoji: '🇻🇳' },
  '印尼语': { code: 'indonesian', emoji: '🇮🇩' },
  '马来语': { code: 'malay', emoji: '🇲🇾' },
  '荷兰语': { code: 'dutch', emoji: '🇳🇱' },
  '瑞典语': { code: 'swedish', emoji: '🇸🇪' },
  '波兰语': { code: 'polish', emoji: '🇵🇱' },
  '土耳其语': { code: 'turkish', emoji: '🇹🇷' },
  '希腊语': { code: 'greek', emoji: '🇬🇷' },
  '希伯来语': { code: 'hebrew', emoji: '🇮🇱' },
  '印地语': { code: 'hindi', emoji: '🇮🇳' },
  '斯瓦希里语': { code: 'swahili', emoji: '🇰🇪' },
}

const staticNav = [
  { group: '', items: [
    { to: '/', icon: '🏠', label: '首页' },
  ]},
  { group: '任务', items: [
    { to: '/tasks/today', icon: '📅', label: '今日任务' },
    { to: '/tasks/week', icon: '🗓️', label: '本周任务' },
    { to: '/tasks/month', icon: '📆', label: '本月任务' },
    { to: '/tasks/year', icon: '🗃️', label: '本年任务' },
  ]},
  { group: '自我提升', items: [
    { to: '/books', icon: '📚', label: '读书' },
    { to: '/documentaries', icon: '🎬', label: '纪录片' },
    { to: '/stock', icon: '📈', label: '股票池' },
  ]},
  { group: '生活记录', items: [
    { to: '/body', icon: '⚖️', label: '身材管理' },
    { to: '/diet', icon: '🥗', label: '饮食管理' },
    { to: '/grocery', icon: '🛒', label: '价格管理' },
    { to: '/finance/transactions', icon: '💰', label: '收入 & 支出' },
  ]},
  { group: '财务', items: [
    { to: '/finance/assets', icon: '🏦', label: '资产总览' },
    { to: '/finance/investment', icon: '📊', label: '投资记录' },
    { to: '/finance/investment/us', icon: '🇺🇸', label: '美股', indent: true },
    { to: '/finance/investment/jp', icon: '🇯🇵', label: '日股', indent: true },
    { to: '/finance/investment/cn', icon: '🇨🇳', label: 'A股', indent: true },
    { to: '/finance/investment/fund', icon: '📈', label: '基金', indent: true },
  ]},
]

const navLinkStyle = (isActive: boolean) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '9px 16px', fontSize: 13.5, textDecoration: 'none',
  color: isActive ? '#6c4fa3' : '#555',
  background: isActive ? '#ede8f7' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  transition: 'background .15s',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  const { languages, reload } = useLanguages()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', emoji: '' })
  const [managing, setManaging] = useState(false)
  const [investCollapsed, setInvestCollapsed] = useState(false)

  const handleNameChange = (name: string) => {
    const hit = LANG_LOOKUP[name.trim()]
    setForm(f => ({
      ...f,
      name,
      code: hit ? hit.code : f.code,
      emoji: hit ? hit.emoji : f.emoji,
    }))
  }

  const handleAdd = async () => {
    if (!form.name.trim()) return
    const code = form.code.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '_')
    await addLanguage({ name: form.name.trim(), code, emoji: form.emoji.trim() || null })
    setForm({ name: '', code: '', emoji: '' })
    setShowAdd(false)
    reload()
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`删除「${name}」？该语言的打卡记录不会删除。`)) return
    await deleteLanguage(id)
    reload()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #e4dff0',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e4dff0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6c4fa3' }}>🌹 我的生活</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Personal Life Manager</div>
        </div>

        <nav style={{ flex: 1 }}>
          {/* 静态导航 */}
          {staticNav.map(group => (
            <div key={group.group || '_top'} style={{ padding: '12px 0 4px' }}>
              {group.group && (
                <div style={{ fontSize: 10, color: '#999', padding: '0 16px 4px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const isIndent = (item as any).indent
                // 投资记录的子条目：显示收缩按钮，且根据收缩状态隐藏
                if (item.to === '/finance/investment') {
                  return (
                    <div key={item.to} style={{ display: 'flex', alignItems: 'center' }}>
                      <NavLink to={item.to} end
                        style={({ isActive }) => ({ ...navLinkStyle(isActive), flex: 1 })}>
                        <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                      <span onClick={() => setInvestCollapsed(c => !c)}
                        style={{ fontSize: 11, color: '#bbb', cursor: 'pointer', paddingRight: 12, userSelect: 'none' }}>
                        {investCollapsed ? '▸' : '▾'}
                      </span>
                    </div>
                  )
                }
                if (isIndent && investCollapsed) return null
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'}
                    style={({ isActive }) => ({ ...navLinkStyle(isActive), paddingLeft: isIndent ? 32 : 16 })}>
                    <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ fontSize: isIndent ? 12.5 : 13.5 }}>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}

          {/* 语言学习（动态） */}
          <div style={{ padding: '12px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 4px' }}>
              <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.5px' }}>语言学习</span>
              <span
                onClick={() => setManaging(m => !m)}
                style={{ fontSize: 10, color: managing ? '#6c4fa3' : '#bbb', cursor: 'pointer', fontWeight: 600 }}
              >{managing ? '完成' : '管理'}</span>
            </div>

            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', alignItems: 'center' }}>
                <NavLink to={`/language/${lang.code}`}
                  style={({ isActive }) => ({ ...navLinkStyle(isActive), flex: 1 })}>
                  <span style={{ width: 18, textAlign: 'center' }}>{lang.emoji || '🌐'}</span>
                  {lang.name}
                </NavLink>
                {managing && (
                  <span onClick={() => handleDelete(lang.id, lang.name)}
                    style={{ color: '#e63946', cursor: 'pointer', fontSize: 14, paddingRight: 12 }}>×</span>
                )}
              </div>
            ))}

            {/* 添加语言 */}
            {managing && !showAdd && (
              <div onClick={() => setShowAdd(true)} style={{
                padding: '7px 16px', fontSize: 13, color: '#6c4fa3', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>＋ 添加语言</div>
            )}

            {showAdd && (
              <div style={{ padding: '8px 12px', background: '#f5f3fa', margin: '4px 8px', borderRadius: 8 }}>
                <input placeholder="语言名称（如：法语）" value={form.name} onChange={e => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e4dff0', borderRadius: 6, marginBottom: 4, boxSizing: 'border-box', outline: 'none' }} />
                {form.emoji && form.code && (
                  <div style={{ fontSize: 11, color: '#6c4fa3', background: '#ede8f7', borderRadius: 5, padding: '3px 8px', marginBottom: 4 }}>
                    自动识别：{form.emoji} {form.name}（{form.code}）
                  </div>
                )}
                <input placeholder="代码（如：french）" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e4dff0', borderRadius: 6, marginBottom: 4, boxSizing: 'border-box', outline: 'none' }} />
                <input placeholder="国旗 Emoji（如：🇫🇷）" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e4dff0', borderRadius: 6, marginBottom: 6, boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleAdd} style={{ flex: 1, padding: '5px', background: '#6c4fa3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>确认</button>
                  <button onClick={() => { setShowAdd(false); setForm({ name: '', code: '', emoji: '' }) }}
                    style={{ flex: 1, padding: '5px', background: '#eee', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>取消</button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {children}
      </main>
    </div>
  )
}
