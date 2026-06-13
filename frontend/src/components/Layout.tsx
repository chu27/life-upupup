import { NavLink } from 'react-router-dom'

const nav = [
  { group: '总览', items: [
    { to: '/', icon: '🏠', label: '首页仪表盘' },
    { to: '/tasks', icon: '✅', label: '今日任务' },
  ]},
  { group: '阅读 & 观影', items: [
    { to: '/books', icon: '📚', label: '读书' },
    { to: '/documentaries', icon: '🎬', label: '纪录片' },
  ]},
  { group: '身体 & 饮食', items: [
    { to: '/body', icon: '⚖️', label: '身材管理' },
    { to: '/diet', icon: '🥗', label: '饮食管理' },
  ]},
  { group: '财务', items: [
    { to: '/finance', icon: '💰', label: '理财管理' },
    { to: '/stock', icon: '📈', label: '股票学习' },
  ]},
  { group: '语言学习', items: [
    { to: '/japanese', icon: '🇯🇵', label: '日语学习' },
    { to: '/english', icon: '🇬🇧', label: '英语学习' },
  ]},
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #e4dff0',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e4dff0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6c4fa3' }}>🌿 我的生活</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Personal Life Manager</div>
        </div>
        <nav style={{ flex: 1 }}>
          {nav.map(group => (
            <div key={group.group} style={{ padding: '12px 0 4px' }}>
              <div style={{ fontSize: 10, color: '#999', padding: '0 16px 4px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                {group.group}
              </div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 16px', fontSize: 13.5, textDecoration: 'none',
                    color: isActive ? '#6c4fa3' : '#555',
                    background: isActive ? '#ede8f7' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background .15s',
                  })}
                >
                  <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {children}
      </main>
    </div>
  )
}
