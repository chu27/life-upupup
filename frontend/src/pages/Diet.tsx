import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Card, { CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import { getMeals, createMeal, deleteMeal, getWater, addCup } from '../api'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐']

export default function Diet() {
  const today = dayjs().format('YYYY-MM-DD')
  const [meals, setMeals] = useState<any[]>([])
  const [water, setWater] = useState<any>({ cups: 0 })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ date: today, meal_type: '早餐', description: '', recipe_notes: '', ingredient_weight: '', calories: '', protein: '', carbs: '', fat: '' })

  const load = () => {
    getMeals(today).then(setMeals)
    getWater(today).then(setWater)
  }
  useEffect(() => { load() }, [])

  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0)

  const missingMeals = MEAL_TYPES.filter(t => !meals.find(m => m.meal_type === t))

  const handleSave = async () => {
    const payload = {
      ...form,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      carbs: form.carbs ? Number(form.carbs) : null,
      fat: form.fat ? Number(form.fat) : null,
    }
    await createMeal(payload)
    setShowModal(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🥗 饮食管理</div>
        <Button onClick={() => { setForm({ date: today, meal_type: '早餐', description: '', recipe_notes: '', ingredient_weight: '', calories: '', protein: '', carbs: '', fat: '' }); setShowModal(true) }}>+ 记录餐食</Button>
      </div>

      {missingMeals.length > 0 && (
        <div style={{ padding: '10px 14px', background: '#ede8f7', borderLeft: '3px solid #6c4fa3', borderRadius: 8, fontSize: 13, color: '#6c4fa3', marginBottom: 16 }}>
          今日未记录：{missingMeals.join('、')}，别忘了补充记录 🍽️
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          <CardTitle>今日饮水</CardTitle>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#6c4fa3' }}>{water.cups}</div>
            <div style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>杯 / 目标 8 杯</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button onClick={async () => { await addCup(today); load() }}>+ 1 杯</Button>
            </div>
          </div>
          <div style={{ background: '#eee', borderRadius: 99, height: 6, marginTop: 8 }}>
            <div style={{ background: '#6c4fa3', height: 6, borderRadius: 99, width: `${Math.min((water.cups / 8) * 100, 100)}%` }} />
          </div>
        </Card>

        {/* Meals today */}
        <Card style={{ gridColumn: 'span 2' }}>
          <CardTitle>今日餐食记录</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {MEAL_TYPES.map(type => {
              const meal = meals.find(m => m.meal_type === type)
              return meal ? (
                <div key={type} style={{ padding: 14, background: '#f5f3fa', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 5 }}>{type}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{meal.description}</div>
                  {meal.calories && <div style={{ fontSize: 12, color: '#6c4fa3' }}>🤖 {meal.ai_calculated ? '估算' : '手动'}：约 {meal.calories} kcal</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    {/* AI 占位按钮 */}
                    <button style={{ fontSize: 11, padding: '3px 8px', background: '#ede8f7', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'not-allowed' }} title="Claude API 功能待实装">
                      🤖 AI 计算
                    </button>
                    <span onClick={async () => { if (confirm('删除？')) { await deleteMeal(meal.id); load() } }} style={{ fontSize: 11, color: '#e63946', cursor: 'pointer' }}>删除</span>
                  </div>
                </div>
              ) : (
                <div key={type} onClick={() => { setForm(f => ({ ...f, meal_type: type })); setShowModal(true) }}
                  style={{ padding: 14, background: '#fafafa', borderRadius: 8, border: '1.5px dashed #e4dff0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, cursor: 'pointer', minHeight: 80 }}>
                  <div style={{ fontSize: 22 }}>+</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>记录{type}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {showModal && (
        <Modal title="记录餐食" onClose={() => setShowModal(false)}>
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
          <ModalFooter onClose={() => setShowModal(false)} onSubmit={handleSave} />
        </Modal>
      )}
    </div>
  )
}
