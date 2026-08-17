import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'
import { getRecentOrderIds } from '../data/store'

// The backend stores category as an enum (NECKLACES, EARRINGS, ...);
// every page in this app was built around the display label ("Necklaces")
// living directly on product.category — from ProductCard through the
// Shop filters to AdminProductForm's <select>. Rather than touch every
// one of those, the label<->enum conversion happens in exactly one
// place: here, at the API boundary. Every page keeps working with plain
// labels, same as when they came from a hardcoded array.
const CATEGORY_LABEL_TO_ENUM = {
  Necklaces: 'NECKLACES',
  Earrings: 'EARRINGS',
  Rings: 'RINGS',
  Bangles: 'BANGLES',
  Mangalsutra: 'MANGALSUTRA',
  Bracelets: 'BRACELETS',
  Anklets: 'ANKLETS',
  'Kundan Sets': 'KUNDAN_SETS'
}
const CATEGORY_ENUM_TO_LABEL = Object.fromEntries(
  Object.entries(CATEGORY_LABEL_TO_ENUM).map(([label, value]) => [value, label])
)

const normalizeProduct = (p) => ({ ...p, category: CATEGORY_ENUM_TO_LABEL[p.category] || p.category })
const denormalizeProductInput = (data) => {
  const out = { ...data }
  if (out.category) out.category = CATEGORY_LABEL_TO_ENUM[out.category] || out.category
  if (out.price != null) out.price = Number(out.price)
  if (out.mrp != null && out.mrp !== '') out.mrp = Number(out.mrp)
  else out.mrp = null
  if (out.stock != null) out.stock = Number(out.stock)
  if (out.rating != null && out.rating !== '') out.rating = Number(out.rating)
  return out
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { isAdmin, isAgent, isCustomer, ready: authReady } = useAuth()
  const [products, setProductsState] = useState([])
  const [orders, setOrders] = useState([])
  const [agents, setAgents] = useState([])
  const [ready, setReady] = useState(false)
  const hasLoadedProducts = useRef(false)

  const refreshProducts = useCallback(async () => {
    const { products } = await api.get('/products')
    setProductsState(products.map(normalizeProduct))
  }, [])

  const refreshAgents = useCallback(async () => {
    if (!isAdmin) {
      setAgents([])
      return
    }
    try {
      const { agents } = await api.get('/admin/agents')
      setAgents(agents)
    } catch {
      setAgents([])
    }
  }, [isAdmin])

  // "orders" is scoped to whoever is actually looking: an admin sees
  // every order, an agent sees their own assigned deliveries, a signed-in
  // customer sees their own order history, and a guest sees only the
  // handful of orders they've placed on this browser (tracked by id in
  // localStorage — see getRecentOrderIds). This replaces the original
  // localStorage-era design, where every visitor shared one global
  // orders array; a real backend can't expose everyone's name, phone,
  // and address to any visitor the way that could.
  const refreshOrders = useCallback(async () => {
    try {
      if (isAdmin) {
        const { orders } = await api.get('/orders')
        setOrders(orders)
      } else if (isAgent) {
        const { orders } = await api.get('/agent/orders?includeCompleted=true')
        setOrders(orders)
      } else if (isCustomer) {
        const { orders } = await api.get('/customer/orders')
        setOrders(orders)
      } else {
        const ids = getRecentOrderIds()
        if (ids.length === 0) {
          setOrders([])
          return
        }
        const results = await Promise.all(ids.map((id) => api.get(`/orders/${id}`).catch(() => null)))
        setOrders(results.filter(Boolean))
      }
    } catch {
      setOrders([])
    }
  }, [isAdmin, isAgent, isCustomer])

  useEffect(() => {
    refreshProducts().finally(() => {
      hasLoadedProducts.current = true
    })
  }, [refreshProducts])

  useEffect(() => {
    if (!authReady) return
    Promise.all([refreshOrders(), refreshAgents()]).finally(() => setReady(true))
  }, [authReady, refreshOrders, refreshAgents])

  const placeOrder = useCallback(async (payload) => {
    const order = await api.post('/orders', payload)
    setOrders((prev) => [order, ...prev])
    return order
  }, [])

  // status: 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled' etc.
  // Passing agentId routes to the assign endpoint (which also moves the
  // order to "assigned" server-side); otherwise a plain status PATCH.
  const setOrderStatus = useCallback(async (orderId, status, agentId = null) => {
    const updated = agentId
      ? await api.patch(`/orders/${orderId}/assign`, { agentId })
      : await api.patch(`/orders/${orderId}/status`, { status: status.toUpperCase() })
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    return updated
  }, [])

  const verifyQr = useCallback(async (orderId, qrToken) => {
    const updated = await api.post(`/orders/${orderId}/verify-qr`, { qrToken })
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    return updated
  }, [])

  const createProduct = useCallback(async (data) => {
    const product = await api.post('/products', denormalizeProductInput(data))
    const normalized = normalizeProduct(product)
    setProductsState((prev) => [normalized, ...prev])
    return normalized
  }, [])

  const updateProduct = useCallback(async (id, data) => {
    const product = await api.patch(`/products/${id}`, denormalizeProductInput(data))
    const normalized = normalizeProduct(product)
    setProductsState((prev) => prev.map((p) => (p.id === id ? normalized : p)))
    return normalized
  }, [])

  const deleteProduct = useCallback(async (id) => {
    await api.del(`/products/${id}`)
    setProductsState((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const createAgent = useCallback(async (data) => {
    const agent = await api.post('/admin/agents', data)
    setAgents((prev) => [agent, ...prev])
    return agent
  }, [])

  const removeAgent = useCallback(async (id) => {
    await api.del(`/admin/agents/${id}`)
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        ready,
        products,
        orders,
        agents,
        refreshProducts,
        refreshOrders,
        placeOrder,
        setOrderStatus,
        verifyQr,
        createProduct,
        updateProduct,
        deleteProduct,
        createAgent,
        removeAgent
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
