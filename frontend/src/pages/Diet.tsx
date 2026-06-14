import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getMeals, createMeal, updateMeal, deleteMeal, getWater, getAllWater, addCup, removeCup, getSupplements, createSupplement, deleteSupplement } from '../api'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐']

export default function Diet() {
  const today = dayjs().format('YYYY-MM-DD')
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [meals, setMeals] = useState<any[]>([])
  const [allMeals, setAllMeals] = useState<any[]>([])
  const [allWater, setAllWater] = useState<any[]>([])
  const [allSupplements, setAllSupplements] = useState<any[]>([])
  const [water, setWater] = useState<any>({ cups: 0 })
  const [supplements, setSupplements] = useState<any[]>([])
  const [showSupModal, setShowSupModal] = useState(false)
  const [supForm, setSupForm] = useState({ date: today, name: '', type: '营养品', dosage: '', notes: '' })
  const [waterGoal, setWaterGoal] = useState<number>(() => Number(localStorage.getItem('waterGoal') || 8))
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMealId, setEditingMealId] = useState<number | null>(null)
  const [form, setForm] = useState({ date: today, meal_type: '早餐', description: '', recipe_notes: '', ingredient_weight: '', calories: '', protein: '', carbs: '', fat: '' })
  const [historyMonth, setHistoryMonth] = useState(dayjs().format('YYYY-MM'))

  const load = () => {
    getMeals(today).then(setMeals)
    getWater(today).then(setWater)
    getSupplements(today).then(setSupplements)
  }
  const loadAll = () => {
    getMeals().then(setAllMeals)
    getAllWater().then(setAllWater)
    getSupplements().then(setAllSupplements)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (tab === 'history') loadAll() }, [tab])

  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0)
  const missingMeals = MEAL_TYPES.filter(t => !meals.find(m => m.meal_type === t))

  // 历史：收集该月所有有记录的日期
  const allDatesInMonth = new Set([
    ...allMeals.filter(m => m.date?.startsWith(historyMonth)).map(m => m.date),
    ...allWater.filter(w => w.date?.startsWith(historyMonth) && w.cups > 0).map(w => w.date),
    ...allSupplements.filter(s => s.date?.startsWith(historyMonth)).map(s => s.date),
  ])
  const sortedDates = Array.from(allDatesInMonth).sort((a, b) => b.localeCompare(a))

  const openEdit = (meal: any) => {
    setEditingMealId(meal.id)
    setForm({
      date: meal.date, meal_type: meal.meal_type, description: meal.description || '',
      recipe_notes: meal.recipe_notes || '', ingredient_weight: meal.ingredient_weight || '',
      calories: meal.calories != null ? String(meal.calories) : '',
      protein: meal.protein != null ? String(meal.protein) : '',
      carbs: meal.carbs != null ? String(meal.carbs) : '',
      fat: meal.fat != null ? String(meal.fat) : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      carbs: form.carbs ? Number(form.carbs) : null,
      fat: form.fat ? Number(form.fat) : null,
    }
    if (editingMealId) {
      await updateMeal(editingMealId, payload)
    } else {
      await createMeal(payload)
    }
    setShowModal(false); setEditingMealId(null)
    load(); loadAll()
  }

  const tabStyle = (active: boolean) => ({
    padding: '7px 20px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? '#6c4fa3' : '#999', borderBottom: active ? '2px solid #6c4fa3' : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', borderBottom: active ? '2px solid #6c4fa3' : '2px solid transparent',
  } as React.CSSProperties)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🥗 饮食管理</div>
        <Button onClick={() => { setEditingMealId(null); setForm({ date: today, meal_type: '早餐', description: '', recipe_notes: '', ingredient_weight: '', calories: '', protein: '', carbs: '', fat: '' }); setShowModal(true) }}>+ 记录餐食</Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e4dff0', marginBottom: 16 }}>
        <button style={tabStyle(tab === 'today')} onClick={() => setTab('today')}>今日</button>
        <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>历史记录</button>
      </div>

      {/* ── 今日视图 ── */}
      {tab === 'today' && (
        <>
          {missingMeals.length > 0 && (
            <div style={{ padding: '10px 14px', background: '#ede8f7', borderLeft: '3px solid #6c4fa3', borderRadius: 8, fontSize: 13, color: '#6c4fa3', marginBottom: 16 }}>
              今日未记录：{missingMeals.join('、')}，别忘了补充记录 🍽️
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Meals today — 占满两列，排在最前 */}
            <Card style={{ gridColumn: 'span 2' }}>
              <CardTitle>今日餐食记录</CardTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {MEAL_TYPES.map(type => {
                  const meal = meals.find(m => m.meal_type === type)
                  return meal ? (
                    <div key={type} onClick={() => openEdit(meal)}
                      style={{ padding: 14, background: '#f5f3fa', borderRadius: 8, cursor: 'pointer', transition: 'box-shadow .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(108,79,163,.15)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ fontSize: 11, color: '#999' }}>{type}</div>
                        <span style={{ fontSize: 10, color: '#bbb' }}>点击编辑</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{meal.description}</div>
                      {meal.calories && <div style={{ fontSize: 12, color: '#6c4fa3' }}>约 {meal.calories} kcal</div>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <span onClick={async (e) => { e.stopPropagation(); if (confirm('删除？')) { await deleteMeal(meal.id); load() } }} style={{ fontSize: 11, color: '#e63946', cursor: 'pointer' }}>删除</span>
                      </div>
                    </div>
                  ) : (
                    <div key={type} onClick={() => { setEditingMealId(null); setForm({ date: today, meal_type: type, description: '', recipe_notes: '', ingredient_weight: '', calories: '', protein: '', carbs: '', fat: '' }); setShowModal(true) }}
                      style={{ padding: 14, background: '#fafafa', borderRadius: 8, border: '1.5px dashed #e4dff0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, cursor: 'pointer', minHeight: 80 }}>
                      <div style={{ fontSize: 22 }}>+</div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>记录{type}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Nutrition summary */}
            <Card>
              <CardTitle>今日营养摄入</CardTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: '热量 kcal', value: Math.round(totalCals), color: '#6c4fa3' },
                  { label: '蛋白质 g', value: Math.round(totalProtein) },
                  { label: '碳水 g', value: Math.round(totalCarbs) },
                  { label: '脂肪 g', value: Math.round(totalFat) },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: 12, background: '#f5f3fa', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: item.color || '#1b1b1b' }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>热量目标进度 {Math.round(totalCals)} / 1,600 kcal</div>
              <div style={{ background: '#eee', borderRadius: 99, height: 6 }}>
                <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: `${Math.min((totalCals / 1600) * 100, 100)}%` }} />
              </div>
            </Card>

            {/* Water */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <CardTitle>今日饮水</CardTitle>
                {!editingGoal
                  ? <span onClick={() => { setGoalInput(String(waterGoal)); setEditingGoal(true) }}
                      style={{ fontSize: 11, color: '#bbb', cursor: 'pointer' }}>设置目标</span>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input value={goalInput} onChange={e => setGoalInput(e.target.value)} type="number" min={1}
                        style={{ width: 48, padding: '2px 6px', fontSize: 12, border: '1px solid #e4dff0', borderRadius: 6, outline: 'none' }} />
                      <span style={{ fontSize: 11, color: '#999' }}>杯</span>
                      <span onClick={() => {
                        const v = Math.max(1, Number(goalInput) || waterGoal)
                        setWaterGoal(v); localStorage.setItem('waterGoal', String(v)); setEditingGoal(false)
                      }} style={{ fontSize: 11, color: '#6c4fa3', cursor: 'pointer', fontWeight: 600 }}>确认</span>
                      <span onClick={() => setEditingGoal(false)} style={{ fontSize: 11, color: '#aaa', cursor: 'pointer' }}>取消</span>
                    </div>
                }
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#6c4fa3' }}>{water.cups}</div>
                <div style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>杯 / 目标 {waterGoal} 杯</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Button variant="outline" onClick={async () => { await removeCup(today); load() }}>- 1 杯</Button>
                  <Button onClick={async () => { await addCup(today); load() }}>+ 1 杯</Button>
                </div>
              </div>
              <div style={{ background: '#eee', borderRadius: 99, height: 6, marginTop: 8 }}>
                <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: `${Math.min((water.cups / waterGoal) * 100, 100)}%` }} />
              </div>
            </Card>

            {/* 营养品 & 药物 */}
            <Card style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <CardTitle>今日营养品 & 药物</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setSupForm({ date: today, name: '', type: '营养品', dosage: '', notes: '' }); setShowSupModal(true) }}>+ 添加</Button>
              </div>
              {supplements.length === 0
                ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#aaa', fontSize: 13 }}>今日暂无记录</div>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {supplements.map((s: any) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: s.type === '药物' ? '#fff4f4' : '#f5f3fa', borderRadius: 8, fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>{s.type === '药物' ? '💊' : '🌿'}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>{[s.type, s.dosage].filter(Boolean).join(' · ')}{s.notes ? ` · ${s.notes}` : ''}</div>
                        </div>
                        <span onClick={async () => { if (confirm('删除？')) { await deleteSupplement(s.id); load() } }}
                          style={{ fontSize: 12, color: '#e63946', cursor: 'pointer', marginLeft: 4 }}>×</span>
                      </div>
                    ))}
                  </div>
              }
            </Card>
          </div>
        </>
      )}

      {/* ── 历史记录视图 ── */}
      {tab === 'history' && (
        <div>
          {/* 月份切换 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setHistoryMonth(dayjs(historyMonth).subtract(1, 'month').format('YYYY-MM'))}
              style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 600, minWidth: 80, textAlign: 'center' }}>
              {dayjs(historyMonth).format('YYYY年M月')}
            </span>
            <button onClick={() => setHistoryMonth(dayjs(historyMonth).add(1, 'month').format('YYYY-MM'))}
              style={{ background: 'none', border: '1px solid #e4dff0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
            {historyMonth !== dayjs().format('YYYY-MM') && (
              <span onClick={() => setHistoryMonth(dayjs().format('YYYY-MM'))}
                style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer' }}>回到本月</span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>共 {sortedDates.length} 天记录</span>
          </div>

          {sortedDates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>本月暂无饮食记录</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sortedDates.map(date => {
              const dayMeals = allMeals.filter(m => m.date === date)
              const dayWater = allWater.find(w => w.date === date)
              const daySupplements = allSupplements.filter(s => s.date === date)
              const dayCals = dayMeals.reduce((s: number, m: any) => s + (m.calories || 0), 0)
              const isToday = date === today
              return (
                <Card key={date}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{dayjs(date).format('M月D日')}（{['日','一','二','三','四','五','六'][dayjs(date).day()]}）</span>
                      {isToday && <span style={{ fontSize: 10, background: '#6c4fa3', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>今天</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa' }}>
                      {dayCals > 0 && <span style={{ color: '#6c4fa3' }}>🍽 {Math.round(dayCals)} kcal</span>}
                      {dayWater && dayWater.cups > 0 && <span>💧 {dayWater.cups} 杯</span>}
                      {daySupplements.length > 0 && <span>🌿 {daySupplements.length} 项</span>}
                    </div>
                  </div>

                  {/* 餐食 */}
                  {dayMeals.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600 }}>餐食</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {dayMeals.map((meal: any) => (
                          <div key={meal.id} onClick={() => openEdit(meal)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f5f3fa', borderRadius: 8, cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ede8f7')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#f5f3fa')}>
                            <span style={{ fontSize: 11, color: '#888', width: 30, flexShrink: 0 }}>{meal.meal_type}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{meal.description}</span>
                            {meal.calories && <span style={{ fontSize: 12, color: '#6c4fa3', flexShrink: 0 }}>{meal.calories} kcal</span>}
                            {meal.protein && <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>蛋白 {meal.protein}g</span>}
                            <span onClick={async (e) => { e.stopPropagation(); if (confirm('删除？')) { await deleteMeal(meal.id); loadAll() } }}
                              style={{ fontSize: 11, color: '#e63946', cursor: 'pointer', flexShrink: 0 }}>删除</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 饮水 */}
                  {dayWater && dayWater.cups > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600 }}>饮水</div>
                      <div style={{ padding: '8px 12px', background: '#f0f7ff', borderRadius: 8, fontSize: 13 }}>
                        💧 共喝 <strong>{dayWater.cups}</strong> 杯（约 {dayWater.ml} ml）
                      </div>
                    </div>
                  )}

                  {/* 营养品 & 药物 */}
                  {daySupplements.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600 }}>营养品 & 药物</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {daySupplements.map((s: any) => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: s.type === '药物' ? '#fff4f4' : '#f5f3fa', borderRadius: 8, fontSize: 12 }}>
                            <span>{s.type === '药物' ? '💊' : '🌿'}</span>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            {s.dosage && <span style={{ color: '#999' }}>{s.dosage}</span>}
                            <span onClick={async () => { if (confirm('删除？')) { await deleteSupplement(s.id); loadAll() } }}
                              style={{ color: '#e63946', cursor: 'pointer', marginLeft: 2 }}>×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {showSupModal && (
        <Modal title="添加营养品 / 药物" onClose={() => setShowSupModal(false)}>
          <FormRow label="日期"><Input type="date" value={supForm.date} onChange={v => setSupForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="名称 *"><Input value={supForm.name} onChange={v => setSupForm(f => ({ ...f, name: v }))} placeholder="如：维生素D、鱼油、布洛芬" /></FormRow>
          <FormRow label="类型"><Select value={supForm.type} onChange={v => setSupForm(f => ({ ...f, type: v }))} options={[{ label: '营养品', value: '营养品' }, { label: '药物', value: '药物' }]} /></FormRow>
          <FormRow label="剂量"><Input value={supForm.dosage} onChange={v => setSupForm(f => ({ ...f, dosage: v }))} placeholder="如：1粒、500mg、10ml" /></FormRow>
          <FormRow label="备注"><Input value={supForm.notes} onChange={v => setSupForm(f => ({ ...f, notes: v }))} placeholder="饭前/饭后、用药原因等" /></FormRow>
          <ModalFooter onClose={() => setShowSupModal(false)} onSubmit={async () => {
            if (!supForm.name.trim()) return
            await createSupplement(supForm)
            setShowSupModal(false); load()
          }} />
        </Modal>
      )}

      {showModal && (
        <Modal title={editingMealId ? '编辑餐食' : '记录餐食'} onClose={() => { setShowModal(false); setEditingMealId(null) }}>
          <FormRow label="日期"><Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="餐次"><Select value={form.meal_type} onChange={v => setForm(f => ({ ...f, meal_type: v }))} options={MEAL_TYPES.map(t => ({ label: t, value: t }))} /></FormRow>
          <FormRow label="食物描述 *"><Textarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="今天吃了什么…" rows={3} /></FormRow>
          <FormRow label="做法备注"><Textarea value={form.recipe_notes} onChange={v => setForm(f => ({ ...f, recipe_notes: v }))} placeholder="食材重量、烹饪方式（用于 AI 计算营养，待实装）" rows={2} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormRow label="热量 kcal（选填）"><Input type="number" value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} /></FormRow>
            <FormRow label="蛋白质 g"><Input type="number" value={form.protein} onChange={v => setForm(f => ({ ...f, protein: v }))} /></FormRow>
            <FormRow label="碳水 g"><Input type="number" value={form.carbs} onChange={v => setForm(f => ({ ...f, carbs: v }))} /></FormRow>
            <FormRow label="脂肪 g"><Input type="number" value={form.fat} onChange={v => setForm(f => ({ ...f, fat: v }))} /></FormRow>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: -4, marginBottom: 8 }}>营养素可先手动填写，AI 计算功能待实装后自动计算</div>
          <ModalFooter onClose={() => { setShowModal(false); setEditingMealId(null) }} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
