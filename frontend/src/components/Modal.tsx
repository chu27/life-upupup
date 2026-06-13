import { useEffect } from 'react'
import Button from './Button'

export default function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(108,79,163,.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, type = 'text', placeholder }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', border: '1.5px solid #e4dff0',
        borderRadius: 8, fontSize: 13, background: '#f5f3fa', outline: 'none',
      }}
    />
  )
}

export function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', border: '1.5px solid #e4dff0',
        borderRadius: 8, fontSize: 13, background: '#f5f3fa', outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea value={value} rows={rows} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', border: '1.5px solid #e4dff0',
        borderRadius: 8, fontSize: 13, background: '#f5f3fa', outline: 'none',
        resize: 'vertical',
      }}
    />
  )
}

export function ModalFooter({ onClose, onSubmit, submitLabel = '保存' }: {
  onClose: () => void; onSubmit: () => void; submitLabel?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
      <Button variant="outline" onClick={onClose}>取消</Button>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </div>
  )
}
