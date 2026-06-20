import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, ModalFooter } from '../components/Modal'
import { getGroceryPrices, createGroceryPrice, updateGroceryPrice, deleteGroceryPrice, getGroceryNames } from '../api'

// 种类结构
const CATEGORIES: Record<string, string[]> = {
  '肉类': ['牛肉', '鸡肉', '猪肉', '其他'],
  '蔬菜': [],
  '水果': [],
  '海鲜': [],
  '其他': [],
}
const CAT_ICON: Record<string, string> = { '肉类': '🥩', '蔬菜': '🥦', '水果': '🍎', '海鲜': '🦐', '其他': '📦' }

// 需要填数量的单位（可数 + g/kg 支持标注克数）
const COUNT_UNITS = ['个', '盒', '袋', '瓶', '束', '棵', '条', '只', '罐']
const WEIGHT_UNITS = ['斤', '克', '公斤', 'g', 'kg']
const QTY_UNITS = [...COUNT_UNITS, 'g', 'kg']   // 这些单位都可以填数量
const ALL_UNITS = [...WEIGHT_UNITS, ...COUNT_UNITS]

const TAX_OPTIONS = [
  { label: '税后', value: '税后' },
  { label: '税前（+8%）', value: '税前8' },
  { label: '税前（+10%）', value: '税前10' },
]
const TAX_RATE: Record<string, number> = { '税前8': 0.08, '税前10': 0.10 }

const DISCOUNT_OPTIONS = [
  { label: '不打折', value: '0' },
  ...Array.from({ length: 10 }, (_, i) => {
    const pct = (i + 1) * 5
    return { label: `${pct}% off`, value: String(pct / 100) }
  }),
]

const today = dayjs().format('YYYY-MM-DD')

// 计算含税价
function taxIncluded(price: number, taxType: string) {
  const rate = TAX_RATE[taxType]
  return rate ? price * (1 + rate) : price
}
// 含税后再打折
function finalPrice(price: number, taxType: string, discount: number) {
  return taxIncluded(price, taxType) * (1 - discount)
}
// 单价（最终价 / 数量）
function unitPrice(price: number, taxType: string, quantity: number, unit: string, discount = 0) {
  const p = finalPrice(price, taxType, discount)
  if (COUNT_UNITS.includes(unit) && quantity > 1) return p / quantity
  return p
}

export default function Grocery() {
  const [prices, setPrices] = useState<any[]>([])
  const [names, setNames] = useState<string[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [filterName, setFilterName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', category: '', subcategory: '',
    price: '', tax_type: '税后', discount: '0', quantity: '1', unit: '斤',
    origin: '', store: '', notes: '',
  })

  const isQtyUnit = QTY_UNITS.includes(form.unit)
  const isCountUnit = COUNT_UNITS.includes(form.unit)  // 只用于"/ N个"的标注显示

  const load = async () => {
    const [p, n] = await Promise.all([
      getGroceryPrices(filterName || undefined, filterCat || undefined),
      getGroceryNames(),
    ])
    setPrices(p)
    setNames(n)
  }

  useEffect(() => { load() }, [filterCat, filterName])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', category: '', subcategory: '', price: '', tax_type: '税后', discount: '0', quantity: '1', unit: '斤', origin: '', store: '', notes: '' })
    setShowModal(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category || '',
      subcategory: item.subcategory || '',
      price: String(item.price),
      tax_type: item.tax_type || '税后',
      discount: String(item.discount ?? 0),
      quantity: String(item.quantity ?? 1),
      unit: item.unit,
      origin: item.origin || '',
      store: item.store || '',
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return
    const payload = {
      ...form,
      date: editing?.date || today,   // 新增用今天，编辑保留原日期
      price: Number(form.price),
      discount: Number(form.discount) || 0,
      quantity: Number(form.quantity) || 1,
      subcategory: form.category === '肉类' ? form.subcategory : null,
    }
    editing ? await updateGroceryPrice(editing.id, payload) : await createGroceryPrice(payload)
    setShowModal(false)
    load()
  }

  // 不再按日期分组，直接平铺（后端已按日期+id倒序返回）

  // 同一品名的历史价格（用于涨跌对比，按含税后单价）
  const priceMap: Record<string, number[]> = {}
  prices.forEach(p => {
    const up = unitPrice(p.price, p.tax_type, p.quantity ?? 1, p.unit, p.discount ?? 0)
    priceMap[p.name] = priceMap[p.name] || []
    priceMap[p.name].push(up)
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🛒 价格管理</div>
        <Button onClick={openAdd}>+ 记录价格</Button>
      </div>

      {/* 种类筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {['', ...Object.keys(CATEGORIES)].map(cat => (
          <button key={cat || 'all'} onClick={() => { setFilterCat(cat); setFilterName('') }}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
              background: filterCat === cat ? '#6c4fa3' : '#f0f0f0',
              color: filterCat === cat ? '#fff' : '#555',
            }}>{cat ? `${CAT_ICON[cat]} ${cat}` : '全部'}</button>
        ))}
      </div>


      {/* 列表 */}
      {prices.length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>暂无记录，点击右上角开始记录</div></Card>
      ) : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['品名', '种类', '产地', '价格', '购买地点', '备注', '操作'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {prices.map(item => {
                const qty = item.quantity ?? 1
                const disc = item.discount ?? 0
                const isCount = COUNT_UNITS.includes(item.unit)
                const withTax = finalPrice(item.price, item.tax_type, disc)
                const up = unitPrice(item.price, item.tax_type, qty, item.unit, disc)
                const hist = priceMap[item.name] || []
                const idx = hist.findIndex(v => Math.abs(v - up) < 0.01)
                const prevPrice = idx < hist.length - 1 ? hist[idx + 1] : null
                const diff = prevPrice != null ? up - prevPrice : null

                return (
                  <tr key={item.id} onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#faf9fe')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 12 }}>
                      {item.category ? `${CAT_ICON[item.category] || ''} ${item.category}` : '—'}
                      {item.subcategory ? ` · ${item.subcategory}` : ''}
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 12 }}>{item.origin || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontWeight: 700, color: '#6c4fa3' }}>¥{Math.round(withTax)}/{item.unit}</span>
                      {disc > 0 && (
                        <span style={{ fontSize: 10, color: '#e65100', marginLeft: 4, background: '#fff3e0', padding: '1px 4px', borderRadius: 4 }}>{disc * 100}% off</span>
                      )}
                      {diff != null && (
                        <span style={{ fontSize: 11, marginLeft: 5, color: diff > 0 ? '#e63946' : diff < 0 ? '#22c55e' : '#aaa' }}>
                          {diff > 0 ? `↑${Math.round(diff)}` : diff < 0 ? `↓${Math.round(Math.abs(diff))}` : '持平'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{item.store || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#aaa', fontSize: 12 }}>{item.notes || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={async e => { e.stopPropagation(); if (confirm(`删除「${item.name}」这条记录？`)) { await deleteGroceryPrice(item.id); load() } }}
                        style={{ fontSize: 12, color: '#e63946', cursor: 'pointer' }}>删除</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {showModal && (
        <Modal title={editing ? '编辑价格记录' : '记录价格'} onClose={() => setShowModal(false)}>
          <FormRow label="品名 *">
            <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="如：西红柿、猪肉、鸡蛋" />
          </FormRow>

          {/* 种类 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="种类">
              <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v, subcategory: '' }))}
                options={[{ label: '不分类', value: '' }, ...Object.keys(CATEGORIES).map(c => ({ label: `${CAT_ICON[c]} ${c}`, value: c }))]} />
            </FormRow>
            {form.category === '肉类' && (
              <FormRow label="细分">
                <Select value={form.subcategory} onChange={v => setForm(f => ({ ...f, subcategory: v }))}
                  options={[{ label: '不选', value: '' }, ...CATEGORIES['肉类'].map(s => ({ label: s, value: s }))]} />
              </FormRow>
            )}
          </div>

          {/* 价格 + 税 + 折扣 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <FormRow label="价格 *">
              <Input type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="0.00" />
            </FormRow>
            <FormRow label="税">
              <Select value={form.tax_type} onChange={v => setForm(f => ({ ...f, tax_type: v }))}
                options={TAX_OPTIONS} />
            </FormRow>
            <FormRow label="折扣">
              <Select value={form.discount} onChange={v => setForm(f => ({ ...f, discount: v }))}
                options={DISCOUNT_OPTIONS} />
            </FormRow>
          </div>
          {form.price && (TAX_RATE[form.tax_type] || Number(form.discount) > 0) && (
            <div style={{ fontSize: 12, color: '#6c4fa3', background: '#f5f0ff', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
              实付：¥{finalPrice(Number(form.price), form.tax_type, Number(form.discount)).toFixed(2)}
              {Number(form.discount) > 0 && <span style={{ color: '#e65100', marginLeft: 6 }}>{Number(form.discount) * 100}% off</span>}
            </div>
          )}

          {/* 数量 + 单位 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="单位">
              <Select value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v, quantity: QTY_UNITS.includes(v) ? f.quantity : '1' }))}
                options={ALL_UNITS.map(u => ({ label: u, value: u }))} />
            </FormRow>
            {isQtyUnit && (
              <FormRow label="数量">
                <Input type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} placeholder="如：300" />
              </FormRow>
            )}
          </div>
          {isQtyUnit && form.price && Number(form.quantity) > 1 && (
            <div style={{ fontSize: 12, color: '#888', background: '#f9f9f9', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>
              单价：¥{(finalPrice(Number(form.price), form.tax_type, Number(form.discount)) / Number(form.quantity)).toFixed(2)} / {form.unit}
            </div>
          )}

          <FormRow label="产地">
            <Input value={form.origin} onChange={v => setForm(f => ({ ...f, origin: v }))} placeholder="如：北海道、山东、澳大利亚" />
          </FormRow>
          <FormRow label="购买地点">
            <Select value={form.store} onChange={v => setForm(f => ({ ...f, store: v }))}
              options={['', 'ロピア', '业务超市', '八百屋', '堂吉柯德', '其他'].map(s => ({ label: s || '不填', value: s }))} />
          </FormRow>
          <FormRow label="备注">
            <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="可选" />
          </FormRow>
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
