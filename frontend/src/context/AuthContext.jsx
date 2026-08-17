import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, ApiError } from '../lib/api'

const AuthContext = createContext(null)

// The backend's Customer model stores address as flat columns
// (addressLine1/addressCity/addressPincode); every page that reads a
// customer's address (Account.jsx, Checkout.jsx) was built against a
// nested `customer.address.{line1,city,pincode}` shape. Rather than
// touch every read site, that nesting is reconstructed once, here.
const normalizeCustomer = (c) =>
  c && {
    ...c,
    address: { line1: c.addressLine1 || '', city: c.addressCity || '', pincode: c.addressPincode || '' }
  }

// Sessions live in httpOnly cookies the backend sets (see backend/lib/
// {auth,agent-auth,customer-auth}.ts) — JS can't read them directly, so
// on every page load this context calls each role's /me endpoint once
// to find out whether a session already exists. `ready` flips true once
// all three checks have settled (regardless of outcome), so pages that
// gate on isCustomer/isAdmin/isAgent don't flash a "logged out" state
// before the check has had a chance to come back.
export function AuthProvider({ children }) {
  const [customerSession, setCustomerSession] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [adminSession, setAdminSession] = useState(null)
  const [agentSession, setAgentSession] = useState(null)
  const [agentProfile, setAgentProfile] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([api.get('/customer/me'), api.get('/admin/me'), api.get('/agent/me')]).then(
      ([customerRes, adminRes, agentRes]) => {
        if (cancelled) return
        if (customerRes.status === 'fulfilled') {
          setCustomerProfile(normalizeCustomer(customerRes.value))
          setCustomerSession({ role: 'customer', id: customerRes.value.id, name: customerRes.value.name, email: customerRes.value.email })
        }
        if (adminRes.status === 'fulfilled') {
          setAdminSession({ role: 'admin', id: adminRes.value.username, name: 'Sarika Beauty Hub Admin', email: adminRes.value.username })
        }
        if (agentRes.status === 'fulfilled') {
          setAgentProfile(agentRes.value)
          setAgentSession({ role: 'agent', id: agentRes.value.id, name: agentRes.value.name, email: agentRes.value.username })
        }
        setReady(true)
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async (role) => {
    try {
      await api.post(`/${role}/logout`)
    } finally {
      if (role === 'admin') setAdminSession(null)
      else if (role === 'agent') {
        setAgentSession(null)
        setAgentProfile(null)
      } else {
        setCustomerSession(null)
        setCustomerProfile(null)
      }
    }
  }, [])

  const signupCustomer = useCallback(async ({ name, email, phone, password }) => {
    try {
      const customer = normalizeCustomer(await api.post('/customer/signup', { name, email, phone, password }))
      setCustomerProfile(customer)
      setCustomerSession({ role: 'customer', id: customer.id, name: customer.name, email: customer.email })
      return { ok: true, customer }
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' }
    }
  }, [])

  const loginCustomerAccount = useCallback(async (email, password) => {
    try {
      const customer = normalizeCustomer(await api.post('/customer/login', { email, password }))
      setCustomerProfile(customer)
      setCustomerSession({ role: 'customer', id: customer.id, name: customer.name, email: customer.email })
      return { ok: true, customer }
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' }
    }
  }, [])

  // Admin/agent sign-in forms both label the field "Email" (matching
  // the seeded admin@sarikabeautyhub.in / rahul.verma@sarikadelivery.in
  // style usernames), but the backend's Admin/DeliveryAgent models call
  // the column `username` — an email-shaped string works fine as one,
  // so this is just a field-name translation, not a UI change.
  const loginAdmin = useCallback(async (email, password) => {
    try {
      await api.post('/admin/login', { username: email, password })
      setAdminSession({ role: 'admin', id: email, name: 'Sarika Beauty Hub Admin', email })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' }
    }
  }, [])

  const loginAgent = useCallback(async (email, password) => {
    try {
      const agent = await api.post('/agent/login', { username: email, password })
      setAgentProfile(agent)
      setAgentSession({ role: 'agent', id: agent.id, name: agent.name, email: agent.username })
      return { ok: true, agent }
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' }
    }
  }, [])

  // Profile edits from Account.jsx — replaces the old
  // updateCustomer()/loadCustomers() pair from data/store.js.
  const updateProfile = useCallback(async (data) => {
    const customer = normalizeCustomer(await api.patch('/customer/me', data))
    setCustomerProfile(customer)
    return customer
  }, [])

  const currentCustomer = () => customerProfile
  const currentAgent = () => agentProfile

  return (
    <AuthContext.Provider
      value={{
        ready,
        session: customerSession,
        customerSession,
        adminSession,
        agentSession,
        isCustomer: customerSession?.role === 'customer',
        isAdmin: adminSession?.role === 'admin',
        isAgent: agentSession?.role === 'agent',
        logout,
        signupCustomer,
        loginCustomerAccount,
        loginAdmin,
        loginAgent,
        updateProfile,
        currentCustomer,
        currentAgent
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
