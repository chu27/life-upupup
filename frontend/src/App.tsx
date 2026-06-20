import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Books from './pages/Books'
import Documentaries from './pages/Documentaries'
import Body from './pages/Body'
import Diet from './pages/Diet'
import Grocery from './pages/Grocery'
import FinanceTransactions from './pages/FinanceTransactions'
import FinanceAssets from './pages/FinanceAssets'
import Investment from './pages/Investment'
import Stock from './pages/Stock'
import Language from './pages/Language'
import { getLanguageList } from './api'

export type LangItem = { id: number; name: string; code: string; emoji: string }

export const LanguageContext = createContext<{
  languages: LangItem[]
  reload: () => void
}>({ languages: [], reload: () => {} })

export function useLanguages() { return useContext(LanguageContext) }

export default function App() {
  const [languages, setLanguages] = useState<LangItem[]>([])
  const reload = () => getLanguageList().then(setLanguages)
  useEffect(() => { reload() }, [])

  return (
    <LanguageContext.Provider value={{ languages, reload }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks/today" element={<Tasks period="today" />} />
            <Route path="/tasks/week" element={<Tasks period="week" />} />
            <Route path="/tasks/month" element={<Tasks period="month" />} />
            <Route path="/tasks/year" element={<Tasks period="year" />} />
            <Route path="/books" element={<Books />} />
            <Route path="/documentaries" element={<Documentaries />} />
            <Route path="/body" element={<Body />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/grocery" element={<Grocery />} />
            <Route path="/finance/transactions" element={<FinanceTransactions />} />
            <Route path="/finance/assets" element={<FinanceAssets />} />
            <Route path="/finance/investment" element={<Investment />} />
            <Route path="/finance/investment/us" element={<Investment category="美股" />} />
            <Route path="/finance/investment/jp" element={<Investment category="日股" />} />
            <Route path="/finance/investment/cn" element={<Investment category="A股" />} />
            <Route path="/finance/investment/fund" element={<Investment category="基金" />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/language/:code" element={<Language />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageContext.Provider>
  )
}
