type Variant = 'primary' | 'outline' | 'ghost'

export default function Button({
  children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: Variant
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8,
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .5 : 1, border: 'none', transition: 'opacity .15s',
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '5px 12px' : '8px 16px',
  }
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { background: '#6c4fa3', color: '#fff' },
    outline: { background: 'transparent', border: '1.5px solid #e4dff0', color: '#555' },
    ghost:   { background: 'transparent', color: '#6c4fa3' },
  }
  return (
    <button type={type} style={{ ...base, ...styles[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
