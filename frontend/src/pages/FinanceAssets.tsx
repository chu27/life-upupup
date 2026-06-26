import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getAssets, createAsset, updateAsset, deleteAsset, getExchangeRates, getInvestmentDailyTotals } from '../api'

const CCY_COLORS: Record<string, string> = { JPY: '#e65100', USD: '#2e7d32', CNY: '#c62828' }
const TYPE_COLORS = ['#6c4fa3', '#a07fd4', '#d4c9f0', '#c084fc', '#9c27b0', '#7b1fa2']

// 货币总览饼图颜色
const CCY_PIE: Record<string, string> = { JPY: '#f97316', USD: '#22c55e', CNY: '#ef4444' }

function MiniPie({ data, title, unit }: { data: { name: string; value: number }[]; title: string; unit: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (data.length === 0) return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>暂无数据</div>
    </Card>
  )
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 2 }}>
        {total.toLocaleString()} <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={50} dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={10}>
            {data.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => `${v.toLocaleString()} ${unit}`} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {(() => {
          const total = data.reduce((s, d) => s + d.value, 0)
          return data.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[i % TYPE_COLORS.length], display: 'inline-block' }} />
                {d.name}
              </span>
              <span style={{ color: '#666' }}>
                {d.value.toLocaleString()} {unit}
                <span style={{ color: '#aaa', marginLeft: 4 }}>({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)</span>
              </span>
            </div>
          ))
        })()}
      </div>
    </Card>
  )
}

const INV_CAT_OPTIONS = [
  { label: '不绑定（手动填写）', value: '' },
  { label: '📈 基金（自动同步）', value: '基金' },
  { label: '🇨🇳 A股（自动同步）', value: 'A股' },
  { label: '🇯🇵 日股（自动同步）', value: '日股' },
  { label: '🇺🇸 美股（自动同步）', value: '美股' },
]
const INV_CAT_CCY: Record<string, string> = { '基金': 'JPY', 'A股': 'CNY', '日股': 'JPY', '美股': 'USD' }

export default function FinanceAssets() {
  const now = dayjs()
  const [assets, setAssets] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [invTotals, setInvTotals] = useState<Record<string, any>>({})
  const [showModal, setShowModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [form, setForm] = useState({ name: '', asset_type: '存款', amount: '', currency: 'JPY', investment_category: '' })

  const load = () => {
    getAssets().then(setAssets)
    getExchangeRates().then(setRates).catch(() => {})
    getInvestmentDailyTotals().then(setInvTotals).catch(() => {})
  }
  useEffect(() => { load() }, [])

  // 获取资产的实际金额（绑定投资分类的取自动同步值，按资产自身货币匹配）
  const getEffectiveAmount = (a: any): number => {
    if (a.investment_category && invTotals[a.investment_category]) {
      const byCcy = invTotals[a.investment_category]
      // 用资产自身的货币去取对应的投资合计
      return byCcy[a.currency] ?? a.amount
    }
    return a.amount
  }

  const toJPY = (amount: number, ccy: string) => {
    if (ccy === 'JPY') return amount
    if (!rates?.rates) return amount
    if (ccy === 'USD') return amount / rates.rates.USD
    if (ccy === 'CNY') return amount / rates.rates.CNY
    return amount
  }

  const totalAssets = assets.reduce((s, a) => s + toJPY(getEffectiveAmount(a), a.currency), 0)

  const toCNY = (amount: number, ccy: string) => {
    if (ccy === 'CNY') return amount
    if (!rates?.rates) return 0
    const jpy = toJPY(amount, ccy)
    return jpy * rates.rates.CNY
  }
  const totalAssetsCNY = assets.reduce((s, a) => s + toCNY(getEffectiveAmount(a), a.currency), 0)

  // 各货币资产按类型汇总
  const byTypeByCcy = (ccy: string) => {
    const map: Record<string, number> = {}
    assets.filter(a => a.currency === ccy).forEach(a => {
      map[a.asset_type] = (map[a.asset_type] || 0) + getEffectiveAmount(a)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }))
  }

  // 总饼图：各货币折合日元占比
  const ccyTotalJPY: Record<string, number> = {}
  assets.forEach(a => {
    ccyTotalJPY[a.currency] = (ccyTotalJPY[a.currency] || 0) + toJPY(getEffectiveAmount(a), a.currency)
  })
  const ccyPieData = Object.entries(ccyTotalJPY).map(([name, value]) => ({ name, value: Math.round(value) }))

  const openAdd = () => {
    setEditingAsset(null)
    setForm({ name: '', asset_type: '存款', amount: '', currency: 'JPY', investment_category: '' })
    setShowModal(true)
  }
  const openEdit = (a: any) => {
    setEditingAsset(a)
    setForm({ name: a.name, asset_type: a.asset_type, amount: String(a.amount), currency: a.currency, investment_category: a.investment_category || '' })
    setShowModal(true)
  }
  const handleSave = async () => {
    const invCat = form.investment_category || null
    const payload = {
      name: form.name,
      asset_type: form.asset_type,
      // 绑定投资分类时 amount 存 0（实际显示时用同步值），货币保持用户设置
      amount: invCat ? 0 : Number(form.amount),
      currency: form.currency,
      investment_category: invCat,
    }
    editingAsset ? await updateAsset(editingAsset.id, payload) : await createAsset(payload)
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🏦 资产总览</div>
        <Button onClick={openAdd}>+ 添加资产</Button>
      </div>

      {rates?.rates && (
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>
          参考汇率（{now.format('MM-DD')} 更新）：1 USD ≈ ¥{(1 / rates.rates.USD).toFixed(1)} · 1 CNY ≈ ¥{(1 / rates.rates.CNY).toFixed(1)}
        </div>
      )}

      {/* 汇总数字 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="总资产" value={`¥${Math.round(totalAssets).toLocaleString()}`} sub="折合日元" />
        <StatCard label="总资产" value={`¥${Math.round(totalAssetsCNY).toLocaleString()}`} sub="折合人民币" />
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
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={ccyPieData} cx="50%" cy="50%" outerRadius={50} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={10}>
                    {ccyPieData.map((d) => <Cell key={d.name} fill={CCY_PIE[d.name] || '#aaa'} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `¥${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {(() => {
                  const total = ccyPieData.reduce((s, d) => s + d.value, 0)
                  return ccyPieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: CCY_PIE[d.name] || '#aaa', display: 'inline-block' }} />
                        {d.name}
                      </span>
                      <span style={{ color: '#666' }}>
                        ¥{d.value.toLocaleString()}
                        <span style={{ color: '#aaa', marginLeft: 4 }}>({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)</span>
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </>
          ) : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>暂无数据</div>}
        </Card>
      </div>

      {/* 资产明细 */}
      <Card>
        <CardTitle>资产明细</CardTitle>
        {assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无资产记录</div>
        ) : (
          (['JPY', 'USD', 'CNY'] as const).map(ccy => {
            const group = assets.filter(a => a.currency === ccy)
            if (group.length === 0) return null
            const CCY_LABEL: Record<string, string> = { JPY: '🇯🇵 日元', USD: '🇺🇸 美元', CNY: '🇨🇳 人民币' }
            return (
              <div key={ccy} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CCY_COLORS[ccy] || '#888', padding: '6px 12px', background: '#f9f8ff', borderRadius: 6, marginBottom: 4 }}>
                  {CCY_LABEL[ccy]}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>{['资产名称', '类型', '金额', '折合日元', '最后修改', '操作'].map(h =>
                      <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, color: '#bbb', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
                    )}</tr>
                  </thead>
                  <tbody>
                    {group.map(a => (
                      <tr key={a.id} onClick={() => openEdit(a)} style={{ cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf9fe')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, color: '#1b1b1b' }}>
                          {a.name}
                          {a.investment_category && (
                            <span style={{ fontSize: 10, marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                              🔄 {a.investment_category}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}><Badge variant="purple">{a.asset_type}</Badge></td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          {getEffectiveAmount(a).toLocaleString()}
                          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f0f0f0', color: CCY_COLORS[ccy] || '#888', marginLeft: 4 }}>{ccy}</span>
                        </td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', color: '#6c4fa3', fontWeight: 600 }}>
                          ¥{Math.round(toJPY(getEffectiveAmount(a), ccy)).toLocaleString()}
                        </td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                          {a.investment_category
                            ? <span style={{ color: '#16a34a' }}>🔄 实时同步</span>
                            : <span style={{ color: '#aaa' }}>{a.updated_at ? dayjs(a.updated_at).format('MM-DD HH:mm') : '—'}</span>
                          }
                        </td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          <span onClick={async (e) => { e.stopPropagation(); if (confirm('删除？')) { await deleteAsset(a.id); load() } }}
                            style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })
        )}
      </Card>

      {showModal && (
        <Modal title={editingAsset ? '编辑资产' : '添加资产'} onClose={() => setShowModal(false)}>
          <FormRow label="资产名称 *"><Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="如：三菱 UFJ 存款" /></FormRow>
          <FormRow label="类型"><Select value={form.asset_type} onChange={v => setForm(f => ({ ...f, asset_type: v }))} options={['存款','基金','股票','现金'].map(s => ({ label: s, value: s }))} /></FormRow>
          <FormRow label="关联投资记录（可选）">
            <Select value={form.investment_category} onChange={v => setForm(f => ({ ...f, investment_category: v }))} options={INV_CAT_OPTIONS} />
          </FormRow>
          {form.investment_category ? (
            <>
              <div style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                🔄 金额将自动从投资记录「{form.investment_category}」最新余额同步（取最近一次记录，无需手动填写）
              </div>
              <FormRow label="货币">
                <Select value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} />
              </FormRow>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <FormRow label="金额 *"><Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></FormRow>
              <FormRow label="货币"><Select value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={['JPY','USD','CNY'].map(s => ({ label: s, value: s }))} /></FormRow>
            </div>
          )}
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
