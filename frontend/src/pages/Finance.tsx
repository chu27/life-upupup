import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getTransactions, createTransaction, deleteTransaction, getAssets, createAsset, updateAsset, deleteAsset, getExchangeRates } from '../api'

const CCY_COLORS: Record<string, string> = { JPY: '#e65100', USD: '#2e7d32', CNY: '#c62828' }
const PIE_COLORS = ['#6c4fa3', '#a07fd4', '#d4c9f0', '#c084fc', '#9c27b0', '#7b1fa2']

const INCOME_CATS = ['工资', '奖金', '副业收入', '投资收益', '转账收入', '其他']
const EXPENSE_CATS = ['餐饮', '交通', '购物', '娱乐', '房租', '医疗', '其他']

export default function Finance() {
  const now = dayjs()
  const [transactions, setTransactions] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [showTxModal, setShowTxModal] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [txForm, setTxForm] = useState({ type: '支出', amount: '', currency: 'JPY', category: '餐饮', date: now.format('YYYY-MM-DD'), notes: '' })
  const [assetForm, setAssetForm] = useState({ name: '', asset_type: '存款', amount: '', currency: 'JPY' })

  const load = () => {
    getTransactions({ year: now.year(), month: now.month() + 1 }).then(setTransactions)
    getAssets().then(setAssets)
    getExchangeRates().then(setRates).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const toJPY = (amount: number, ccy: string) => {
    if (ccy === 'JPY') return amount
    if (!rates?.rates) return amount
    if (ccy === 'USD') return amount / rates.rates.USD
    if (ccy === 'CNY') return amount / rates.rates.CNY
    return amount
  }

  const totalIncome = transactions.filter(t => t.type === '收入').reduce((s, t) => s + toJPY(t.amount, t.currency), 0)
  const totalExpense = transactions.filter(t => t.type === '支出').reduce((s, t) => s + toJPY(t.amount, t.currency), 0)
  const netAssets = assets.reduce((s, a) => s + toJPY(a.amount, a.currency) * (a.asset_type === '负债' ? -1 : 1), 0)

  // Expense by category
  const expByCat: Record<string, number> = {}
  transactions.filter(t => t.type === '支出').forEach(t => {
    expByCat[t.category] = (expByCat[t.category] || 0) + toJPY(t.amount, t.currency)
  })
  const pieData = Object.entries(expByCat).map(([name, value]) => ({ name, value: Math.round(value) }))

  const handleSaveTx = async () => {
    await createTransaction({ ...txForm, amount: Number(txForm.amount) })
    setShowTxModal(false); load()
  }

  const handleSaveAsset = async () => {
    const payload = { ...assetForm, amount: Number(assetForm.amount) }
    editingAsset ? await updateAsset(editingAsset.id, payload) : await createAsset(payload)
    setShowAssetModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>💰 理财管理</div>
        <Button onClick={() => setShowTxModal(true)}>+ 记录收支</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="本月收入" value={`¥${Math.round(totalIncome).toLocaleString()}`} sub="折合日元" />
        <StatCard label="本月支出" value={`¥${Math.round(totalExpense).toLocaleString()}`} sub="折合日元" />
        <StatCard label="净资产（折合日元）" value={`¥${Math.round(netAssets).toLocaleString()}`} sub={rates ? `汇率 ${now.format('MM-DD')} 更新` : '汇率获取失败，请手动录入'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Assets */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <CardTitle>资产总览（多币种）</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setEditingAsset(null); setAssetForm({ name: '', asset_type: '存款', amount: '', currency: 'JPY' }); setShowAssetModal(true) }}>+ 添加资产</Button>
          </div>
          {rates && <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>
            参考汇率：1 USD ≈ ¥{rates?.rates ? (1 / rates.rates.USD).toFixed(1) : '—'} · 1 CNY ≈ ¥{rates?.rates ? (1 / rates.rates.CNY).toFixed(1) : '—'}
          </div>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['资产', '类型', '金额', '折合日元'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 8px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: a.asset_type === '负债' ? '#e63946' : '#1b1b1b' }}>{a.name}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={a.asset_type === '负债' ? 'red' : 'purple'}>{a.asset_type}</Badge></td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>
                    {a.amount.toLocaleString()}
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f0f0f0', color: CCY_COLORS[a.currency] || '#888', marginLeft: 4 }}>{a.currency}</span>
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', color: a.asset_type === '负债' ? '#e63946' : '#6c4fa3', fontWeight: 600 }}>
                    {a.asset_type === '负债' ? '-' : ''}¥{Math.round(toJPY(a.amount, a.currency)).toLocaleString()}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>暂无资产记录</td></tr>}
            </tbody>
          </table>
        </Card>

        {/* Expense chart */}
        <Card>
          <CardTitle>本月支出分类</CardTitle>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
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

        {/* Transactions */}
        <Card style={{ gridColumn: 'span 2' }}>
          <CardTitle>本月收支流水</CardTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr>{['日期', '类型', '分类', '金额', '备注', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>{t.date}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={t.type === '收入' ? 'green' : 'red'}>{t.type}</Badge></td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{t.category}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: t.type === '收入' ? '#6c4fa3' : '#e63946' }}>
                    {t.type === '收入' ? '+' : '-'}{t.amount.toLocaleString()}
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f0f0f0', color: CCY_COLORS[t.currency] || '#888', marginLeft: 4 }}>{t.currency}</span>
                  </td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', color: '#aaa' }}>{t.notes || '—'}</td>
                  <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span onClick={async () => { if (confirm('删除？')) { await deleteTransaction(t.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>本月暂无收支记录</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Transaction Modal */}
      {showTxModal && (
        <Modal title="记录收支" onClose={() => setShowTxModal(false)}>
          <FormRow label="类型"><Select value={txForm.type} onChange={v => setTxForm(f => ({ ...f, type: v, category: v === '收入' ? '工资' : '餐饮' }))} options={['收入','支出'].map(s => ({ label: s, value: s }))} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="金额 *"><Input type="number" value={txForm.amount} onChange={v => setTxForm(f => ({ ...f, amount: v }))} placeholder="0" /></FormRow>
            <FormRow label="货币"><Select value={txForm.currency} onChange={v => setTxForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
          </div>
          <FormRow label="分类">
            <Select value={txForm.category} onChange={v => setTxForm(f => ({ ...f, category: v }))} options={(txForm.type === '收入' ? INCOME_CATS : EXPENSE_CATS).map(s => ({ label: s, value: s }))} />
          </FormRow>
          <FormRow label="日期"><Input type="date" value={txForm.date} onChange={v => setTxForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="备注"><Input value={txForm.notes} onChange={v => setTxForm(f => ({ ...f, notes: v }))} placeholder="可选" /></FormRow>
          <ModalFooter onClose={() => setShowTxModal(false)} onSubmit={handleSaveTx} />
        </Modal>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <Modal title={editingAsset ? '编辑资产' : '添加资产'} onClose={() => setShowAssetModal(false)}>
          <FormRow label="资产名称 *"><Input value={assetForm.name} onChange={v => setAssetForm(f => ({ ...f, name: v }))} placeholder="如：三菱 UFJ 存款" /></FormRow>
          <FormRow label="类型"><Select value={assetForm.asset_type} onChange={v => setAssetForm(f => ({ ...f, asset_type: v }))} options={['存款','基金','股票','现金','负债'].map(s => ({ label: s, value: s }))} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="金额 *"><Input type="number" value={assetForm.amount} onChange={v => setAssetForm(f => ({ ...f, amount: v }))} /></FormRow>
            <FormRow label="货币"><Select value={assetForm.currency} onChange={v => setAssetForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
          </div>
          <ModalFooter onClose={() => setShowAssetModal(false)} onSubmit={handleSaveAsset} />
        </Modal>
      )}
    </div>
  )
}
