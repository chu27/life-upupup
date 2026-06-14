import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getAssets, createAsset, updateAsset, deleteAsset, getExchangeRates } from '../api'

const CCY_COLORS: Record<string, string> = { JPY: '#e65100', USD: '#2e7d32', CNY: '#c62828' }
const TYPE_COLORS = ['#6c4fa3', '#a07fd4', '#d4c9f0', '#c084fc', '#9c27b0', '#7b1fa2']

// 货币总览饼图颜色
const CCY_PIE: Record<string, string> = { JPY: '#f97316', USD: '#22c55e', CNY: '#ef4444' }

function MiniPie({ data, title, unit }: { data: { name: string; value: number }[]; title: string; unit: string }) {
  if (data.length === 0) return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>暂无数据</div>
    </Card>
  )
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={60} dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
            {data.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => `${v.toLocaleString()} ${unit}`} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[i % TYPE_COLORS.length], display: 'inline-block' }} />
              {d.name}
            </span>
            <span style={{ color: '#666' }}>{d.value.toLocaleString()} {unit}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function FinanceAssets() {
  const now = dayjs()
  const [assets, setAssets] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [form, setForm] = useState({ name: '', asset_type: '存款', amount: '', currency: 'JPY' })

  const load = () => {
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

  const positiveAssets = assets.filter(a => a.asset_type !== '负债')
  const netAssets = assets.reduce((s, a) => s + toJPY(a.amount, a.currency) * (a.asset_type === '负债' ? -1 : 1), 0)
  const totalPositive = positiveAssets.reduce((s, a) => s + toJPY(a.amount, a.currency), 0)
  const totalDebt = assets.filter(a => a.asset_type === '负债').reduce((s, a) => s + toJPY(a.amount, a.currency), 0)

  // 各货币资产（排除负债）按类型汇总
  const byTypeByCcy = (ccy: string) => {
    const map: Record<string, number> = {}
    positiveAssets.filter(a => a.currency === ccy).forEach(a => {
      map[a.asset_type] = (map[a.asset_type] || 0) + a.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }))
  }

  // 总饼图：各货币折合日元占比
  const ccyTotalJPY: Record<string, number> = {}
  positiveAssets.forEach(a => {
    ccyTotalJPY[a.currency] = (ccyTotalJPY[a.currency] || 0) + toJPY(a.amount, a.currency)
  })
  const ccyPieData = Object.entries(ccyTotalJPY).map(([name, value]) => ({ name, value: Math.round(value) }))

  const openAdd = () => {
    setEditingAsset(null)
    setForm({ name: '', asset_type: '存款', amount: '', currency: 'JPY' })
    setShowModal(true)
  }
  const openEdit = (a: any) => {
    setEditingAsset(a)
    setForm({ name: a.name, asset_type: a.asset_type, amount: String(a.amount), currency: a.currency })
    setShowModal(true)
  }
  const handleSave = async () => {
    const payload = { ...form, amount: Number(form.amount) }
    editingAsset ? await updateAsset(editingAsset.id, payload) : await createAsset(payload)
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🏦 资产总览</div>
        <Button onClick={openAdd}>+ 添加资产</Button>
      </div>

      {rates && (
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>
          参考汇率（{now.format('MM-DD')} 更新）：1 USD ≈ ¥{(1 / rates.rates.USD).toFixed(1)} · 1 CNY ≈ ¥{(1 / rates.rates.CNY).toFixed(1)}
        </div>
      )}

      {/* 汇总数字 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="净资产" value={`¥${Math.round(netAssets).toLocaleString()}`} sub="折合日元" />
        <StatCard label="总资产" value={`¥${Math.round(totalPositive).toLocaleString()}`} sub="折合日元" />
        <StatCard label="总负债" value={`¥${Math.round(totalDebt).toLocaleString()}`} sub="折合日元" />
      </div>

      {/* 饼图区：3张货币小饼 + 1张总览 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <MiniPie title="🇯🇵 日元资产构成" data={byTypeByCcy('JPY')} unit="JPY" />
        <MiniPie title="🇺🇸 美元资产构成" data={byTypeByCcy('USD')} unit="USD" />
        <MiniPie title="🇨🇳 人民币资产构成" data={byTypeByCcy('CNY')} unit="CNY" />

        {/* 总货币占比饼 */}
        <Card>
          <CardTitle>货币占比（折合日元）</CardTitle>
          {ccyPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={ccyPieData} cx="50%" cy="50%" outerRadius={60} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {ccyPieData.map((d) => <Cell key={d.name} fill={CCY_PIE[d.name] || '#aaa'} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `¥${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {ccyPieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: CCY_PIE[d.name] || '#aaa', display: 'inline-block' }} />
                      {d.name}
                    </span>
                    <span style={{ color: '#666' }}>¥{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>暂无数据</div>}
        </Card>
      </div>

      {/* 资产明细 */}
      <Card>
        <CardTitle>资产明细</CardTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{['资产名称', '类型', '金额', '折合日元', '操作'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id} onClick={() => openEdit(a)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#faf9fe')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: a.asset_type === '负债' ? '#e63946' : '#1b1b1b' }}>{a.name}</td>
                <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}><Badge variant={a.asset_type === '负债' ? 'red' : 'purple'}>{a.asset_type}</Badge></td>
                <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  {a.amount.toLocaleString()}
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f0f0f0', color: CCY_COLORS[a.currency] || '#888', marginLeft: 4 }}>{a.currency}</span>
                </td>
                <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', color: a.asset_type === '负债' ? '#e63946' : '#6c4fa3', fontWeight: 600 }}>
                  {a.asset_type === '负债' ? '-' : ''}¥{Math.round(toJPY(a.amount, a.currency)).toLocaleString()}
                </td>
                <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  <span onClick={async (e) => { e.stopPropagation(); if (confirm('删除？')) { await deleteAsset(a.id); load() } }}
                    style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                </td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无资产记录</td></tr>}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title={editingAsset ? '编辑资产' : '添加资产'} onClose={() => setShowModal(false)}>
          <FormRow label="资产名称 *"><Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="如：三菱 UFJ 存款" /></FormRow>
          <FormRow label="类型"><Select value={form.asset_type} onChange={v => setForm(f => ({ ...f, asset_type: v }))} options={['存款','基金','股票','现金','负债'].map(s => ({ label: s, value: s }))} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <FormRow label="金额 *"><Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></FormRow>
            <FormRow label="货币"><Select value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
