import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Truck, PackageCheck, MapPin, ChevronRight, Phone, Search, CheckCircle2, Star, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import StatusBadge from '../../components/StatusBadge'
import { fmtINR } from '../../data/store'

export default function AgentPortal() {
  const { agentSession, ready, currentAgent, logout } = useAuth()
  const { orders } = useData()
  const navigate = useNavigate()
  const agent = currentAgent()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (ready && agentSession?.role !== 'agent') navigate('/agent/login', { replace: true })
  }, [ready, agentSession, navigate])

  const assigned = useMemo(() => {
    let list = orders.filter((o) => o.agentId === agentSession?.id)
    if (q) {
      const t = q.toLowerCase()
      list = list.filter((o) => o.id.toLowerCase().includes(t) || o.customerName.toLowerCase().includes(t))
    }
    return list.sort((a, b) => {
      const rank = { out_for_delivery: 0, assigned: 1, confirmed: 2, placed: 3, delivered: 4 }
      return (rank[a.status] ?? 5) - (rank[b.status] ?? 5)
    })
  }, [orders, agentSession, q])

  if (!agent) return null

  const active = assigned.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
  const done = assigned.filter((o) => o.status === 'delivered').length

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="sticky top-0 z-30 bg-espresso-900 text-ivory-100">
        <div className="container-lux flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-champagne-500 to-amber-700 shadow-gold">
              <Truck className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold leading-tight">SARIKA BEAUTY HUB</p>
              <p className="text-[10px] uppercase tracking-luxury text-champagne-400">Delivery Agent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden items-center gap-1.5 rounded-full border border-ivory-100/20 px-4 py-2 text-[11px] uppercase tracking-wider text-ivory-200 hover:bg-ivory-100/10 sm:flex">
              <Store className="h-3.5 w-3.5" /> Store
            </Link>
            <button onClick={() => { logout('agent'); navigate('/agent/login') }} className="flex items-center gap-1.5 rounded-full border border-ivory-100/20 px-4 py-2 text-[11px] uppercase tracking-wider text-ivory-200 hover:bg-ivory-100/10">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-lux py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient font-serif text-2xl font-semibold text-white shadow-gold">
              {agent.name[0]}
            </span>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-espresso-800">Welcome, {agent.name.split(' ')[0]}</h1>
              <p className="mt-0.5 flex items-center gap-2 text-[13px] text-espresso-500">
                <MapPin className="h-3.5 w-3.5 text-champagne-600" /> {agent.area}
                <span className="flex items-center gap-1 rounded-full bg-champagne-100 px-2 py-0.5 text-[11px] font-semibold text-champagne-800">
                  <Star className="h-3 w-3 fill-champagne-600 text-champagne-600" /> {agent.rating}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="card-lux !shadow-none px-5 py-3 text-center">
              <p className="text-2xl font-semibold text-champagne-700">{active}</p>
              <p className="text-[10px] uppercase tracking-wider text-espresso-400">Active</p>
            </div>
            <div className="card-lux !shadow-none px-5 py-3 text-center">
              <p className="text-2xl font-semibold text-emerald-600">{done}</p>
              <p className="text-[10px] uppercase tracking-wider text-espresso-400">Delivered</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold text-espresso-800">My Deliveries</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order / customer…" className="input-lux w-72 !pl-10 !py-2.5" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {assigned.length === 0 && (
            <div className="card-lux col-span-full flex flex-col items-center justify-center p-16 text-center">
              <PackageCheck className="h-12 w-12 text-champagne-300" />
              <h3 className="mt-4 font-serif text-2xl text-espresso-800">No deliveries yet</h3>
              <p className="mt-2 max-w-sm text-sm text-espresso-500">
                The admin will assign orders to you. Check back shortly, or head to the store to see how customers receive their jewellery.
              </p>
            </div>
          )}
          {assigned.map((o, i) => {
            const isDelivered = o.status === 'delivered'
            return (
              <div key={o.id} className={`card-lux overflow-hidden animate-fade-up ${isDelivered ? 'opacity-75' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-center justify-between border-b border-champagne-200/60 bg-ivory-100/60 px-5 py-3">
                  <span className="font-mono text-[13px] font-bold text-champagne-700">{o.id}</span>
                  <StatusBadge status={o.status} small />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-espresso-800">{o.customerName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-espresso-500">
                        <Phone className="h-3 w-3 text-champagne-600" /> {o.customerPhone}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-[12px] text-espresso-500">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-champagne-600" /> {o.address.line1}, {o.address.city} — {o.address.pincode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-espresso-400">{o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                      <p className="font-serif text-lg font-semibold text-espresso-800">{fmtINR(o.total)}</p>
                      <p className="text-[11px] text-espresso-400">{o.payment}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                    {o.items.map((it) => (
                      <img key={it.productId} src={it.image} alt={it.name} title={it.name} className="h-12 w-12 shrink-0 rounded-lg border border-champagne-200 object-cover" />
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/agent/order/${o.id}`)}
                    className={`mt-4 w-full ${isDelivered ? 'btn-outline' : 'btn-gold'}`}
                  >
                    {isDelivered ? <><CheckCircle2 className="h-4 w-4" /> View Completed</> : <>Open Delivery <ChevronRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
