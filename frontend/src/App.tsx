import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/books" element={<Books />} />
          <Route path="/documentaries" element={<Documentaries />} />
          <Route path="/body" element={<Body />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/japanese" element={<Language lang="japanese" />} />
          <Route path="/english" element={<Language lang="english" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
