import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Textarea, ModalFooter } from '../components/Modal'
import { getHoldings, createHolding, getWatchlist, addWatchlist, removeWatchlist, getStockQuote, getStockNotes, createStockNote } from '../api'

export default function Stock() {
  const [tab, setTab] = useState<'holdings'|'watchlist'|'notes'>('holdings')
  const [holdings, setHoldings] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [showHoldingModal, setShowHoldingModal] = useState(false)
  const [showWatchModal, setShowWatchModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [hForm, setHForm] = useState({ symbol: '', name: '', buy_price: '', quantity: '', buy_date: dayjs().format('YYYY-MM-DD') })
  const [wForm, setWForm] = useState({ symbol: '', name: '', notes: '' })
  const [nForm, setNForm] = useState({ title: '', content: '', tags: '' })
  const [loadingQuotes, setLoadingQuotes] = useState(false)

  const load = () => {
    getHoldings().then(setHoldings)
    getWatchlist().then(setWatchlist)
    getStockNotes().then(setNotes)
  }
  useEffect(() => { load() }, [])

  const fetchQuotes = async (symbols: string[]) => {
    setLoadingQuotes(true)
    const results: Record<string, any> = {}
    await Promise.allSettled(symbols.map(async s => {
      try { results[s] = await getStockQuote(s) } catch {}
    }))
    setQuotes(q => ({ ...q, ...results }))
    setLoadingQuotes(false)
  }

  useEffect(() => {
    const symbols = [...holdings.map(h => h.symbol), ...watchlist.map(w => w.symbol)]
    if (symbols.length) fetchQuotes(symbols)
  }, [holdings.length, watchlist.length])

  const handleSaveHolding = async () => {
    await createHolding({ ...hForm, buy_price: Number(hForm.buy_price), quantity: Number(hForm.quantity) })
    setShowHoldingModal(false); load()
  }

  const handleSaveWatch = async () => {
    await addWatchlist(wForm)
    setShowWatchModal(false); load()
  }

  const handleSaveNote = async () => {
    await createStockNote(nForm)
    setShowNoteModal(false); load()
  }

  const pnl = (h: any) => {
    const q = quotes[h.symbol]
    if (!q) return null
    const diff = (q.current_price - h.buy_price) * h.quantity
    const pct = ((q.current_price - h.buy_price) / h.buy_price) * 100
    return { diff, pct }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>📈 股票学习</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'holdings' && <Button onClick={() => setShowHoldingModal(true)}>+ 添加持仓</Button>}
          {tab === 'watchlist' && <Button onClick={() => setShowWatchModal(true)}>+ 添加观察</Button>}
          {tab === 'notes' && <Button onClick={() => setShowNoteModal(true)}>+ 新建笔记</Button>}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e4dff0', marginBottom: 18 }}>
        {[['holdings','持仓'], ['watchlist','观察池'], ['notes','学习笔记']].map(([key, label]) => (
          <div key={key} onClick={() => setTab(key as any)} style={{ padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: tab === key ? '#6c4fa3' : '#999', borderBottom: `2px solid ${tab === key ? '#6c4fa3' : 'transparent'}`, marginBottom: -2, fontWeight: tab === key ? 600 : 400 }}>{label}</div>
        ))}
      </div>

      {tab === 'holdings' && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['股票', '买入价', '数量', '现价', '盈亏', '今日高点/时间', '今日低点/时间', '收盘价'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {holdings.map(h => {
                const q = quotes[h.symbol]
                const p = pnl(h)
                return (
                  <tr key={h.id}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{h.name} <span style={{ fontSize: 11, color: '#aaa' }}>({h.symbol})</span></td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>{h.buy_price}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>{h.quantity}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>{q ? q.current_price?.toFixed(2) : <span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: p ? (p.diff >= 0 ? '#2e7d32' : '#e63946') : '#aaa' }}>
                      {p ? `${p.diff >= 0 ? '+' : ''}${p.diff.toFixed(0)} (${p.pct.toFixed(1)}%)` : '—'}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555' }}>{q?.high_price ? `${q.high_price} @ ${q.high_time}` : '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555' }}>{q?.low_price ? `${q.low_price} @ ${q.low_time}` : '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{q?.close_price?.toFixed(2) || '—'}</td>
                  </tr>
                )
              })}
              {holdings.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无持仓</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'watchlist' && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['股票', '现价', '涨跌', '今日高点/时间', '今日低点/时间', '收盘价', '我的备注', 'AI分析', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {watchlist.map(w => {
                const q = quotes[w.symbol]
                const chg = q ? ((q.current_price - q.previous_close) / q.previous_close * 100) : null
                return (
                  <tr key={w.id}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{w.name} <span style={{ fontSize: 11, color: '#aaa' }}>({w.symbol})</span></td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>{q?.current_price?.toFixed(2) || '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: chg !== null ? (chg >= 0 ? '#2e7d32' : '#e63946') : '#aaa' }}>
                      {chg !== null ? `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{q?.high_price ? `${q.high_price} @ ${q.high_time}` : '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{q?.low_price ? `${q.low_price} @ ${q.low_time}` : '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>{q?.close_price?.toFixed(2) || '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 12, maxWidth: 120 }}>{w.notes || '—'}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <button style={{ fontSize: 11, padding: '3px 8px', background: '#ede8f7', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'not-allowed' }} title="Claude API 功能待实装">🤖 分析</button>
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={async () => { await removeWatchlist(w.id); load() }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>移除</span>
                    </td>
                  </tr>
                )
              })}
              {watchlist.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>观察池为空</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'notes' && (
        <div>
          {notes.map(n => (
            <Card key={n.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</div>
                <button style={{ fontSize: 11, padding: '3px 8px', background: '#ede8f7', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'not-allowed' }} title="Claude API 功能待实装">🤖 AI 整理</button>
              </div>
              {n.tags && <div style={{ marginBottom: 8 }}>{n.tags.split(',').map((t: string) => <span key={t} style={{ background: '#ede8f7', color: '#6c4fa3', borderRadius: 20, fontSize: 11, padding: '2px 8px', marginRight: 4 }}>{t.trim()}</span>)}</div>}
              <div style={{ fontSize: 13, color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{n.content}</div>
              <div style={{ fontSize: 11, color: '#ccc', marginTop: 10 }}>{dayjs(n.updated_at).format('YYYY-MM-DD HH:mm')}</div>
            </Card>
          ))}
          {notes.length === 0 && <Card><div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无学习笔记</div></Card>}
        </div>
      )}

      {showHoldingModal && (
        <Modal title="添加持仓" onClose={() => setShowHoldingModal(false)}>
          <FormRow label="股票代码"><Input value={hForm.symbol} onChange={v => setHForm(f => ({ ...f, symbol: v }))} placeholder="如：7203.T" /></FormRow>
          <FormRow label="股票名称"><Input value={hForm.name} onChange={v => setHForm(f => ({ ...f, name: v }))} placeholder="如：Toyota" /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="买入价"><Input type="number" value={hForm.buy_price} onChange={v => setHForm(f => ({ ...f, buy_price: v }))} /></FormRow>
            <FormRow label="数量"><Input type="number" value={hForm.quantity} onChange={v => setHForm(f => ({ ...f, quantity: v }))} /></FormRow>
          </div>
          <FormRow label="买入日期"><Input type="date" value={hForm.buy_date} onChange={v => setHForm(f => ({ ...f, buy_date: v }))} /></FormRow>
          <ModalFooter onClose={() => setShowHoldingModal(false)} onSubmit={handleSaveHolding} />
        </Modal>
      )}

      {showWatchModal && (
        <Modal title="添加观察池" onClose={() => setShowWatchModal(false)}>
          <FormRow label="股票代码"><Input value={wForm.symbol} onChange={v => setWForm(f => ({ ...f, symbol: v }))} placeholder="如：9983.T" /></FormRow>
          <FormRow label="股票名称"><Input value={wForm.name} onChange={v => setWForm(f => ({ ...f, name: v }))} placeholder="如：Fast Retailing" /></FormRow>
          <FormRow label="我的备注"><Textarea value={wForm.notes} onChange={v => setWForm(f => ({ ...f, notes: v }))} rows={3} /></FormRow>
          <ModalFooter onClose={() => setShowWatchModal(false)} onSubmit={handleSaveWatch} />
        </Modal>
      )}

      {showNoteModal && (
        <Modal title="新建学习笔记" onClose={() => setShowNoteModal(false)}>
          <FormRow label="标题"><Input value={nForm.title} onChange={v => setNForm(f => ({ ...f, title: v }))} /></FormRow>
          <FormRow label="标签（逗号分隔）"><Input value={nForm.tags} onChange={v => setNForm(f => ({ ...f, tags: v }))} placeholder="如：K线, 技术分析" /></FormRow>
          <FormRow label="内容"><Textarea value={nForm.content} onChange={v => setNForm(f => ({ ...f, content: v }))} rows={8} /></FormRow>
          <ModalFooter onClose={() => setShowNoteModal(false)} onSubmit={handleSaveNote} />
        </Modal>
      )}
    </div>
  )
}
