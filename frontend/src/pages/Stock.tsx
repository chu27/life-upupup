import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getHoldings, createHolding, updateHolding, deleteHolding, getStockQuote, getHiLowDistribution } from '../api'

const today = dayjs().format('YYYY-MM-DD')

type Market = '全部' | '美股' | '日股' | 'A股'

function detectMarket(symbol: string): '美股' | '日股' | 'A股' {
  const s = symbol.replace(/\.(SS|SZ|T)$/i, '')
  if (/^\d{4}$/.test(s)) return '日股'
  if (/^\d{6}$/.test(s)) return 'A股'
  return '美股'
}

const MARKET_COLOR: Record<string, string> = { '美股': '#2e7d32', '日股': '#e65100', 'A股': '#c62828' }
const MARKET_BG: Record<string, string>    = { '美股': '#f0fdf4', '日股': '#fff7ed', 'A股': '#fff1f1' }

function buildDistribution(data: any[]) {
  const highCount: Record<string, number> = {}
  const lowCount: Record<string, number> = {}
  data.forEach(row => {
    if (row.high_time) { const k = row.high_time.slice(0,2)+':'+( row.high_time[3]==='0'?'00':'30'); highCount[k]=(highCount[k]||0)+1 }
    if (row.low_time)  { const k = row.low_time.slice(0,2) +':'+(  row.low_time[3]==='0'?'00':'30');  lowCount[k]=(lowCount[k]||0)+1  }
  })
  const buckets = new Set([...Object.keys(highCount), ...Object.keys(lowCount)])
  return Array.from(buckets).sort().map(t => ({
    time: t, 高点次数: highCount[t]||0, 低点次数: lowCount[t]||0,
  }))
}

const PERIOD_OPTIONS = [
  { label: '30天', days: 30 }, { label: '3个月', days: 90 },
  { label: '半年', days: 180 }, { label: '1年', days: 365 },
]

export default function Stock() {
  const [market, setMarket] = useState<Market>('全部')
  const [selectedDate, setSelectedDate] = useState(today)
  const [holdings, setHoldings] = useState<any[]>([])
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [loadingQuotes, setLoadingQuotes] = useState(false)

  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [distDays, setDistDays] = useState<Record<string, number>>({})
  const [distribution, setDistribution] = useState<Record<string, any[]>>({})
  const [loadingDist, setLoadingDist] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingHolding, setEditingHolding] = useState<any>(null)
  const [hForm, setHForm] = useState({ symbol: '', name: '', status: '已买', notes: '' })

  const load = () => getHoldings().then(setHoldings)
  useEffect(() => { load() }, [])

  const fetchQuotes = async (symbols: string[], d: string) => {
    setLoadingQuotes(true)
    setQuotes({})
    const results: Record<string, any> = {}
    const isToday = d === today
    await Promise.allSettled(symbols.map(async s => {
      try { results[s] = await getStockQuote(s, isToday ? undefined : d) } catch {}
    }))
    setQuotes(results)
    setLoadingQuotes(false)
  }

  useEffect(() => {
    if (holdings.length) fetchQuotes(holdings.map(h => h.symbol), selectedDate)
  }, [holdings.length])

  const handleDateChange = (d: string) => {
    setSelectedDate(d)
    if (holdings.length) fetchQuotes(holdings.map(h => h.symbol), d)
  }

  const loadDistribution = async (symbol: string, days: number) => {
    setLoadingDist(symbol)
    setDistDays(d => ({ ...d, [symbol]: days }))
    try {
      const data = await getHiLowDistribution(symbol, days)
      setDistribution(d => ({ ...d, [symbol]: data }))
    } catch {}
    setLoadingDist(null)
  }

  const toggleDistribution = async (symbol: string) => {
    if (expandedSymbol === symbol) { setExpandedSymbol(null); return }
    setExpandedSymbol(symbol)
    if (!distribution[symbol]) await loadDistribution(symbol, distDays[symbol] || 30)
  }

  const openAdd = () => {
    setEditingHolding(null)
    setHForm({ symbol: '', name: '', status: '已买', notes: '' })
    setShowModal(true)
  }
  const openEdit = (h: any) => {
    setEditingHolding(h)
    setHForm({ symbol: h.symbol, name: h.name, status: h.status || '已买', notes: h.notes || '' })
    setShowModal(true)
  }
  const handleSave = async () => {
    const payload = { ...hForm, buy_price: 0, quantity: 0, buy_date: today, notes: hForm.notes || null }
    editingHolding ? await updateHolding(editingHolding.id, payload) : await createHolding(payload)
    setShowModal(false); load()
  }

  const isToday = selectedDate === today
  const MARKETS: Market[] = ['全部', '美股', '日股', 'A股']

  const filtered = (market === '全部' ? holdings : holdings.filter(h => detectMarket(h.symbol) === market))

  const bought  = filtered.filter(h => (h.status || '已买') === '已买')
  const watched = filtered.filter(h => h.status === '观察')

  const renderTable = (list: any[]) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>{['股票', isToday ? '实时价' : '收盘价', '今日高点', '高点时间(JST)', '今日低点', '低点时间(JST)', '收盘价', '分布图', '操作'].map(h =>
          <th key={h} style={{ textAlign: 'left', padding: '10px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
        )}</tr>
      </thead>
      <tbody>
        {list.map(h => {
          const q = quotes[h.symbol]
          const mkt = detectMarket(h.symbol)
          const isExpanded = expandedSymbol === h.symbol
          return <>
            <tr key={h.id}>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10,
                    background: MARKET_BG[mkt], color: MARKET_COLOR[mkt], fontWeight: 600, whiteSpace: 'nowrap' }}>{mkt}</span>
                  <span style={{ fontWeight: 600 }}>{h.name}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>({h.symbol})</span>
                </div>
                {h.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 3, paddingLeft: 2 }}>{h.notes}</div>}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0' }}>
                {q ? <span>{q.current_price?.toFixed(2)}{q.is_delayed && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>收</span>}</span>
                   : <span style={{ color: '#ccc' }}>—</span>}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', color: '#e63946', fontWeight: 600 }}>
                {q?.high_price ? Number(q.high_price).toFixed(1) : '—'}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', fontSize: 12, color: '#888' }}>
                {q?.high_time || '—'}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', color: '#22c55e', fontWeight: 600 }}>
                {q?.low_price ? Number(q.low_price).toFixed(1) : '—'}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', fontSize: 12, color: '#888' }}>
                {q?.low_time || '—'}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', fontSize: 12 }}>
                {q?.close_price?.toFixed(2) || '—'}
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0' }}>
                <span onClick={() => toggleDistribution(h.symbol)}
                  style={{ fontSize: 12, color: isExpanded ? '#e63946' : '#6c4fa3', cursor: 'pointer', userSelect: 'none' }}>
                  {isExpanded ? '收起 ▲' : '分布图 ▼'}
                </span>
              </td>
              <td style={{ padding: '12px 10px', borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0' }}>
                <span onClick={() => openEdit(h)} style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer', marginRight: 8 }}>编辑</span>
                <span onClick={async () => { if (confirm(`删除「${h.name}」？`)) { await deleteHolding(h.id); load() } }}
                  style={{ fontSize: 12, color: '#e63946', cursor: 'pointer' }}>删除</span>
              </td>
            </tr>

            {isExpanded && (
              <tr key={h.id + '-dist'}>
                <td colSpan={9} style={{ padding: '0 10px 16px', borderBottom: '1px solid #f0f0f0', background: '#faf9fe' }}>
                  <div style={{ paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6c4fa3' }}>📊 {h.name} — 高低点出现时段分布（JST）</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {PERIOD_OPTIONS.map(opt => {
                          const cur = distDays[h.symbol] || 30
                          const active = cur === opt.days
                          return (
                            <button key={opt.days} onClick={() => loadDistribution(h.symbol, opt.days)}
                              style={{ padding: '3px 10px', fontSize: 11, borderRadius: 20, border: 'none', cursor: 'pointer',
                                background: active ? '#6c4fa3' : '#ede8f7', color: active ? '#fff' : '#6c4fa3', fontWeight: active ? 600 : 400 }}>
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {loadingDist === h.symbol ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 12 }}>加载中，请稍候…</div>
                    ) : (() => {
                      const raw = distribution[h.symbol] || []
                      if (raw.length === 0) return <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 12 }}>暂无历史数据</div>
                      return (
                        <div>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={buildDistribution(raw)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#999' }} interval={0} angle={-45} textAnchor="end" height={40} />
                              <YAxis tick={{ fontSize: 10, fill: '#999' }} allowDecimals={false} />
                              <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
                              <Bar dataKey="高点次数" fill="#e63946" radius={[3,3,0,0]} />
                              <Bar dataKey="低点次数" fill="#22c55e" radius={[3,3,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                          <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 }}>共 {raw.length} 个交易日数据</div>
                        </div>
                      )
                    })()}
                  </div>
                </td>
              </tr>
            )}
          </>
        })}
        {list.length === 0 && (
          <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#ccc', fontSize: 12 }}>暂无</td></tr>
        )}
      </tbody>
    </table>
  )

  return (
    <div>
      {/* 顶部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>📈 股票池</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => handleDateChange(dayjs(selectedDate).subtract(1,'day').format('YYYY-MM-DD'))}
            style={{ padding: '5px 10px', border: '1px solid #e4dff0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#555' }}>‹</button>
          <input type="date" value={selectedDate} max={today} onChange={e => handleDateChange(e.target.value)}
            style={{ fontSize: 13, border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 10px', color: '#444', outline: 'none', cursor: 'pointer' }} />
          <button onClick={() => handleDateChange(dayjs(selectedDate).add(1,'day').format('YYYY-MM-DD'))}
            disabled={selectedDate >= today}
            style={{ padding: '5px 10px', border: '1px solid #e4dff0', borderRadius: 8, background: '#fff', cursor: selectedDate >= today ? 'not-allowed' : 'pointer', fontSize: 14, color: selectedDate >= today ? '#ccc' : '#555' }}>›</button>
          {!isToday && <button onClick={() => handleDateChange(today)}
            style={{ fontSize: 12, padding: '5px 12px', background: '#ede8f7', color: '#6c4fa3', border: 'none', borderRadius: 8, cursor: 'pointer' }}>回到今天</button>}
          {loadingQuotes && <span style={{ fontSize: 12, color: '#aaa' }}>加载中…</span>}
          <Button onClick={openAdd}>+ 添加</Button>
        </div>
      </div>

      {/* 市场 Tab */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e4dff0', marginBottom: 18 }}>
        {MARKETS.map(m => (
          <div key={m} onClick={() => setMarket(m)}
            style={{ padding: '8px 20px', fontSize: 13, cursor: 'pointer',
              color: market === m ? '#6c4fa3' : '#999',
              borderBottom: `2px solid ${market === m ? '#6c4fa3' : 'transparent'}`,
              marginBottom: -2, fontWeight: market === m ? 600 : 400 }}>{m}</div>
        ))}
      </div>

      {/* 已买 */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c4fa3', display: 'inline-block' }} />
        已买 <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>({bought.length})</span>
      </div>
      <Card style={{ marginBottom: 20 }}>{renderTable(bought)}</Card>

      {/* 观察 */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
        观察 <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>({watched.length})</span>
      </div>
      <Card>{renderTable(watched)}</Card>

      {/* 弹窗 */}
      {showModal && (
        <Modal title={editingHolding ? '编辑' : '添加股票'} onClose={() => setShowModal(false)}>
          <FormRow label="股票代码">
            <Input value={hForm.symbol} onChange={v => setHForm(f => ({ ...f, symbol: v }))}
              placeholder="美股: AAPL  日股: 7203  A股: 600028" />
          </FormRow>
          <FormRow label="股票名称">
            <Input value={hForm.name} onChange={v => setHForm(f => ({ ...f, name: v }))}
              placeholder="如：苹果、トヨタ、中石化" />
          </FormRow>
          <FormRow label="状态">
            <Select value={hForm.status} onChange={v => setHForm(f => ({ ...f, status: v }))}
              options={[{ label: '✅ 已买', value: '已买' }, { label: '👀 观察', value: '观察' }]} />
          </FormRow>
          <FormRow label="备注">
            <Input value={hForm.notes} onChange={v => setHForm(f => ({ ...f, notes: v }))}
              placeholder="可选，显示在股票名下方" />
          </FormRow>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
