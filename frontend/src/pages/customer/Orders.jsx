import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackageSearch, Check, ChevronRight, QrCode, MapPin, Truck } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { fmtINR, getRecentOrderIds } from '../../data/store'
import { Reveal } from '../../components/Reveal'

const STATUS_META = {
  placed: { label: 'Order Placed', color: 'text-champagne-700', bg: 'bg-champagne-100' },
  confirmed: { label: 'Confirmed', color: 'text-sky-700', bg: 'bg-sky-100' },
  assigned: { label: 'Delivery Assigned', color: 'text-violet-700', bg: 'bg-violet-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-amber-700', bg: 'bg-amber-100' },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-100' }
}

const TRACK_STEPS = ['placed', 'confirmed', 'assigned', 'out_for_delivery', 'delivered']

export default function Orders() {
  const { orders } = useData()
  const { isCustomer, ready, session } = useAuth()
  const navigate = useNavigate()

  const myOrders = useMemo(() => {
    const recent = getRecentOrderIds()
    return orders.filter(
      (o) =>
        o.customerId === session?.id ||
        recent.includes(o.id) ||
        o.customerEmail === session?.email
    )
  }, [orders, session])

  const sorted = [...myOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (!ready) return null

  if (!isCustomer && !myOrders.length) {
    return (
      <div className="texture-paper flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <PackageSearch className="mx-auto h-14 w-14 text-champagne-300" />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-espresso-800">Track your jewellery</h1>
          <p className="mt-3 text-[15px] text-espresso-500">
            Sign in to see all your orders with live delivery tracking, or explore our collection first.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate('/auth')} className="btn-gold">Sign In / Register</button>
            <Link to="/shop" className="btn-outline">Browse Jewellery</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux py-10 sm:py-14">
        <Reveal>
          <p className="eyebrow"><span className="h-px w-8 bg-champagne-500" /> Order & Delivery</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">My Orders</h1>
          <p className="mt-2 text-[15px] text-espresso-500">Track every order from boutique to your doorstep.</p>
        </Reveal>

        {sorted.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-champagne-200/70 bg-white/70 p-16 text-center">
            <PackageSearch className="mx-auto h-12 w-12 text-champagne-300" />
            <p className="mt-4 font-serif text-2xl text-espresso-800">No orders yet</p>
            <Link to="/shop" className="btn-gold mt-6">Start Shopping</Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {sorted.map((o, idx) => {
              const meta = STATUS_META[o.status] || STATUS_META.placed
              const step = TRACK_STEPS.indexOf(o.status)
              const stepCount = o.status === 'delivered' ? 5 : Math.max(step, 0)
              return (
                <div key={o.id} className="card-lux overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-champagne-200/60 bg-ivory-100/60 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <span className="font-mono text-[12px] font-bold text-champagne-700">{o.id}</span>
                      <span className="hidden text-[13px] text-espresso-400 sm:inline">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/order-receipt/${o.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-champagne-700 hover:text-champagne-800">
                        <QrCode className="h-4 w-4" /> QR Receipt
                      </Link>
                      <button onClick={() => navigate(`/order-receipt/${o.id}`)} className="text-espresso-400 hover:text-champagne-700">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="space-y-3">
                        {o.items.map((i) => (
                          <div key={i.productId} className="flex items-center gap-3">
                            <img src={i.image} alt={i.name} className="h-16 w-14 rounded-xl border border-champagne-200 object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-espresso-800">{i.name}</p>
                              <p className="text-[12px] text-espresso-400">Qty {i.qty} × {fmtINR(i.price)}</p>
                            </div>
                            <span className="text-sm font-semibold text-espresso-800">{fmtINR(i.price * i.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-espresso-500">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-champagne-600" /> {o.address.line1}, {o.address.city}</span>
                        <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-champagne-600" /> {o.payment}</span>
                        <span className="font-semibold text-espresso-800">{fmtINR(o.total)}</span>
                      </div>
                    </div>

                    <div className="lg:w-72">
                      <div className="flex items-center justify-between">
                        {TRACK_STEPS.map((s, i) => {
                          const done = i < stepCount
                          const current = i === step
                          return (
                            <div key={s} className="flex flex-1 items-center last:flex-none">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${done || (current && o.status !== 'delivered') ? 'border-champagne-500 bg-champagne-500 text-white' : current ? 'border-champagne-500 bg-white text-champagne-700' : 'border-champagne-200 bg-white text-espresso-300'}`}>
                                {done ? <Check className="h-3 w-3" /> : i + 1}
                              </span>
                              {i < TRACK_STEPS.length - 1 && <span className={`mx-1 h-0.5 flex-1 rounded ${i < stepCount - 1 || (i === stepCount - 1 && o.status === 'delivered') ? 'bg-champagne-500' : 'bg-champagne-200'}`} />}
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-espresso-400">
                        {TRACK_STEPS.map((s) => <span key={s}>{s.replace(/_/g, ' ')}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
