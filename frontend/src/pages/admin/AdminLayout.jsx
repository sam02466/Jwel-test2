import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Truck, LogOut, Store, Menu, X, Gem } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/agents', label: 'Delivery Agents', icon: Truck }
]

export default function AdminLayout() {
  const { adminSession, ready, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Wait for the async session-restore check (AuthContext calls
    // GET /api/admin/me on mount, since the session lives in an httpOnly
    // cookie JS can't read directly) before deciding to redirect —
    // otherwise an already-logged-in admin gets bounced to /login on
    // every page refresh, for the brief moment before that check
    // resolves.
    if (ready && adminSession?.role !== 'admin') navigate('/admin/login', { replace: true })
  }, [ready, adminSession, navigate])

  if (!ready) return null
  if (adminSession?.role !== 'admin') return null

  const sidebar = (
    <div className="flex h-full flex-col bg-espresso-900 text-ivory-100">
      <div className="flex items-center gap-3 border-b border-ivory-100/10 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient text-white"><Gem className="h-5 w-5" /></span>
        <div>
          <p className="font-serif text-lg font-semibold leading-tight">SARIKA BEAUTY HUB</p>
          <p className="text-[10px] uppercase tracking-luxury text-champagne-400">Admin Console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive ? 'bg-gold-gradient text-white shadow-gold' : 'text-ivory-200/80 hover:bg-ivory-100/10 hover:text-white'
              }`
            }
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ivory-100/10 p-4">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ivory-200/80 transition-colors hover:bg-ivory-100/10 hover:text-white">
          <Store className="h-5 w-5" /> View Store
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne-500/30 font-serif font-semibold text-champagne-300">A</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ivory-100">{adminSession.name}</p>
            <p className="truncate text-[11px] text-ivory-200/50">Admin</p>
          </div>
          <button onClick={() => { logout('admin'); navigate('/admin/login') }} className="text-ivory-200/60 hover:text-white" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-champagne-200/60 bg-ivory-50/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-xl border border-champagne-200 bg-white p-2 text-espresso-700 lg:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Sarika Beauty Hub</p>
              <p className="font-serif text-xl font-semibold text-espresso-800">Store Management</p>
            </div>
          </div>
          <button onClick={() => { logout('admin'); navigate('/admin/login') }} className="btn-outline !py-2 !px-4">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-espresso-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in-right">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute -right-12 top-4 rounded-full bg-white/20 p-2 text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
