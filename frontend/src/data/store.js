// Client-only helpers. Everything that used to be "the database" here
// (products, orders, customers, agents, sessions) now lives on the
// real backend — see context/AuthContext.jsx and context/DataContext.jsx,
// which call src/lib/api.js instead of reading/writing localStorage.
//
// What's left is genuinely client-only state: the shopping cart (no
// reason for a guest's in-progress cart to round-trip a server before
// checkout) and a small "recently viewed order ids" convenience list
// used to reunite a guest with their order confirmation pages without
// requiring an account.

const KEY = {
  cart: 'sbh_cart_v1',
  recentOrders: 'sbh_recent_orders_v1'
}

const load = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export const loadCart = () => load(KEY.cart, [])
export const saveCart = (c) => save(KEY.cart, c)

export const fmtINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const addRecentOrder = (id) => {
  const list = load(KEY.recentOrders, [])
  if (!list.includes(id)) save(KEY.recentOrders, [id, ...list].slice(0, 10))
}
export const getRecentOrderIds = () => load(KEY.recentOrders, [])

export const todayLabel = () => {
  const d = new Date()
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
