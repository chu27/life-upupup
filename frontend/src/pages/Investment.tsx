import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, LabelList } from 'recharts'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getInvestmentItems, createInvestmentItem, updateInvestmentItem, deleteInvestmentItem, upsertInvestmentLog, getInvestmentSummary, getInvestmentLogs, getCategoryPnl } from '../api'

const CCY_SYMBOL: Record<string, string> = { JPY: '¥', USD: '$', CNY: '¥' }
const CCY_LABEL: Record<string, string> = { JPY: '日元', USD: '美元', CNY: '人民币' }
const CAT_ICON: Record<string, string> = { '美股': '🇺🇸', '日股': '🇯🇵', 'A股': '🇨🇳', '基金': '📈' }
const CAT_CCY: Record<string, string> = { '美股': 'USD', '日股': 'JPY', 'A股': 'CNY', '基金': 'JPY' }

const CATEGORIES = ['美股', '日股', 'A股', '基金']

function InvestmentOverview() {
  const today = dayjs().format('YYYY-MM-DD')
  const [summaries, setSummaries] = useState<Record<string, any[]>>({})
  const [pnlHistory, setPnlHistory] = useState<Record<string, any[]>>({})

  useEffect(() => {
    Promise.all(CATEGORIES.map(cat => getInvestmentSummary(today, cat))).then(results => {
      const s: Record<string, any[]> = {}
      CATEGORIES.forEach((cat, i) => { s[cat] = results[i] })
      setSummaries(s)
    })
    Promise.all(CATEGORIES.map(cat => getCategoryPnl(cat))).then(results => {
      const h: Record<string, any[]> = {}
      CATEGORIES.forEach((cat, i) => { h[cat] = results[i] })
      setPnlHistory(h)
    })
  }, [])

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>📊 投资记录</div>

      {/* 各分类当日盈亏 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {CATEGORIES.map(cat => {
          const rows = summaries[cat] || []
          const pnl = rows.reduce((s: number, r: any) => s + (r.pnl || 0), 0)
          const hasData = rows.some((r: any) => r.pnl != null)
          return (
            <div key={cat} style={{
              padding: '16px 18px', borderRadius: 12, background: '#fff',
              boxShadow: '0 2px 12px rgba(108,79,163,.08)',
              borderLeft: `4px solid ${pnl >= 0 ? '#e63946' : '#22c55e'}`
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{CAT_ICON[cat]} {cat} · 当日盈亏</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: pnl >= 0 ? '#e63946' : '#22c55e' }}>
                {hasData ? `${pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{CCY_LABEL[CAT_CCY[cat]]} · {rows.length} 项</div>
            </div>
          )
        })}
      </div>

      {/* 各分类折线图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {CATEGORIES.map(cat => {
          const history = (pnlHistory[cat] || []).filter((d: any) => d.pnl != null)
          return (
            <Card key={cat}>
              <CardTitle>{CAT_ICON[cat]} {cat} · 每日盈亏</CardTitle>
              {history.length < 2
                ? <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>数据不足（至少需要2天记录）</div>
                : <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={history} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#999' }} width={60} tickFormatter={v => v.toLocaleString()} />
                      <ReferenceLine y={0} stroke="#bbb" />
                      <Tooltip formatter={(v: any) => [(v >= 0 ? '+' : '') + Number(v).toLocaleString(), '盈亏']} />
                      <Line type="monotone" dataKey="pnl" stroke="#6c4fa3" strokeWidth={2} dot={{ r: 3, fill: '#6c4fa3' }}>
                        <LabelList dataKey="pnl" position="top" fontSize={10} fill="#555"
                          formatter={(v: any) => (v >= 0 ? '+' : '') + Number(v).toLocaleString()} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
              }
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function Investment({ category }: { category?: string }) {
  if (!category) return <InvestmentOverview />

  const today = dayjs().format('YYYY-MM-DD')
  const [summary, setSummary] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [viewDate, setViewDate] = useState(today)

  // 输入今日金额的临时状态
  const [inputAmounts, setInputAmounts] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})

  // 管理条目弹窗
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [itemForm, setItemForm] = useState({ name: '', currency: CAT_CCY[category || ''] || 'JPY', notes: '' })

  // 历史折线图
  const [chartItemId, setChartItemId] = useState<number | null>(null)
  const [chartLogs, setChartLogs] = useState<any[]>([])

  const load = async () => {
    const [s, its] = await Promise.all([
      getInvestmentSummary(viewDate, category),
      getInvestmentItems(category),
    ])
    setSummary(s)
    setItems(its)
    // 预填今日已有的金额
    const pre: Record<number, string> = {}
    s.forEach((row: any) => { if (row.today != null) pre[row.id] = String(row.today) })
    setInputAmounts(pre)
  }

  useEffect(() => { load() }, [viewDate, category])

  useEffect(() => {
    if (chartItemId == null) return
    getInvestmentLogs(chartItemId).then(data => {
      const sorted = [...data].sort((a: any, b: any) => a.date.localeCompare(b.date))
      // 计算每日盈亏（当日 - 前一日）
      const result = sorted.map((log: any, i: number) => ({
        date: log.date.slice(5), // MM-DD
        amount: log.amount,
        pnl: i > 0 ? log.amount - sorted[i - 1].amount : 0,
      }))
      setChartLogs(result)
    })
  }, [chartItemId])

  const handleSaveAmount = async (itemId: number) => {
    const val = inputAmounts[itemId]
    if (val === '' || val == null) return
    setSaving(s => ({ ...s, [itemId]: true }))
    await upsertInvestmentLog({ item_id: itemId, date: viewDate, amount: Number(val) })
    setSaving(s => ({ ...s, [itemId]: false }))
    load()
  }

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return
    editingItem
      ? await updateInvestmentItem(editingItem.id, { ...itemForm, category })
      : await createInvestmentItem({ ...itemForm, category })
    setShowItemModal(false)
    load()
  }

  const openEditItem = (item: any) => {
    setEditingItem(item)
    setItemForm({ name: item.name, currency: item.currency, notes: item.notes || '' })
    setShowItemModal(true)
  }

  const hasToday = summary.some(r => r.today != null)
  const isToday = viewDate === today

  // 按货币分组显示
  const byCcy: Record<string, any[]> = {}
  summary.forEach(r => {
    if (!byCcy[r.currency]) byCcy[r.currency] = []
    byCcy[r.currency].push(r)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          {category ? `${CAT_ICON[category]} ${category}` : '📊 投资记录'}
        </div>
        <Button onClick={() => { setEditingItem(null); setItemForm({ name: '', currency: CAT_CCY[category || ''] || 'JPY', notes: '' }); setShowItemModal(true) }}>+ 添加投资项</Button>
      </div>

      {/* 日期切换 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setViewDate(dayjs(viewDate).subtract(1, 'day').format('YYYY-MM-DD'))}
          style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{dayjs(viewDate).format('YYYY年M月D日')}</span>
        <button onClick={() => setViewDate(dayjs(viewDate).add(1, 'day').format('YYYY-MM-DD'))}
          style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
        {!isToday && <span onClick={() => setViewDate(today)} style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer' }}>回到今天</span>}
      </div>

      {/* 总盈亏（按币种分别显示） */}
      {hasToday && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(byCcy).length}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {Object.entries(byCcy).map(([ccy, rows]) => {
            const ccyPnl = rows.reduce((s, r) => s + (r.pnl || 0), 0)
            const hasPnl = rows.some(r => r.pnl != null)
            return (
              <div key={ccy} style={{
                padding: '16px 20px', borderRadius: 12,
                background: ccyPnl >= 0 ? '#fff9f0' : '#fff5f5',
                border: `1px solid ${ccyPnl >= 0 ? '#fed7aa' : '#fecaca'}`,
              }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{CCY_LABEL[ccy] || ccy} 当日盈亏</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: ccyPnl >= 0 ? '#e65100' : '#dc2626' }}>
                  {hasPnl ? `${ccyPnl >= 0 ? '+' : ''}${ccyPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ccy}` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 按货币分组的记录表 */}
      {Object.entries(byCcy).map(([ccy, rows]) => (
        <Card key={ccy} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <CardTitle>{CCY_LABEL[ccy] || ccy}（{ccy}）</CardTitle>
            <span style={{ fontSize: 12, color: '#aaa' }}>
              小计盈亏：
              <span style={{ fontWeight: 700, color: rows.reduce((s, r) => s + (r.pnl || 0), 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                {rows.reduce((s, r) => s + (r.pnl || 0), 0) >= 0 ? '+' : ''}
                {rows.reduce((s, r) => s + (r.pnl || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} {ccy}
              </span>
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['投资项', '昨日金额', isToday ? '今日金额（填入）' : '当日金额', '盈亏', '历史走势', '操作'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const sym = CCY_SYMBOL[ccy] || ''
                return (
                  <tr key={row.id}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                      {row.name}
                      {row.notes && <div style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>{row.notes}</div>}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>
                      {row.yesterday != null ? `${sym}${row.yesterday.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          value={inputAmounts[row.id] ?? ''}
                          onChange={e => setInputAmounts(a => ({ ...a, [row.id]: e.target.value }))}
                          placeholder="输入金额"
                          style={{ width: 110, padding: '5px 8px', fontSize: 13, border: '1px solid #e4dff0', borderRadius: 6, outline: 'none' }}
                        />
                        <button onClick={() => handleSaveAmount(row.id)} disabled={saving[row.id]}
                          style={{ padding: '5px 10px', background: '#6c4fa3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', opacity: saving[row.id] ? 0.6 : 1 }}>
                          {saving[row.id] ? '…' : '保存'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 700,
                      color: row.pnl == null ? '#aaa' : row.pnl >= 0 ? '#16a34a' : '#dc2626' }}>
                      {row.pnl == null ? '—' : `${row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ccy}`}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={() => setChartItemId(chartItemId === row.id ? null : row.id)}
                        style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer' }}>
                        {chartItemId === row.id ? '收起' : '查看'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={() => openEditItem(row)} style={{ fontSize: 12, color: '#888', cursor: 'pointer', marginRight: 8 }}>编辑</span>
                      <span onClick={async () => { if (confirm(`删除「${row.name}」及其所有记录？`)) { await deleteInvestmentItem(row.id); load() } }}
                        style={{ fontSize: 12, color: '#e63946', cursor: 'pointer' }}>删除</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* 每日盈亏折线图 */}
          {chartItemId != null && rows.find(r => r.id === chartItemId) && chartLogs.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>
                {rows.find(r => r.id === chartItemId)?.name} · 每日盈亏
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartLogs.slice(1)} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#999' }} width={70} tickFormatter={v => v.toLocaleString()} />
                  <ReferenceLine y={0} stroke="#bbb" />
                  <Tooltip formatter={(v: any) => [(v >= 0 ? '+' : '') + Number(v).toLocaleString(), '盈亏']} />
                  <Line type="monotone" dataKey="pnl" stroke="#6c4fa3" strokeWidth={2} dot={{ r: 4, fill: '#6c4fa3' }} name="当日盈亏">
                    <LabelList dataKey="pnl" position="top" fontSize={11} fill="#555"
                      formatter={(v: any) => (v >= 0 ? '+' : '') + Number(v).toLocaleString()} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>
          还没有投资项，点击右上角「+ 添加投资项」开始记录
        </div>
      )}

      {/* 添加/编辑投资项弹窗 */}
      {showItemModal && (
        <Modal title={editingItem ? '编辑投资项' : '添加投资项'} onClose={() => setShowItemModal(false)}>
          <FormRow label="名称 *"><Input value={itemForm.name} onChange={v => setItemForm(f => ({ ...f, name: v }))} placeholder="如：沪深300基金、苹果股票" /></FormRow>
          <FormRow label="货币"><Select value={itemForm.currency} onChange={v => setItemForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
          <FormRow label="备注"><Input value={itemForm.notes} onChange={v => setItemForm(f => ({ ...f, notes: v }))} placeholder="可选，如：招商银行App" /></FormRow>
          <ModalFooter onClose={() => setShowItemModal(false)} onSubmit={handleSaveItem} />
        </Modal>
      )}
    </div>
  )
}
