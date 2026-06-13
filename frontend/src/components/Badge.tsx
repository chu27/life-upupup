const colors: Record<string, { bg: string; color: string }> = {
  green:  { bg: '#ede8f7', color: '#6c4fa3' },
  orange: { bg: '#fff3e0', color: '#e65100' },
  blue:   { bg: '#e3f2fd', color: '#1565c0' },
  gray:   { bg: '#f0f0f0', color: '#888' },
  red:    { bg: '#fdecea', color: '#c62828' },
  purple: { bg: '#ede8f7', color: '#6c4fa3' },
}

export default function Badge({ children, variant = 'green' }: { children: React.ReactNode; variant?: string }) {
  const c = colors[variant] || colors.green
  return (
    <span style={{ ...c, display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {children}
    </span>
  )
}
