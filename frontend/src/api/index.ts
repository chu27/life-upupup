import api from './client'

// ── Dashboard ──────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard/today').then(r => r.data)

// ── Books ──────────────────────────────────────────────
export const getBooks = (status?: string) =>
  api.get('/books', { params: status ? { status } : {} }).then(r => r.data)
export const createBook = (data: any) => api.post('/books', data).then(r => r.data)
export const updateBook = (id: number, data: any) => api.put(`/books/${id}`, data).then(r => r.data)
export const deleteBook = (id: number) => api.delete(`/books/${id}`)

// ── Documentaries ──────────────────────────────────────
export const getDocs = (status?: string) =>
  api.get('/documentaries', { params: status ? { status } : {} }).then(r => r.data)
export const createDoc = (data: any) => api.post('/documentaries', data).then(r => r.data)
export const updateDoc = (id: number, data: any) => api.put(`/documentaries/${id}`, data).then(r => r.data)
export const deleteDoc = (id: number) => api.delete(`/documentaries/${id}`)

// ── Body ───────────────────────────────────────────────
export const getBodyRecords = () => api.get('/body').then(r => r.data)
export const getLatestBody = () => api.get('/body/latest').then(r => r.data)
export const upsertBody = (data: any) => api.post('/body', data).then(r => r.data)
export const deleteBody = (id: number) => api.delete(`/body/${id}`)

// ── Finance ────────────────────────────────────────────
export const getTransactions = (params?: any) => api.get('/finance/transactions', { params }).then(r => r.data)
export const createTransaction = (data: any) => api.post('/finance/transactions', data).then(r => r.data)
export const deleteTransaction = (id: number) => api.delete(`/finance/transactions/${id}`)
export const getAssets = () => api.get('/finance/assets').then(r => r.data)
export const createAsset = (data: any) => api.post('/finance/assets', data).then(r => r.data)
export const updateAsset = (id: number, data: any) => api.put(`/finance/assets/${id}`, data).then(r => r.data)
export const deleteAsset = (id: number) => api.delete(`/finance/assets/${id}`)
export const getBudgets = (year: number, month: number) => api.get('/finance/budgets', { params: { year, month } }).then(r => r.data)
export const upsertBudget = (data: any) => api.post('/finance/budgets', data).then(r => r.data)
export const getGoals = () => api.get('/finance/goals').then(r => r.data)
export const createGoal = (data: any) => api.post('/finance/goals', data).then(r => r.data)
export const updateGoal = (id: number, data: any) => api.put(`/finance/goals/${id}`, data).then(r => r.data)
export const getExchangeRates = () => api.get('/finance/exchange-rates').then(r => r.data)

// ── Stock ──────────────────────────────────────────────
export const getStockQuote = (symbol: string) => api.get(`/stock/quote/${symbol}`).then(r => r.data)
export const getHoldings = () => api.get('/stock/holdings').then(r => r.data)
export const createHolding = (data: any) => api.post('/stock/holdings', data).then(r => r.data)
export const getWatchlist = () => api.get('/stock/watchlist').then(r => r.data)
export const addWatchlist = (data: any) => api.post('/stock/watchlist', data).then(r => r.data)
export const removeWatchlist = (id: number) => api.delete(`/stock/watchlist/${id}`)
export const getStockNotes = () => api.get('/stock/notes').then(r => r.data)
export const createStockNote = (data: any) => api.post('/stock/notes', data).then(r => r.data)
export const getPriceRecords = (symbol: string) => api.get(`/stock/price-records/${symbol}`).then(r => r.data)

// ── Language Management ────────────────────────────────
export const getLanguageList = () => api.get('/language/list').then(r => r.data)
export const addLanguage = (data: any) => api.post('/language/list', data).then(r => r.data)
export const deleteLanguage = (id: number) => api.delete(`/language/list/${id}`)

// ── Language ───────────────────────────────────────────
export const getCheckins = (language: string, params?: any) =>
  api.get(`/language/${language}/checkins`, { params }).then(r => r.data)
export const upsertCheckin = (data: any) => api.post('/language/checkins', data).then(r => r.data)
export const getStudyGoals = (language: string) => api.get(`/language/${language}/goals`).then(r => r.data)
export const createStudyGoal = (data: any) => api.post('/language/goals', data).then(r => r.data)
export const getResources = (language: string) => api.get(`/language/${language}/resources`).then(r => r.data)
export const createResource = (data: any) => api.post('/language/resources', data).then(r => r.data)
export const deleteResource = (id: number) => api.delete(`/language/resources/${id}`)

// ── Diet ───────────────────────────────────────────────
export const getMeals = (date?: string) => api.get('/diet/meals', { params: date ? { date } : {} }).then(r => r.data)
export const createMeal = (data: any) => api.post('/diet/meals', data).then(r => r.data)
export const updateMeal = (id: number, data: any) => api.put(`/diet/meals/${id}`, data).then(r => r.data)
export const deleteMeal = (id: number) => api.delete(`/diet/meals/${id}`)
export const getWater = (date: string) => api.get(`/diet/water/${date}`).then(r => r.data)
export const getAllWater = () => api.get('/diet/water').then(r => r.data)
export const addCup = (date: string) => api.post('/diet/water/add-cup', null, { params: { date } }).then(r => r.data)
export const removeCup = (date: string) => api.post('/diet/water/remove-cup', null, { params: { date } }).then(r => r.data)
export const getSupplements = (date?: string) => api.get('/diet/supplements', { params: date ? { date } : {} }).then(r => r.data)
export const createSupplement = (data: any) => api.post('/diet/supplements', data).then(r => r.data)
export const deleteSupplement = (id: number) => api.delete(`/diet/supplements/${id}`)

// ── Tasks ──────────────────────────────────────────────
export const getTasks = (period: string, dateKey: string) =>
  api.get('/tasks', { params: { period, date_key: dateKey } }).then(r => r.data)
export const createTask = (data: any) => api.post('/tasks', data).then(r => r.data)
export const updateTask = (id: number, data: any) => api.put(`/tasks/${id}`, data).then(r => r.data)
export const toggleTask = (id: number) => api.put(`/tasks/${id}/toggle`).then(r => r.data)
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`)
