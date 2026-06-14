import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Books from './pages/Books'
import Documentaries from './pages/Documentaries'
import Body from './pages/Body'
import Diet from './pages/Diet'
import Finance from './pages/Finance'
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
            <Route path="/finance" element={<Finance />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/language/:code" element={<Language />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageContext.Provider>
  )
}
