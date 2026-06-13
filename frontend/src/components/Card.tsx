export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      boxShadow: '0 2px 12px rgba(108,79,163,0.08)',
      padding: 20, marginBottom: 16,
    }} className={className}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 14 }}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(108,79,163,0.08)', padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#6c4fa3' }}>
        {value}{unit && <span style={{ fontSize: 13, color: '#999', marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
