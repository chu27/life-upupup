import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card, { CardTitle, StatCard } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal, { FormRow, Input, Select, Textarea, ModalFooter } from '../components/Modal'
import {
  getCheckins, upsertCheckin, getStudyGoals, createStudyGoal, getResources, createResource, deleteResource,
  getGrammar, createGrammar, updateGrammar, deleteGrammar,
  getVocab, createVocab, updateVocab, deleteVocab,
  getSentences, createSentence, updateSentence, deleteSentence,
} from '../api'
import { useLanguages } from '../App'

const RESOURCE_TYPES = ['教材', '网站', '视频', 'App']
const TABS = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'grammar', label: '语法', icon: '📐' },
  { key: 'vocab', label: '单词', icon: '🔤' },
  { key: 'sentence', label: '句子', icon: '💬' },
]
const MASTERY = [
  { value: 0, label: '未学', color: '#aaa', bg: '#f0f0f0' },
  { value: 1, label: '学习中', color: '#d48806', bg: '#fff7e6' },
  { value: 2, label: '已掌握', color: '#389e0d', bg: '#f6ffed' },
]
const masteryInfo = (m: number) => MASTERY.find(x => x.value === m) || MASTERY[0]

export default function Language() {
  const { code } = useParams<{ code: string }>()
  const lang = code || ''
  const { languages } = useLanguages()
  const langItem = languages.find(l => l.code === lang)
  const emoji = langItem?.emoji || '🌐'
  const title = langItem ? langItem.name : lang
  const today = dayjs()

  const [tab, setTab] = useState('home')
  const [checkins, setCheckins] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [cForm, setCForm] = useState({ date: today.format('YYYY-MM-DD'), duration_minutes: '', content: '', apps_used: '' })
  const [gForm, setGForm] = useState({ name: '', target_date: '', progress_notes: '' })
  const [rForm, setRForm] = useState({ title: '', url: '', resource_type: '网站', notes: '' })

  // 语法
  const [grammar, setGrammar] = useState<any[]>([])
  const [showGrammarModal, setShowGrammarModal] = useState(false)
  const [grForm, setGrForm] = useState<any>({ title: '', explanation: '', example: '', mastery: 0 })
  const [editingGrammar, setEditingGrammar] = useState<any>(null)

  // 单词
  const [vocab, setVocab] = useState<any[]>([])
  const [showVocabModal, setShowVocabModal] = useState(false)
  const [vForm, setVForm] = useState<any>({ word: '', reading: '', meaning: '', example: '', mastery: 0 })
  const [editingVocab, setEditingVocab] = useState<any>(null)

  // 句子
  const [sentences, setSentences] = useState<any[]>([])
  const [showSentenceModal, setShowSentenceModal] = useState(false)
  const [sForm, setSForm] = useState<any>({ sentence: '', meaning: '', notes: '', mastery: 0 })
  const [editingSentence, setEditingSentence] = useState<any>(null)

  // 批量导入
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchText, setBatchText] = useState('')
  const [importing, setImporting] = useState(false)

  const load = () => {
    getCheckins(lang, { year: today.year(), month: today.month() + 1 }).then(setCheckins)
    getStudyGoals(lang).then(setGoals)
    getResources(lang).then(setResources)
    getGrammar(lang).then(setGrammar)
    getVocab(lang).then(setVocab)
    getSentences(lang).then(setSentences)
  }
  useEffect(() => { load() }, [lang])

  const totalMinutes = checkins.reduce((s, c) => s + c.duration_minutes, 0)
  const streak = (() => {
    let count = 0
    let d = today
    const set = new Set(checkins.map(c => c.date))
    while (set.has(d.format('YYYY-MM-DD'))) { count++; d = d.subtract(1, 'day') }
    return count
  })()

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = today.subtract(6 - i, 'day')
    const key = d.format('YYYY-MM-DD')
    const c = checkins.find(x => x.date === key)
    return { date: d.format('M/D'), minutes: c?.duration_minutes || 0 }
  })

  const daysInMonth = today.daysInMonth()
  const startDow = today.startOf('month').day()
  const checkinDates = new Set(checkins.map(c => c.date))

  const handleSaveCheckin = async () => {
    await upsertCheckin({ ...cForm, language: lang, duration_minutes: Number(cForm.duration_minutes) })
    setShowCheckinModal(false); load()
  }
  const handleSaveGoal = async () => {
    await createStudyGoal({ ...gForm, language: lang, target_date: gForm.target_date || null })
    setShowGoalModal(false); load()
  }
  const handleSaveResource = async () => {
    await createResource({ ...rForm, language: lang })
    setShowResourceModal(false); load()
  }

  const handleSaveGrammar = async () => {
    if (!grForm.title.trim()) return
    const payload = { ...grForm, language: lang, mastery: Number(grForm.mastery) }
    editingGrammar ? await updateGrammar(editingGrammar.id, payload) : await createGrammar(payload)
    setShowGrammarModal(false); setEditingGrammar(null); load()
  }
  const handleSaveVocab = async () => {
    if (!vForm.word.trim()) return
    const payload = { ...vForm, language: lang, mastery: Number(vForm.mastery) }
    editingVocab ? await updateVocab(editingVocab.id, payload) : await createVocab(payload)
    setShowVocabModal(false); setEditingVocab(null); load()
  }
  // 点掌握度徽章快速循环切换
  const cycleGrammarMastery = async (g: any) => {
    await updateGrammar(g.id, { ...g, mastery: (g.mastery + 1) % 3 }); load()
  }
  const cycleVocabMastery = async (v: any) => {
    await updateVocab(v.id, { ...v, mastery: (v.mastery + 1) % 3 }); load()
  }
  const handleSaveSentence = async () => {
    if (!sForm.sentence.trim()) return
    const payload = { ...sForm, language: lang, mastery: Number(sForm.mastery) }
    editingSentence ? await updateSentence(editingSentence.id, payload) : await createSentence(payload)
    setShowSentenceModal(false); setEditingSentence(null); load()
  }
  const cycleSentenceMastery = async (s: any) => {
    await updateSentence(s.id, { ...s, mastery: (s.mastery + 1) % 3 }); load()
  }

  // 批量导入：每行一条，字段用逗号/制表符分隔
  const BATCH_CONFIG: Record<string, { fields: string[]; hint: string; example: string; create: (d: any) => Promise<any> }> = {
    grammar: {
      fields: ['title', 'explanation', 'example'],
      hint: '每行一条，格式：语法点，说明，例句（说明和例句可省略）',
      example: '～ながら，一边…一边…，音楽を聞きながら勉強する\n～たい，想要做…，日本へ行きたい',
      create: createGrammar,
    },
    vocab: {
      fields: ['word', 'reading', 'meaning', 'example'],
      hint: '每行一条，格式：单词，读音，释义，例句（读音/例句可省略）',
      example: '勉強，べんきょう，学习\n水，みず，水\n図書館，としょかん，图书馆',
      create: createVocab,
    },
    sentence: {
      fields: ['sentence', 'meaning', 'notes'],
      hint: '每行一条，格式：句子，中文意思，备注（意思和备注可省略）',
      example: '明日は雨が降るかもしれません，明天可能会下雨，かもしれません=也许\nお元気ですか，你好吗，寒暄语',
      create: createSentence,
    },
  }
  const parseBatch = () => {
    const cfg = BATCH_CONFIG[tab]
    if (!cfg) return []
    return batchText.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split(/[,，\t]/).map(s => s.trim())
      const obj: any = { language: lang, mastery: 0 }
      cfg.fields.forEach((f, i) => { obj[f] = parts[i] || '' })
      return obj
    }).filter(o => o[BATCH_CONFIG[tab].fields[0]])  // 第一字段必填
  }
  const handleBatchImport = async () => {
    const cfg = BATCH_CONFIG[tab]
    const rows = parseBatch()
    if (!rows.length) return
    setImporting(true)
    for (const r of rows) { await cfg.create(r) }
    setImporting(false)
    setShowBatchModal(false); setBatchText(''); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{emoji} {title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'home' && <Button onClick={() => { setCForm({ date: today.format('YYYY-MM-DD'), duration_minutes: '', content: '', apps_used: '' }); setShowCheckinModal(true) }}>+ 今日打卡</Button>}
          {tab === 'grammar' && <>
            <Button variant="outline" onClick={() => { setBatchText(''); setShowBatchModal(true) }}>📋 批量导入</Button>
            <Button onClick={() => { setEditingGrammar(null); setGrForm({ title: '', explanation: '', example: '', mastery: 0 }); setShowGrammarModal(true) }}>+ 添加语法</Button>
          </>}
          {tab === 'vocab' && <>
            <Button variant="outline" onClick={() => { setBatchText(''); setShowBatchModal(true) }}>📋 批量导入</Button>
            <Button onClick={() => { setEditingVocab(null); setVForm({ word: '', reading: '', meaning: '', example: '', mastery: 0 }); setShowVocabModal(true) }}>+ 添加单词</Button>
          </>}
          {tab === 'sentence' && <>
            <Button variant="outline" onClick={() => { setBatchText(''); setShowBatchModal(true) }}>📋 批量导入</Button>
            <Button onClick={() => { setEditingSentence(null); setSForm({ sentence: '', meaning: '', notes: '', mastery: 0 }); setShowSentenceModal(true) }}>+ 添加句子</Button>
          </>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #eee' }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: tab === t.key ? '#6c4fa3' : '#999',
            borderBottom: `2.5px solid ${tab === t.key ? '#6c4fa3' : 'transparent'}`,
            marginBottom: -1,
          }}>{t.icon} {t.label}</div>
        ))}
      </div>

      {/* ───── 首页 ───── */}
      {tab === 'home' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
            <StatCard label="连续打卡" value={streak} unit="天" sub={`本月累计 ${checkins.length} 天`} />
            <StatCard label="本月学习时长" value={(totalMinutes / 60).toFixed(1)} unit="h" sub={`日均 ${checkins.length ? Math.round(totalMinutes / today.date()) : 0} 分钟`} />
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(108,79,163,.08)', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>学习目标</div>
              {goals[0] ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#6c4fa3' }}>{goals[0].name}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    {goals[0].target_date ? `距考试 ${dayjs(goals[0].target_date).diff(today, 'day')} 天` : '目标日期未设置'}
                  </div>
                </>
              ) : <div style={{ fontSize: 13, color: '#aaa' }}>暂无目标 <span onClick={() => setShowGoalModal(true)} style={{ color: '#6c4fa3', cursor: 'pointer' }}>+ 设置</span></div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <CardTitle>本月打卡日历 · {today.format('M月')}</CardTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {['日','一','二','三','四','五','六'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#aaa' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = today.startOf('month').add(i, 'day')
                  const key = d.format('YYYY-MM-DD')
                  const isToday = key === today.format('YYYY-MM-DD')
                  const isDone = checkinDates.has(key)
                  return (
                    <div key={key} style={{
                      aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                      background: isDone ? '#6c4fa3' : isToday ? 'transparent' : '#f5f3fa',
                      color: isDone ? '#fff' : isToday ? '#6c4fa3' : '#aaa',
                      border: isToday && !isDone ? '2px solid #6c4fa3' : 'none',
                      fontWeight: isToday ? 700 : 400,
                    }}>{i + 1}</div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <CardTitle>近7天学习时长（分钟）</CardTitle>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#999' }} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#a07fd4" radius={[4, 4, 0, 0]} name="学习时长" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <CardTitle>学习资源收藏</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setRForm({ title: '', url: '', resource_type: '网站', notes: '' }); setShowResourceModal(true) }}>+ 收藏</Button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['标题', '类型', '备注', '链接', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {resources.map(r => (
                    <tr key={r.id}>
                      <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{r.title}</td>
                      <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}><Badge variant="purple">{r.resource_type}</Badge></td>
                      <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{r.notes || '—'}</td>
                      <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6c4fa3', fontSize: 12 }}>打开 ↗</a> : '—'}
                      </td>
                      <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        <span onClick={async () => { await deleteResource(r.id); load() }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>暂无资源</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}

      {/* ───── 语法 ───── */}
      {tab === 'grammar' && (
        <Card>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: '#999' }}>
            <span>共 {grammar.length} 条</span>
            {MASTERY.map(m => <span key={m.value}>{m.label} {grammar.filter(g => g.mastery === m.value).length}</span>)}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['语法点', '说明', '例句', '掌握度', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {grammar.map(g => {
                const mi = masteryInfo(g.mastery)
                return (
                  <tr key={g.id}>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, whiteSpace: 'nowrap' }}>{g.title}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>{g.explanation || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontStyle: 'italic' }}>{g.example || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={() => cycleGrammarMastery(g)} style={{ cursor: 'pointer', fontSize: 11, padding: '3px 10px', borderRadius: 99, color: mi.color, background: mi.bg }}>{mi.label}</span>
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                      <span onClick={() => { setEditingGrammar(g); setGrForm({ title: g.title, explanation: g.explanation || '', example: g.example || '', mastery: g.mastery }); setShowGrammarModal(true) }} style={{ color: '#6c4fa3', cursor: 'pointer', fontSize: 12, marginRight: 10 }}>编辑</span>
                      <span onClick={async () => { if (confirm('删除该语法？')) { await deleteGrammar(g.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                    </td>
                  </tr>
                )
              })}
              {grammar.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无语法，点右上角添加</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* ───── 单词 ───── */}
      {tab === 'vocab' && (
        <Card>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: '#999' }}>
            <span>共 {vocab.length} 个</span>
            {MASTERY.map(m => <span key={m.value}>{m.label} {vocab.filter(v => v.mastery === m.value).length}</span>)}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['单词', '读音', '释义', '例句', '掌握度', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {vocab.map(v => {
                const mi = masteryInfo(v.mastery)
                return (
                  <tr key={v.id}>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, whiteSpace: 'nowrap' }}>{v.word}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{v.reading || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>{v.meaning || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontStyle: 'italic' }}>{v.example || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={() => cycleVocabMastery(v)} style={{ cursor: 'pointer', fontSize: 11, padding: '3px 10px', borderRadius: 99, color: mi.color, background: mi.bg }}>{mi.label}</span>
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                      <span onClick={() => { setEditingVocab(v); setVForm({ word: v.word, reading: v.reading || '', meaning: v.meaning || '', example: v.example || '', mastery: v.mastery }); setShowVocabModal(true) }} style={{ color: '#6c4fa3', cursor: 'pointer', fontSize: 12, marginRight: 10 }}>编辑</span>
                      <span onClick={async () => { if (confirm('删除该单词？')) { await deleteVocab(v.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                    </td>
                  </tr>
                )
              })}
              {vocab.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无单词，点右上角添加</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* ───── 句子 ───── */}
      {tab === 'sentence' && (
        <Card>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: '#999' }}>
            <span>共 {sentences.length} 句</span>
            {MASTERY.map(m => <span key={m.value}>{m.label} {sentences.filter(s => s.mastery === m.value).length}</span>)}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['句子', '中文意思', '备注笔记', '掌握度', '操作'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', borderBottom: '1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {sentences.map(s => {
                const mi = masteryInfo(s.mastery)
                return (
                  <tr key={s.id}>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{s.sentence}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>{s.meaning || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', color: '#888' }}>{s.notes || '—'}</td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      <span onClick={() => cycleSentenceMastery(s)} style={{ cursor: 'pointer', fontSize: 11, padding: '3px 10px', borderRadius: 99, color: mi.color, background: mi.bg }}>{mi.label}</span>
                    </td>
                    <td style={{ padding: '10px 10px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                      <span onClick={() => { setEditingSentence(s); setSForm({ sentence: s.sentence, meaning: s.meaning || '', notes: s.notes || '', mastery: s.mastery }); setShowSentenceModal(true) }} style={{ color: '#6c4fa3', cursor: 'pointer', fontSize: 12, marginRight: 10 }}>编辑</span>
                      <span onClick={async () => { if (confirm('删除该句子？')) { await deleteSentence(s.id); load() } }} style={{ color: '#e63946', cursor: 'pointer', fontSize: 12 }}>删除</span>
                    </td>
                  </tr>
                )
              })}
              {sentences.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>暂无句子，点右上角添加</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {showCheckinModal && (
        <Modal title="今日打卡" onClose={() => setShowCheckinModal(false)}>
          <FormRow label="日期"><Input type="date" value={cForm.date} onChange={v => setCForm(f => ({ ...f, date: v }))} /></FormRow>
          <FormRow label="学习时长（分钟）*"><Input type="number" value={cForm.duration_minutes} onChange={v => setCForm(f => ({ ...f, duration_minutes: v }))} placeholder="如：60" /></FormRow>
          <FormRow label="学习内容"><Textarea value={cForm.content} onChange={v => setCForm(f => ({ ...f, content: v }))} rows={3} placeholder="今天学了什么…" /></FormRow>
          <FormRow label="使用的 App"><Input value={cForm.apps_used} onChange={v => setCForm(f => ({ ...f, apps_used: v }))} placeholder="如：Anki, NHK Web（逗号分隔）" /></FormRow>
          <ModalFooter onClose={() => setShowCheckinModal(false)} onSubmit={handleSaveCheckin} />
        </Modal>
      )}

      {showGoalModal && (
        <Modal title="设置学习目标" onClose={() => setShowGoalModal(false)}>
          <FormRow label="目标名称 *"><Input value={gForm.name} onChange={v => setGForm(f => ({ ...f, name: v }))} placeholder="如：JLPT N1、英语六级" /></FormRow>
          <FormRow label="目标日期"><Input type="date" value={gForm.target_date} onChange={v => setGForm(f => ({ ...f, target_date: v }))} /></FormRow>
          <FormRow label="当前进度备注"><Textarea value={gForm.progress_notes} onChange={v => setGForm(f => ({ ...f, progress_notes: v }))} rows={3} /></FormRow>
          <ModalFooter onClose={() => setShowGoalModal(false)} onSubmit={handleSaveGoal} />
        </Modal>
      )}

      {showResourceModal && (
        <Modal title="收藏学习资源" onClose={() => setShowResourceModal(false)}>
          <FormRow label="标题 *"><Input value={rForm.title} onChange={v => setRForm(f => ({ ...f, title: v }))} /></FormRow>
          <FormRow label="类型"><Select value={rForm.resource_type} onChange={v => setRForm(f => ({ ...f, resource_type: v }))} options={RESOURCE_TYPES.map(t => ({ label: t, value: t }))} /></FormRow>
          <FormRow label="链接"><Input value={rForm.url} onChange={v => setRForm(f => ({ ...f, url: v }))} placeholder="https://..." /></FormRow>
          <FormRow label="备注"><Input value={rForm.notes} onChange={v => setRForm(f => ({ ...f, notes: v }))} /></FormRow>
          <ModalFooter onClose={() => setShowResourceModal(false)} onSubmit={handleSaveResource} />
        </Modal>
      )}

      {showGrammarModal && (
        <Modal title={editingGrammar ? '编辑语法' : '添加语法'} onClose={() => { setShowGrammarModal(false); setEditingGrammar(null) }}>
          <FormRow label="语法点 *"><Input value={grForm.title} onChange={v => setGrForm((f: any) => ({ ...f, title: v }))} placeholder="如：～ながら（一边…一边…）" /></FormRow>
          <FormRow label="说明"><Textarea value={grForm.explanation} onChange={v => setGrForm((f: any) => ({ ...f, explanation: v }))} rows={3} placeholder="用法、接续、注意点…" /></FormRow>
          <FormRow label="例句"><Textarea value={grForm.example} onChange={v => setGrForm((f: any) => ({ ...f, example: v }))} rows={2} placeholder="音楽を聞きながら勉強する。" /></FormRow>
          <FormRow label="掌握度"><Select value={String(grForm.mastery)} onChange={v => setGrForm((f: any) => ({ ...f, mastery: Number(v) }))} options={MASTERY.map(m => ({ label: m.label, value: String(m.value) }))} /></FormRow>
          <ModalFooter onClose={() => { setShowGrammarModal(false); setEditingGrammar(null) }} onSubmit={handleSaveGrammar} />
        </Modal>
      )}

      {showVocabModal && (
        <Modal title={editingVocab ? '编辑单词' : '添加单词'} onClose={() => { setShowVocabModal(false); setEditingVocab(null) }}>
          <FormRow label="单词 *"><Input value={vForm.word} onChange={v => setVForm((f: any) => ({ ...f, word: v }))} placeholder="如：勉強" /></FormRow>
          <FormRow label="读音"><Input value={vForm.reading} onChange={v => setVForm((f: any) => ({ ...f, reading: v }))} placeholder="假名/拼音，如：べんきょう" /></FormRow>
          <FormRow label="释义"><Input value={vForm.meaning} onChange={v => setVForm((f: any) => ({ ...f, meaning: v }))} placeholder="学习" /></FormRow>
          <FormRow label="例句"><Textarea value={vForm.example} onChange={v => setVForm((f: any) => ({ ...f, example: v }))} rows={2} placeholder="选填" /></FormRow>
          <FormRow label="掌握度"><Select value={String(vForm.mastery)} onChange={v => setVForm((f: any) => ({ ...f, mastery: Number(v) }))} options={MASTERY.map(m => ({ label: m.label, value: String(m.value) }))} /></FormRow>
          <ModalFooter onClose={() => { setShowVocabModal(false); setEditingVocab(null) }} onSubmit={handleSaveVocab} />
        </Modal>
      )}

      {showSentenceModal && (
        <Modal title={editingSentence ? '编辑句子' : '添加句子'} onClose={() => { setShowSentenceModal(false); setEditingSentence(null) }}>
          <FormRow label="句子 *"><Textarea value={sForm.sentence} onChange={v => setSForm((f: any) => ({ ...f, sentence: v }))} rows={2} placeholder="如：明日は雨が降るかもしれません。" /></FormRow>
          <FormRow label="中文意思"><Textarea value={sForm.meaning} onChange={v => setSForm((f: any) => ({ ...f, meaning: v }))} rows={2} placeholder="明天可能会下雨。" /></FormRow>
          <FormRow label="备注笔记"><Textarea value={sForm.notes} onChange={v => setSForm((f: any) => ({ ...f, notes: v }))} rows={2} placeholder="语法点、生词、出处等（选填）" /></FormRow>
          <FormRow label="掌握度"><Select value={String(sForm.mastery)} onChange={v => setSForm((f: any) => ({ ...f, mastery: Number(v) }))} options={MASTERY.map(m => ({ label: m.label, value: String(m.value) }))} /></FormRow>
          <ModalFooter onClose={() => { setShowSentenceModal(false); setEditingSentence(null) }} onSubmit={handleSaveSentence} />
        </Modal>
      )}

      {showBatchModal && (() => {
        const cfg = BATCH_CONFIG[tab]
        const count = parseBatch().length
        return (
          <Modal title={`批量导入 · ${TABS.find(t => t.key === tab)?.label}`} onClose={() => setShowBatchModal(false)}>
            <div style={{ fontSize: 12.5, color: '#888', marginBottom: 6, lineHeight: 1.6 }}>{cfg.hint}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
              支持中文逗号「，」、英文逗号「,」或制表符（从 Excel 直接复制粘贴也可以）。
            </div>
            <Textarea value={batchText} onChange={setBatchText} rows={9} placeholder={cfg.example} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: count ? '#6c4fa3' : '#aaa' }}>识别到 {count} 条</span>
              <span onClick={() => setBatchText(cfg.example)} style={{ fontSize: 12, color: '#6c4fa3', cursor: 'pointer' }}>填入示例</span>
            </div>
            <ModalFooter
              onClose={() => setShowBatchModal(false)}
              onSubmit={handleBatchImport}
              submitLabel={importing ? '导入中…' : `导入 ${count} 条`}
            />
          </Modal>
        )
      })()}
    </div>
  )
}
