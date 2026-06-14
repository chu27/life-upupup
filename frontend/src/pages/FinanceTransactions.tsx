import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getTransactions, createTransaction, deleteTransaction, getExchangeRates } from '../api'

const CCY_COLORS: Record<string, string> = { JPY: '#e65100', USD: '#2e7d32', CNY: '#c62828' }
const PIE_COLORS = ['#6c4fa3', '#a07fd4', '#d4c9f0', '#c084fc', '#9c27b0', '#7b1fa2']
const INCOME_CATS = ['工资', '奖金', '副业收入', '投资收益', '转账收入', '其他']
const EXPENSE_CATS = ['餐饮', '交通', '购物', '娱乐', '房租', '医疗', '其他']

export default function FinanceTransactions() {
  const now = dayjs()
  const [transactions, setTransactions] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: '支出', amount: '', currency: 'JPY', category: '餐饮', date: now.format('YYYY-MM-DD'), notes: '' })
  const [viewMonth, setViewMonth] = useState(now.format('YYYY-MM'))

  const load = () => {
    const [y, m] = viewMonth.split('-')
    getTransactions({ year: Number(y), month: Number(m) }).then(setTransactions)
    getExchangeRates().then(setRates).catch(() => {})
  }
  useEffect(() => { load() }, [viewMonth])

  const toJPY = (amount: number, ccy: string) => {
    if (ccy === 'JPY') return amount
    if (!rates?.rates) return amount
    if (ccy === 'USD') return amount / rates.rates.USD
    if (ccy === 'CNY') return amount / rates.rates.CNY
    return amount
  }

  const totalIncome = transactions.filter(t => t.type === '收入').reduce((s, t) => s + toJPY(t.amount, t.currency), 0)
  const totalExpense = transactions.filter(t => t.type === '支出').reduce((s, t) => s + toJPY(t.amount, t.currency), 0)

  const expByCat: Record<string, number> = {}
  transactions.filter(t => t.type === '支出').forEach(t => {
    expByCat[t.category] = (expByCat[t.category] || 0) + toJPY(t.amount, t.currency)
  })
  const pieData = Object.entries(expByCat).map(([name, value]) => ({ name, value: Math.round(value) }))

  const handleSave = async () => {
    await createTransaction({ ...form, amount: Number(form.amount) })
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>💰 收入 & 支出</div>
        <Button onClick={() => { setForm({ type: '支出', amount: '', currency: 'JPY', category: '餐饮', date: now.format('YYYY-MM-DD'), notes: '' }); setShowModal(true) }}>+ 记录收支</Button>
      </div>

      {/* 月份切换 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setViewMonth(dayjs(viewMonth).subtract(1, 'month').format('YYYY-MM'))}
          style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, minWidth: 80, textAlign: 'center' }}>{dayjs(viewMonth).format('YYYY年M月')}</span>
        <button onClick={() => setViewMonth(dayjs(viewMonth).add(1, 'month').format('YYYY-MM'))}
          style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
        {viewMonth !== now.format('YYYY-MM') && (
          <span onClick={() => setViewMonth(now.format('YYYY-MM'))} style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer' }}>回到本月</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="收入" value={`¥${Math.round(totalIncome).toLocaleString()}`} sub="折合日元" />
        <StatCard label="支出" value={`¥${Math.round(totalExpense).toLocaleString()}`} sub="折合日元" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 支出分类图 */}
        <Card>
          <CardTitle>支出分类</CardTitle>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `¥${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                    {d.name}
                  </span>
                  <span>¥{d.value.toLocaleString()}</span>
                </div>
              ))}
            </>
          ) : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>暂无支出数据</div>}
        </Card>

        {/* 收支流水 */}
        <Card>
          <CardTitle>收支明细</CardTitle>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['日期', '类型', '分类', '金额', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff' }}>{h}</th>)}</tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 12 }}>{t.date}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={t.type === '收入' ? 'green' : 'red'}>{t.type}</Badge></td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{t.category}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: t.type === '收入' ? '#6c4fa3' : '#e63946' }}>
                      {t.type === '收入' ? '+' : '-'}{t.amount.toLocaleString()}
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f0f0f0', color: CCY_COLORS[t.currency] || '#888', marginLeft: 4 }}>{t.currency}</span>
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={async () => { if (confirm('删除？')) { await deleteTransaction(t.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无记录</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {showModal && (
        <Modal title="记录收支" onClose={() => setShowModal(false)}>
          <FormRow label="类型"><Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v, category: v === '收入' ? '工资' : '餐饮' }))} options={['收入','支出'].map(s => ({ label: s, value: s }))} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="金额 *"><Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0" /></FormRow>
            <FormRow label="货币"><Select value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
          </div>
          <FormRow label="分类">
            <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={(form.type === '收入' ? INCOME_CATS : EXPENSE_CATS).map(s => ({ label: s, value: s }))} />
          </FormRow>
          <FormRow label="日期"><Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="备注"><Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="可选" /></FormRow>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
