import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createDemandForecast,
  createProductionPlan,
  createPurchaseOrder,
  createPurchaseOrderLine,
  createStockTransaction,
  createItem,
  fetchDemandForecasts,
  fetchItems,
  fetchInventories,
  fetchMe,
  fetchMrpResults,
  fetchProductionPlans,
  fetchPurchaseOrderLines,
  fetchPurchaseOrders,
  fetchStockTransactions,
  fetchWarehouses,
  login,
  register,
  runMrpCalc,
} from './api'
import type {
  DemandForecast,
  Inventory,
  Item,
  MrpResult,
  MeResponse,
  ProductionPlan,
  PurchaseOrder,
  PurchaseOrderLine,
  StockTransaction,
  Warehouse,
} from './api'
import { AlertBar } from './components/AlertBar'
import { PaginationControls } from './components/PaginationControls'
import { SearchFilter } from './components/SearchFilter'
import './App.css'

type MenuKey =
  | 'dashboard'
  | 'items'
  | 'bom'
  | 'leadtime'
  | 'forecast'
  | 'production'
  | 'bomCalc'
  | 'mrp'
  | 'poPlan'
  | 'po'
  | 'inventory'
  | 'stock'

function App() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('scm_token')
  })
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')
  const [items, setItems] = useState<Item[]>([])
  const [itemsFilter, setItemsFilter] = useState({ codeOrName: '' })
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsPageSize] = useState(10)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [globalMessage, setGlobalMessage] = useState<string | null>(null)
  const [globalMessageType, setGlobalMessageType] = useState<'info' | 'error'>('info')

  // 수요예측
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [forecastsLoading, setForecastsLoading] = useState(false)
  // 생산계획
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([])
  const [productionPlansLoading, setProductionPlansLoading] = useState(false)
  // 재고/입출고
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [inventoriesLoading, setInventoriesLoading] = useState(false)
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([])
  const [stockTransactionsLoading, setStockTransactionsLoading] = useState(false)
  // MRP
  const [mrpResults, setMrpResults] = useState<MrpResult[]>([])
  const [mrpResultsLoading, setMrpResultsLoading] = useState(false)
  // 발주
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(false)
  const [purchaseOrderLines, setPurchaseOrderLines] = useState<PurchaseOrderLine[]>([])
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) {
      setCurrentUser(null)
      return
    }

    let cancelled = false
    setIsLoadingAuth(true)
    fetchMe(token)
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(user)
          setAuthError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUser(null)
          setToken(null)
          window.localStorage.removeItem('scm_token')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAuth(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    if (!email || !password) {
      setAuthError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }

    try {
      setIsLoadingAuth(true)
      const accessToken = await login(email, password)
      setToken(accessToken)
      window.localStorage.setItem('scm_token', accessToken)
      setAuthError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setAuthError(message)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setCurrentUser(null)
    window.localStorage.removeItem('scm_token')
  }

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('reg_email') || '').trim()
    const name = String(fd.get('reg_name') || '').trim()
    const password = String(fd.get('reg_password') || '')
    if (!email || !name || !password) {
      setAuthError('이메일, 이름, 비밀번호를 모두 입력해 주세요.')
      return
    }
    if (password.length < 6) {
      setAuthError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setAuthError(null)
    try {
      setIsLoadingAuth(true)
      await register({ email, name, password })
      const accessToken = await login(email, password)
      setToken(accessToken)
      window.localStorage.setItem('scm_token', accessToken)
      setShowSignup(false)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const pageMeta = useMemo(() => {
    switch (activeMenu) {
      case 'items':
        return {
          title: '품목 관리',
          path: ['기초 데이터', '품목 관리'],
          description: '제품/원자재 마스터를 관리하는 화면입니다. 엑셀 업로드, 단위/안전재고/기본창고 등을 여기서 설정하게 됩니다.',
        }
      case 'bom':
        return {
          title: 'BOM 관리',
          path: ['기초 데이터', 'BOM 관리'],
          description: '제품별 배합비(BOM)를 등록·수정하는 화면입니다. 상위 제품 1단위당 필요한 자재 구성을 정의합니다.',
        }
      case 'leadtime':
        return {
          title: '리드타임/거래처',
          path: ['기초 데이터', '리드타임/거래처'],
          description: '품목·공급사별 리드타임과 최소 발주수량 등을 등록하는 화면입니다.',
        }
      case 'forecast':
        return {
          title: '수요예측',
          path: ['수요/생산', '수요예측'],
          description: '제품/기간별 수요예측 수량을 입력하고, 과거 실적과 비교하는 화면입니다.',
        }
      case 'production':
        return {
          title: '생산계획',
          path: ['수요/생산', '생산계획'],
          description: '수요예측을 기반으로 제품별 생산계획을 수립·확정하는 화면입니다.',
        }
      case 'bomCalc':
        return {
          title: '소요량(BOM) 계산',
          path: ['자재/MRP', '소요량(BOM) 계산'],
          description: '확정된 생산계획을 BOM으로 전개하여 자재 소요량을 계산하는 화면입니다.',
        }
      case 'mrp':
        return {
          title: 'MRP 결과',
          path: ['자재/MRP', 'MRP 결과'],
          description: '재고/리드타임/안전재고를 반영한 자재 부족 수량과 발주 제안을 확인하는 화면입니다.',
        }
      case 'poPlan':
        return {
          title: '발주 계획',
          path: ['발주/구매', '발주 계획'],
          description: 'MRP 결과를 기반으로 발주 대상 품목과 수량을 검토하는 화면입니다.',
        }
      case 'po':
        return {
          title: '발주서 관리',
          path: ['발주/구매', '발주서 관리'],
          description: '공급사별 발주서를 생성하고, 상태/납기/수량을 관리하는 화면입니다.',
        }
      case 'inventory':
        return {
          title: '재고 현황',
          path: ['재고', '재고 현황'],
          description: '품목/창고별 현재 재고와 안전재고 대비 상태를 조회하는 화면입니다.',
        }
      case 'stock':
        return {
          title: '입출고 관리',
          path: ['재고', '입출고 관리'],
          description: '입고·출고·조정 등 재고 변동 작업을 처리하고 이력을 조회하는 화면입니다.',
        }
      default:
        return {
          title: '대시보드',
          path: ['메인', '대시보드'],
          description:
            '수요예측, 생산계획, 재고, 발주 정보를 한 눈에 모아보는 홈 화면입니다. 지금은 뼈대 단계이며 이후 실제 데이터와 그래프를 연결합니다.',
        }
    }
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'items') return
    setItemsLoading(true)
    fetchItems()
      .then((data) => setItems(data))
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('품목 목록을 불러오지 못했습니다.')
      })
      .finally(() => setItemsLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'forecast') return
    setForecastsLoading(true)
    Promise.all([fetchItems(), fetchDemandForecasts()])
      .then(([itemsData, forecastsData]) => {
        setItems(itemsData)
        setForecasts(forecastsData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('수요예측 목록을 불러오지 못했습니다.')
      })
      .finally(() => setForecastsLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'production') return
    setProductionPlansLoading(true)
    Promise.all([fetchItems(), fetchProductionPlans()])
      .then(([itemsData, plansData]) => {
        setItems(itemsData)
        setProductionPlans(plansData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('생산계획 목록을 불러오지 못했습니다.')
      })
      .finally(() => setProductionPlansLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'inventory') return
    setInventoriesLoading(true)
    Promise.all([fetchItems(), fetchWarehouses(), fetchInventories()])
      .then(([itemsData, whData, invData]) => {
        setItems(itemsData)
        setWarehouses(whData)
        setInventories(invData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('재고 목록을 불러오지 못했습니다.')
      })
      .finally(() => setInventoriesLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'stock') return
    setStockTransactionsLoading(true)
    Promise.all([fetchItems(), fetchWarehouses(), fetchStockTransactions()])
      .then(([itemsData, whData, trxData]) => {
        setItems(itemsData)
        setWarehouses(whData)
        setStockTransactions(trxData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('입출고 이력을 불러오지 못했습니다.')
      })
      .finally(() => setStockTransactionsLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'mrp') return
    setMrpResultsLoading(true)
    Promise.all([fetchItems(), fetchMrpResults()])
      .then(([itemsData, mrpData]) => {
        setItems(itemsData)
        setMrpResults(mrpData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('MRP 결과를 불러오지 못했습니다.')
      })
      .finally(() => setMrpResultsLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (activeMenu !== 'po' && activeMenu !== 'poPlan') return
    setPurchaseOrdersLoading(true)
    Promise.all([fetchItems(), fetchWarehouses(), fetchPurchaseOrders()])
      .then(([itemsData, whData, poData]) => {
        setItems(itemsData)
        setWarehouses(whData)
        setPurchaseOrders(poData)
      })
      .catch(() => {
        setGlobalMessageType('error')
        setGlobalMessage('발주 목록을 불러오지 못했습니다.')
      })
      .finally(() => setPurchaseOrdersLoading(false))
  }, [activeMenu])

  useEffect(() => {
    if (selectedPoId == null) {
      setPurchaseOrderLines([])
      return
    }
    fetchPurchaseOrderLines(selectedPoId)
      .then(setPurchaseOrderLines)
      .catch(() => setPurchaseOrderLines([]))
  }, [selectedPoId])

  const filteredItems = useMemo(() => {
    const keyword = itemsFilter.codeOrName.trim().toLowerCase()
    let data = items
    if (keyword) {
      data = data.filter(
        (i) =>
          i.code.toLowerCase().includes(keyword) ||
          i.name.toLowerCase().includes(keyword),
      )
    }
    return data
  }, [items, itemsFilter])

  const pagedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPageSize
    return filteredItems.slice(start, start + itemsPageSize)
  }, [filteredItems, itemsPage, itemsPageSize])

  const itemsTotalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPageSize))

  const handleCreateItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = String(formData.get('code') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const type = String(formData.get('type') || '').trim()
    const uom = String(formData.get('uom') || '').trim()
    const safetyStock = Number(formData.get('safety_stock_qty') || '0')
    const leadTime = Number(formData.get('lead_time_days') || '0')
    const unitPriceRaw = String(formData.get('unit_price') || '').trim()
    const unit_price =
      unitPriceRaw === '' ? null : Number(unitPriceRaw.replace(/,/g, ''))

    if (!code || !name || !type || !uom) {
      setGlobalMessageType('error')
      setGlobalMessage('코드, 이름, 유형, 단위는 필수입니다.')
      return
    }
    if (Number.isNaN(safetyStock) || Number.isNaN(leadTime) || leadTime < 0) {
      setGlobalMessageType('error')
      setGlobalMessage('안전재고와 리드타임은 숫자(리드타임은 0 이상)여야 합니다.')
      return
    }
    if (unit_price !== null && Number.isNaN(unit_price)) {
      setGlobalMessageType('error')
      setGlobalMessage('단가는 숫자이거나 비워 두세요.')
      return
    }

    try {
      const created = await createItem({
        code,
        name,
        type,
        uom,
        unit_price,
        safety_stock_qty: safetyStock,
        lead_time_days: leadTime,
        is_active: true,
      })
      setItems((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('품목이 추가되었습니다.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '품목 추가에 실패했습니다.'
      setGlobalMessageType('error')
      setGlobalMessage(msg)
    }
  }

  const handleCreateForecast = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const item_id = Number(fd.get('forecast_item_id'))
    const period_start = String(fd.get('period_start') || '').trim()
    const period_end = String(fd.get('period_end') || '').trim()
    const quantity = Number(fd.get('quantity') || 0)
    const method = String(fd.get('method') || '').trim() || undefined
    if (!item_id || !period_start || !period_end || Number.isNaN(quantity)) {
      setGlobalMessageType('error')
      setGlobalMessage('품목, 기간, 수량을 입력해 주세요.')
      return
    }
    try {
      const created = await createDemandForecast({
        item_id,
        period_start,
        period_end,
        quantity,
        method: method || null,
      })
      setForecasts((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('수요예측이 등록되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : '수요예측 등록에 실패했습니다.')
    }
  }

  const handleCreateProductionPlan = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const item_id = Number(fd.get('plan_item_id'))
    const period_start = String(fd.get('plan_period_start') || '').trim()
    const period_end = String(fd.get('plan_period_end') || '').trim()
    const quantity = Number(fd.get('plan_quantity') || 0)
    const status = String(fd.get('plan_status') || 'DRAFT').trim()
    const version = String(fd.get('plan_version') || '').trim() || null
    if (!item_id || !period_start || !period_end || Number.isNaN(quantity)) {
      setGlobalMessageType('error')
      setGlobalMessage('품목, 기간, 수량을 입력해 주세요.')
      return
    }
    try {
      const created = await createProductionPlan({
        item_id,
        period_start,
        period_end,
        quantity,
        status,
        version,
      })
      setProductionPlans((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('생산계획이 등록되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : '생산계획 등록에 실패했습니다.')
    }
  }

  const handleCreateStockTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const item_id = Number(fd.get('trx_item_id'))
    const warehouse_id = Number(fd.get('trx_warehouse_id'))
    const trx_type = String(fd.get('trx_type') || 'IN').trim()
    const qty = Number(fd.get('trx_qty') || 0)
    const reason = String(fd.get('trx_reason') || '').trim() || null
    if (!item_id || !warehouse_id || Number.isNaN(qty) || qty <= 0) {
      setGlobalMessageType('error')
      setGlobalMessage('품목, 창고, 수량(0보다 큼)을 입력해 주세요.')
      return
    }
    if (!['IN', 'OUT', 'ADJUST'].includes(trx_type)) {
      setGlobalMessageType('error')
      setGlobalMessage('구분은 IN/OUT/ADJUST 중 하나여야 합니다.')
      return
    }
    try {
      const created = await createStockTransaction({
        item_id,
        warehouse_id,
        trx_type,
        qty,
        reason,
      })
      setStockTransactions((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('입출고가 등록되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : '입출고 등록에 실패했습니다.')
    }
  }

  const handleRunMrpCalc = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const item_id = Number(fd.get('mrp_item_id'))
    const required_qty = Number(fd.get('mrp_required_qty') || 0)
    const required_date = String(fd.get('mrp_required_date') || '').trim() || null
    if (!item_id || Number.isNaN(required_qty) || required_qty < 0) {
      setGlobalMessageType('error')
      setGlobalMessage('품목과 필요수량(0 이상)을 입력해 주세요.')
      return
    }
    try {
      const created = await runMrpCalc({ item_id, required_qty, required_date })
      setMrpResults((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('MRP 계산이 반영되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : 'MRP 계산에 실패했습니다.')
    }
  }

  const handleCreatePurchaseOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const order_no = String(fd.get('po_order_no') || '').trim()
    const vendor_name = String(fd.get('po_vendor_name') || '').trim()
    const order_date = String(fd.get('po_order_date') || '').trim()
    const status = String(fd.get('po_status') || 'REQUESTED').trim()
    if (!order_no || !vendor_name || !order_date) {
      setGlobalMessageType('error')
      setGlobalMessage('발주번호, 공급사, 발주일을 입력해 주세요.')
      return
    }
    try {
      const created = await createPurchaseOrder({ order_no, vendor_name, order_date, status })
      setPurchaseOrders((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('발주가 등록되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : '발주 등록에 실패했습니다.')
    }
  }

  const handleCreatePurchaseOrderLine = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedPoId == null) {
      setGlobalMessageType('error')
      setGlobalMessage('발주를 먼저 선택해 주세요.')
      return
    }
    const fd = new FormData(e.currentTarget)
    const item_id = Number(fd.get('pol_item_id'))
    const order_qty = Number(fd.get('pol_order_qty') || 0)
    const due_date = String(fd.get('pol_due_date') || '').trim()
    if (!item_id || Number.isNaN(order_qty) || order_qty <= 0 || !due_date) {
      setGlobalMessageType('error')
      setGlobalMessage('품목, 수량, 납기일을 입력해 주세요.')
      return
    }
    try {
      const created = await createPurchaseOrderLine(selectedPoId, {
        purchase_order_id: selectedPoId,
        item_id,
        order_qty,
        due_date,
      })
      setPurchaseOrderLines((prev) => [created, ...prev])
      e.currentTarget.reset()
      setGlobalMessageType('info')
      setGlobalMessage('발주 라인이 등록되었습니다.')
    } catch (err) {
      setGlobalMessageType('error')
      setGlobalMessage(err instanceof Error ? err.message : '발주 라인 등록에 실패했습니다.')
    }
  }

  const itemLabel = (id: number) => items.find((i) => i.id === id)?.name ?? `#${id}`
  const warehouseLabel = (id: number) => warehouses.find((w) => w.id === id)?.name ?? `#${id}`

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-header-title">경량 SCM 시스템</div>
          <div className="app-header-subtitle">
            수요예측 → 생산계획 → BOM → MRP → 발주 → 재고를 한 곳에서
          </div>
        </div>
        <div className="app-header-right">
          <span className="app-tag">MVP · 내부용</span>
          <span>플로우: 수요 → 생산 → MRP → 발주 → 재고</span>
          {currentUser ? (
            <>
              <span>{currentUser.name} ({currentUser.role})</span>
              <button className="sidebar-item" onClick={handleLogout}>
                <span className="sidebar-item-label">로그아웃</span>
              </button>
            </>
          ) : null}
        </div>
      </header>
      <div className="app-body">
        {!currentUser && (
          <main className="app-content">
            <section className="panel">
              <div className="panel-title-row">
                <h2 className="panel-title">{showSignup ? '회원가입' : '로그인'}</h2>
                <span className="panel-tag">SCM 접근을 위해 로그인하세요</span>
              </div>
              <p className="panel-description">
                {showSignup
                  ? '이메일, 이름, 비밀번호를 입력해 회원가입하세요. 가입 후 자동으로 로그인됩니다.'
                  : '이메일과 비밀번호로 로그인하세요. 계정이 없으면 아래 회원가입을 이용하세요.'}
              </p>
              {showSignup ? (
                <form className="login-form" onSubmit={handleRegister}>
                  <div className="login-field">
                    <label htmlFor="reg_email">이메일</label>
                    <input id="reg_email" name="reg_email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="login-field">
                    <label htmlFor="reg_name">이름</label>
                    <input id="reg_name" name="reg_name" type="text" placeholder="홍길동" required />
                  </div>
                  <div className="login-field">
                    <label htmlFor="reg_password">비밀번호</label>
                    <input id="reg_password" name="reg_password" type="password" placeholder="6자 이상" minLength={6} required />
                  </div>
                  {authError && <div className="login-error">{authError}</div>}
                  <button type="submit" disabled={isLoadingAuth}>
                    {isLoadingAuth ? '가입 중...' : '회원가입'}
                  </button>
                  <button type="button" className="login-form-link" onClick={() => { setShowSignup(false); setAuthError(null); }}>
                    로그인 화면으로
                  </button>
                </form>
              ) : (
                <form className="login-form" onSubmit={handleLogin}>
                  <div className="login-field">
                    <label htmlFor="email">이메일</label>
                    <input id="email" name="email" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="login-field">
                    <label htmlFor="password">비밀번호</label>
                    <input id="password" name="password" type="password" placeholder="••••••••" />
                  </div>
                  {authError && <div className="login-error">{authError}</div>}
                  <button type="submit" disabled={isLoadingAuth}>
                    {isLoadingAuth ? '로그인 중...' : '로그인'}
                  </button>
                  <button type="button" className="login-form-link" onClick={() => { setShowSignup(true); setAuthError(null); }}>
                    회원가입
                  </button>
                </form>
              )}
            </section>
          </main>
        )}
        {currentUser && (
        <>
        <nav className="app-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-title">메인</div>
            <button
              className={`sidebar-item ${activeMenu === 'dashboard' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <span className="sidebar-item-label">대시보드</span>
              <span className="sidebar-item-badge">개요</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">기초 데이터</div>
            <button
              className={`sidebar-item ${activeMenu === 'items' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('items')}
            >
              <span className="sidebar-item-label">품목 관리</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'bom' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('bom')}
            >
              <span className="sidebar-item-label">BOM 관리</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'leadtime' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('leadtime')}
            >
              <span className="sidebar-item-label">리드타임/거래처</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">수요/생산</div>
            <button
              className={`sidebar-item ${activeMenu === 'forecast' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('forecast')}
            >
              <span className="sidebar-item-label">수요예측</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'production' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('production')}
            >
              <span className="sidebar-item-label">생산계획</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">자재/MRP</div>
            <button
              className={`sidebar-item ${activeMenu === 'bomCalc' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('bomCalc')}
            >
              <span className="sidebar-item-label">소요량(BOM) 계산</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'mrp' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('mrp')}
            >
              <span className="sidebar-item-label">MRP 결과</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">발주/구매</div>
            <button
              className={`sidebar-item ${activeMenu === 'poPlan' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('poPlan')}
            >
              <span className="sidebar-item-label">발주 계획</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'po' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('po')}
            >
              <span className="sidebar-item-label">발주서 관리</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">재고</div>
            <button
              className={`sidebar-item ${activeMenu === 'inventory' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('inventory')}
            >
              <span className="sidebar-item-label">재고 현황</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'stock' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('stock')}
            >
              <span className="sidebar-item-label">입출고 관리</span>
            </button>
          </div>
        </nav>

        <main className="app-content">
          <div className="breadcrumbs">
            {pageMeta.path.map((p, idx) => (
              <span key={p + idx}>{p}</span>
            ))}
          </div>

          <section className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">{pageMeta.title}</h2>
              <span className="panel-tag">화면 뼈대 · 설계 기준</span>
            </div>
            <p className="panel-description">{pageMeta.description}</p>

            {activeMenu === 'dashboard' && (
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-title">오늘 기준 재고 요약</div>
                  <div className="card-body placeholder">
                    품목 수, 품절/임박/과잉 품목 수가 여기에 표시됩니다.
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">수요 vs 생산 계획</div>
                  <div className="card-body placeholder">
                    제품별 수요예측과 생산계획을 비교하는 작은 차트가 들어갈 자리입니다.
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">발주/입고 현황</div>
                  <div className="card-body placeholder">지연 발주, 입고 예정 건수 요약이 들어갑니다.</div>
                </div>
                <div className="card">
                  <div className="card-title">알림</div>
                  <div className="card-body placeholder">
                    품절 임박 품목, BOM/리드타임 누락 등 경고성 알림이 표시됩니다.
                  </div>
                </div>
              </div>
            )}

            {globalMessage && <AlertBar type={globalMessageType}>{globalMessage}</AlertBar>}

            {activeMenu === 'items' && (
              <div className="two-column-layout">
                <div>
                  <strong>검색 조건</strong>
                  <div className="table-placeholder">
                    <SearchFilter
                      label="코드/명 검색"
                      value={itemsFilter.codeOrName}
                      placeholder="예: A100 또는 제품명"
                      onChange={(value) => setItemsFilter({ codeOrName: value })}
                    />
                  </div>

                  <strong style={{ marginTop: 12, display: 'block' }}>품목 추가</strong>
                  <form className="login-form" onSubmit={handleCreateItem}>
                    <div className="login-field">
                      <label htmlFor="code">코드</label>
                      <input id="code" name="code" />
                    </div>
                    <div className="login-field">
                      <label htmlFor="name">이름</label>
                      <input id="name" name="name" />
                    </div>
                    <div className="login-field">
                      <label htmlFor="type">유형 (PRODUCT/RAW)</label>
                      <input id="type" name="type" placeholder="PRODUCT 또는 RAW" />
                    </div>
                    <div className="login-field">
                      <label htmlFor="uom">단위</label>
                      <input id="uom" name="uom" placeholder="EA, KG 등" />
                    </div>
                    <div className="login-field">
                      <label htmlFor="unit_price">단가 (선택, RAW 발주비용 추정)</label>
                      <input id="unit_price" name="unit_price" type="text" placeholder="비우면 미사용" />
                    </div>
                    <div className="login-field">
                      <label htmlFor="safety_stock_qty">안전재고</label>
                      <input id="safety_stock_qty" name="safety_stock_qty" type="number" defaultValue={0} />
                    </div>
                    <div className="login-field">
                      <label htmlFor="lead_time_days">리드타임(일)</label>
                      <input id="lead_time_days" name="lead_time_days" type="number" defaultValue={0} />
                    </div>
                    <button type="submit">품목 추가</button>
                  </form>
                </div>
                <div>
                  <strong>품목 목록</strong>
                  <div className="table-placeholder">
                    {itemsLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <>
                        <table className="simple-table">
                          <thead>
                            <tr>
                              <th>코드</th>
                              <th>이름</th>
                              <th>유형</th>
                              <th>단위</th>
                              <th>단가</th>
                              <th>안전재고</th>
                              <th>리드타임(일)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedItems.map((item) => (
                              <tr key={item.id}>
                                <td>{item.code}</td>
                                <td>{item.name}</td>
                                <td>{item.type}</td>
                                <td>{item.uom}</td>
                                <td>{item.unit_price ?? '—'}</td>
                                <td>{item.safety_stock_qty}</td>
                                <td>{item.lead_time_days}</td>
                              </tr>
                            ))}
                            {pagedItems.length === 0 && (
                              <tr>
                                <td colSpan={7}>등록된 품목이 없습니다.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <PaginationControls
                          page={itemsPage}
                          totalPages={itemsTotalPages}
                          onPageChange={setItemsPage}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'bom' && (
              <div className="two-column-layout">
                <div>
                  <strong>제품 선택</strong>
                  <div className="table-placeholder">
                    좌측에서 상위 제품을 선택하면, 우측에 해당 제품의 BOM이 표시됩니다.
                  </div>
                </div>
                <div>
                  <strong>BOM 상세</strong>
                  <div className="table-placeholder">
                    하위 자재, 소요수량, 유효기간 등을 행 단위로 관리하는 그리드가 들어갑니다.
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'forecast' && (
              <div className="two-column-layout">
                <div>
                  <strong>수요예측 등록</strong>
                  <form className="login-form" onSubmit={handleCreateForecast} style={{ marginTop: 8 }}>
                    <div className="login-field">
                      <label>품목</label>
                      <select name="forecast_item_id" required>
                        <option value="">선택</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="login-field">
                      <label>기간 시작</label>
                      <input name="period_start" type="date" required />
                    </div>
                    <div className="login-field">
                      <label>기간 종료</label>
                      <input name="period_end" type="date" required />
                    </div>
                    <div className="login-field">
                      <label>수량</label>
                      <input name="quantity" type="number" min={0} required />
                    </div>
                    <div className="login-field">
                      <label>방법</label>
                      <input name="method" type="text" placeholder="MANUAL 등" />
                    </div>
                    <button type="submit">등록</button>
                  </form>
                </div>
                <div>
                  <strong>수요예측 목록</strong>
                  <div className="table-placeholder" style={{ marginTop: 8 }}>
                    {forecastsLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>품목</th>
                            <th>기간시작</th>
                            <th>기간종료</th>
                            <th>수량</th>
                            <th>방법</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecasts.map((f) => (
                            <tr key={f.id}>
                              <td>{itemLabel(f.item_id)}</td>
                              <td>{f.period_start}</td>
                              <td>{f.period_end}</td>
                              <td>{f.quantity}</td>
                              <td>{f.method ?? '-'}</td>
                            </tr>
                          ))}
                          {forecasts.length === 0 && (
                            <tr><td colSpan={5}>등록된 수요예측이 없습니다.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'production' && (
              <div className="two-column-layout">
                <div>
                  <strong>생산계획 등록</strong>
                  <form className="login-form" onSubmit={handleCreateProductionPlan} style={{ marginTop: 8 }}>
                    <div className="login-field">
                      <label>품목</label>
                      <select name="plan_item_id" required>
                        <option value="">선택</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="login-field">
                      <label>기간 시작</label>
                      <input name="plan_period_start" type="date" required />
                    </div>
                    <div className="login-field">
                      <label>기간 종료</label>
                      <input name="plan_period_end" type="date" required />
                    </div>
                    <div className="login-field">
                      <label>수량</label>
                      <input name="plan_quantity" type="number" min={0} required />
                    </div>
                    <div className="login-field">
                      <label>상태</label>
                      <select name="plan_status">
                        <option value="DRAFT">DRAFT</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                      </select>
                    </div>
                    <div className="login-field">
                      <label>버전</label>
                      <input name="plan_version" type="text" placeholder="V1" />
                    </div>
                    <button type="submit">등록</button>
                  </form>
                </div>
                <div>
                  <strong>생산계획 목록</strong>
                  <div className="table-placeholder" style={{ marginTop: 8 }}>
                    {productionPlansLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>품목</th>
                            <th>기간시작</th>
                            <th>기간종료</th>
                            <th>수량</th>
                            <th>상태</th>
                            <th>버전</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productionPlans.map((p) => (
                            <tr key={p.id}>
                              <td>{itemLabel(p.item_id)}</td>
                              <td>{p.period_start}</td>
                              <td>{p.period_end}</td>
                              <td>{p.quantity}</td>
                              <td>{p.status}</td>
                              <td>{p.version ?? '-'}</td>
                            </tr>
                          ))}
                          {productionPlans.length === 0 && (
                            <tr><td colSpan={6}>등록된 생산계획이 없습니다.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'bomCalc' && (
              <div className="table-placeholder">
                기간과 생산계획 버전을 선택하고, 제품별/자재별 소요량을 계산해 보여주는 표가 들어갑니다.
                후속 단계인 MRP 실행 버튼도 이 화면 하단에 배치할 수 있습니다.
              </div>
            )}

            {activeMenu === 'mrp' && (
              <div className="two-column-layout">
                <div>
                  <strong>MRP 계산 실행</strong>
                  <form className="login-form" onSubmit={handleRunMrpCalc} style={{ marginTop: 8 }}>
                    <div className="login-field">
                      <label>품목</label>
                      <select name="mrp_item_id" required>
                        <option value="">선택</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="login-field">
                      <label>필요수량</label>
                      <input name="mrp_required_qty" type="number" min={0} required />
                    </div>
                    <div className="login-field">
                      <label>필요일 (선택)</label>
                      <input name="mrp_required_date" type="date" />
                    </div>
                    <button type="submit">MRP 계산</button>
                  </form>
                </div>
                <div>
                  <strong>MRP 결과</strong>
                  <div className="table-placeholder" style={{ marginTop: 8 }}>
                    {mrpResultsLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>품목</th>
                            <th>필요수량</th>
                            <th>재고</th>
                            <th>안전재고</th>
                            <th>부족수량</th>
                            <th>제안발주일</th>
                            <th>필요일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mrpResults.map((r) => (
                            <tr key={r.id}>
                              <td>{itemLabel(r.item_id)}</td>
                              <td>{r.required_qty}</td>
                              <td>{r.on_hand_qty}</td>
                              <td>{r.safety_stock_qty}</td>
                              <td>{r.shortage_qty}</td>
                              <td>{r.suggested_order_date ?? '-'}</td>
                              <td>{r.required_date ?? '-'}</td>
                            </tr>
                          ))}
                          {mrpResults.length === 0 && (
                            <tr><td colSpan={7}>MRP 결과가 없습니다. 계산을 실행해 주세요.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeMenu === 'poPlan' || activeMenu === 'po') && (
              <div className="two-column-layout">
                <div>
                  <strong>발주 등록</strong>
                  <form className="login-form" onSubmit={handleCreatePurchaseOrder} style={{ marginTop: 8 }}>
                    <div className="login-field">
                      <label>발주번호</label>
                      <input name="po_order_no" type="text" required placeholder="PO-001" />
                    </div>
                    <div className="login-field">
                      <label>공급사</label>
                      <input name="po_vendor_name" type="text" required />
                    </div>
                    <div className="login-field">
                      <label>발주일</label>
                      <input name="po_order_date" type="date" required />
                    </div>
                    <div className="login-field">
                      <label>상태</label>
                      <select name="po_status">
                        <option value="REQUESTED">REQUESTED</option>
                        <option value="ORDERED">ORDERED</option>
                        <option value="RECEIVED">RECEIVED</option>
                      </select>
                    </div>
                    <button type="submit">발주 등록</button>
                  </form>
                  {activeMenu === 'po' && (
                    <>
                      <strong style={{ marginTop: 16, display: 'block' }}>발주 라인 추가</strong>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>아래 목록에서 발주를 선택한 뒤 등록하세요.</p>
                      <form className="login-form" onSubmit={handleCreatePurchaseOrderLine} style={{ marginTop: 8 }}>
                        <div className="login-field">
                          <label>발주 선택</label>
                          <select
                            value={selectedPoId ?? ''}
                            onChange={(e) => setSelectedPoId(e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">선택</option>
                            {purchaseOrders.map((po) => (
                              <option key={po.id} value={po.id}>{po.order_no} {po.vendor_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="login-field">
                          <label>품목</label>
                          <select name="pol_item_id" required>
                            <option value="">선택</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="login-field">
                          <label>수량</label>
                          <input name="pol_order_qty" type="number" min={0.01} step="any" required />
                        </div>
                        <div className="login-field">
                          <label>납기일</label>
                          <input name="pol_due_date" type="date" required />
                        </div>
                        <button type="submit" disabled={selectedPoId == null}>라인 추가</button>
                      </form>
                    </>
                  )}
                </div>
                <div>
                  <strong>발주 목록</strong>
                  <div className="table-placeholder" style={{ marginTop: 8 }}>
                    {purchaseOrdersLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>발주번호</th>
                            <th>공급사</th>
                            <th>발주일</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrders.map((po) => (
                            <tr
                              key={po.id}
                              onClick={() => activeMenu === 'po' && setSelectedPoId(po.id)}
                              style={{ cursor: activeMenu === 'po' ? 'pointer' : undefined }}
                            >
                              <td>{po.order_no}</td>
                              <td>{po.vendor_name}</td>
                              <td>{po.order_date}</td>
                              <td>{po.status}</td>
                            </tr>
                          ))}
                          {purchaseOrders.length === 0 && (
                            <tr><td colSpan={4}>등록된 발주가 없습니다.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {activeMenu === 'po' && selectedPoId != null && (
                    <>
                      <strong style={{ marginTop: 12, display: 'block' }}>발주 라인 (선택된 발주)</strong>
                      <div className="table-placeholder" style={{ marginTop: 8 }}>
                        <table className="simple-table">
                          <thead>
                            <tr>
                              <th>품목</th>
                              <th>수량</th>
                              <th>납기일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseOrderLines.map((l) => (
                              <tr key={l.id}>
                                <td>{itemLabel(l.item_id)}</td>
                                <td>{l.order_qty}</td>
                                <td>{l.due_date}</td>
                              </tr>
                            ))}
                            {purchaseOrderLines.length === 0 && (
                              <tr><td colSpan={3}>라인이 없습니다.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeMenu === 'inventory' && (
              <div>
                <strong>재고 현황 (품목/창고별 스냅샷)</strong>
                <div className="table-placeholder" style={{ marginTop: 8 }}>
                  {inventoriesLoading ? (
                    <div>불러오는 중...</div>
                  ) : (
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>품목</th>
                          <th>창고</th>
                          <th>수량</th>
                          <th>기준일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventories.map((inv) => (
                          <tr key={inv.id}>
                            <td>{itemLabel(inv.item_id)}</td>
                            <td>{warehouseLabel(inv.warehouse_id)}</td>
                            <td>{inv.qty}</td>
                            <td>{inv.as_of_date}</td>
                          </tr>
                        ))}
                        {inventories.length === 0 && (
                          <tr><td colSpan={4}>재고 데이터가 없습니다.</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeMenu === 'stock' && (
              <div className="two-column-layout">
                <div>
                  <strong>입출고 등록</strong>
                  <form className="login-form" onSubmit={handleCreateStockTransaction} style={{ marginTop: 8 }}>
                    <div className="login-field">
                      <label>품목</label>
                      <select name="trx_item_id" required>
                        <option value="">선택</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="login-field">
                      <label>창고</label>
                      <select name="trx_warehouse_id" required>
                        <option value="">선택</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.code} {w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="login-field">
                      <label>구분</label>
                      <select name="trx_type">
                        <option value="IN">입고</option>
                        <option value="OUT">출고</option>
                        <option value="ADJUST">조정</option>
                      </select>
                    </div>
                    <div className="login-field">
                      <label>수량</label>
                      <input name="trx_qty" type="number" min={0.01} step="any" required />
                    </div>
                    <div className="login-field">
                      <label>사유</label>
                      <input name="trx_reason" type="text" placeholder="선택" />
                    </div>
                    <button type="submit">등록</button>
                  </form>
                </div>
                <div>
                  <strong>입출고 이력</strong>
                  <div className="table-placeholder" style={{ marginTop: 8 }}>
                    {stockTransactionsLoading ? (
                      <div>불러오는 중...</div>
                    ) : (
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>품목</th>
                            <th>창고</th>
                            <th>구분</th>
                            <th>수량</th>
                            <th>사유</th>
                            <th>일시</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockTransactions.slice(0, 50).map((t) => (
                            <tr key={t.id}>
                              <td>{itemLabel(t.item_id)}</td>
                              <td>{warehouseLabel(t.warehouse_id)}</td>
                              <td>{t.trx_type}</td>
                              <td>{t.qty}</td>
                              <td>{t.reason ?? '-'}</td>
                              <td>{t.trx_time}</td>
                            </tr>
                          ))}
                          {stockTransactions.length === 0 && (
                            <tr><td colSpan={6}>입출고 이력이 없습니다.</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
        </>
        )}
      </div>
    </div>
  )
}

export default App
