import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, User, Phone, MapPin, Truck, CheckCircle2, XCircle, Send, Package } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../components/Toast'
import { fmtINR } from '../../data/store'
import StatusBadge from '../../components/StatusBadge'
import OrderMap from '../../components/OrderMap'

const FILTERS = ['all', 'placed', 'confirmed', 'assigned', 'out_for_delivery', 'delivered']

export default function AdminOrders() {
  const { orders, agents, setOrderStatus, refreshOrders } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState(null)

  // Keeps the list current while this page is open — status changes
  // from other admins and, especially, an agent's live GPS position
  // (updates roughly every 15s while they're sharing — see
  // AgentOrderDetail.jsx) wouldn't otherwise show up without a manual
  // refresh.
  useEffect(() => {
    const interval = setInterval(() => refreshOrders(), 20000)
    return () => clearInterval(interval)
  }, [refreshOrders])

  const list = useMemo(() => {
    let l = [...orders]
    if (filter !== 'all') l = l.filter((o) => o.status === filter)
    if (q) {
      const t = q.toLowerCase()
      l = l.filter((o) => o.id.toLowerCase().includes(t) || o.customerName.toLowerCase().includes(t) || o.customerPhone.includes(t))
    }
    return l.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, filter, q])

  const assign = (orderId, agentId) => {
    setOrderStatus(orderId, 'assigned', agentId)
    toast('Delivery agent assigned')
  }

  const advance = (orderId, status, label) => {
    setOrderStatus(orderId, status)
    toast(`Order marked ${label}`)
  }

  const agentName = (id) => agents.find((a) => a.id === id)?.name || 'Unassigned'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-espresso-800">Manage Orders</h1>
          <p className="mt-1 text-[13px] text-espresso-500">Confirm orders, assign agents and keep every delivery on track.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order / customer / phone…" className="input-lux w-64 !pl-10 !py-2.5" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all ${filter === f ? 'bg-espresso-800 text-ivory-100 shadow-card' : 'border border-champagne-200 bg-white text-espresso-600 hover:border-champagne-400'}`}
            >
              {f === 'all' ? `All (${orders.length})` : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {list.length === 0 && (
          <div className="card-lux p-16 text-center">
            <Package className="mx-auto h-10 w-10 text-champagne-300" />
            <p className="mt-4 font-serif text-xl text-espresso-700">No orders match</p>
          </div>
        )}
        {list.map((o, idx) => {
          const isOpen = expanded === o.id
          return (
            <div key={o.id} className="card-lux overflow-hidden animate-fade-up" style={{ animationDelay: `${Math.min(idx, 6) * 50}ms` }}>
              <button onClick={() => setExpanded(isOpen ? null : o.id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[13px] font-bold text-champagne-700">{o.id}</span>
                    <StatusBadge status={o.status} small />
                  </div>
                  <p className="mt-1 text-sm text-espresso-600">
                    {o.customerName} · {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="hidden items-center gap-2 text-[12px] text-espresso-500 md:flex">
                  {o.agentId ? (
                    <>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">{agentName(o.agentId)[0]}</span>
                      {agentName(o.agentId)}
                    </>
                  ) : (
                    <span className="badge-lux">Unassigned</span>
                  )}
                </div>
                <span className="font-serif text-xl font-semibold text-espresso-800">{fmtINR(o.total)}</span>
                <ChevronDown className={`h-5 w-5 text-espresso-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-champagne-200/60 bg-ivory-100/40 p-5 sm:p-6 animate-fade-in">
                  <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div>
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Items</h3>
                      <div className="space-y-2.5">
                        {o.items.map((i) => (
                          <div key={i.productId} className="flex items-center gap-3 rounded-xl border border-champagne-200/70 bg-white/70 p-2.5">
                            <img src={i.image} alt={i.name} className="h-12 w-10 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-espresso-800">{i.name}</p>
                              <p className="text-[11px] text-espresso-400">Qty {i.qty}</p>
                            </div>
                            <span className="text-sm font-semibold text-espresso-800">{fmtINR(i.price * i.qty)}</span>
                          </div>
                        ))}
                      </div>

                      <h3 className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Customer</h3>
                      <div className="rounded-xl border border-champagne-200/70 bg-white/70 p-4 text-sm">
                        <p className="flex items-center gap-2 font-medium text-espresso-800"><User className="h-4 w-4 text-champagne-600" /> {o.customerName}</p>
                        <p className="mt-1.5 flex items-center gap-2 text-espresso-600"><Phone className="h-4 w-4 text-champagne-600" /> {o.customerPhone}</p>
                        <p className="mt-1.5 flex items-start gap-2 text-espresso-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" /> {o.address.line1}, {o.address.city} — {o.address.pincode}</p>
                        <p className="mt-1.5 text-[12px] text-espresso-400">Payment: {o.payment}</p>
                      </div>

                      {(o.coords || o.agentCoords) && (
                        <>
                          <h3 className="mb-3 mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">
                            <Truck className="h-3.5 w-3.5" /> Delivery Tracking
                            {o.agentCoords && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Agent live
                              </span>
                            )}
                          </h3>
                          <OrderMap
                            destination={o.coords}
                            agentPosition={o.agentCoords}
                            agentLabel={agentName(o.agentId)}
                            label={`${o.customerName} — ${o.address.line1}`}
                            className="h-56 w-full"
                          />
                          {o.agentCoords?.updatedAt && (
                            <p className="mt-2 text-[11px] text-espresso-400">
                              Agent position updated {new Date(o.agentCoords.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-champagne-200/70 bg-white/70 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">
                          <Truck className="h-4 w-4" /> Assign Delivery Agent
                        </h3>
                        <div className="space-y-2">
                          {agents.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => assign(o.id, a.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${o.agentId === a.id ? 'border-champagne-500 bg-champagne-50' : 'border-champagne-100 hover:border-champagne-300'}`}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[12px] font-bold text-white">{a.name[0]}</span>
                              <span className="flex-1">
                                <span className="block text-[13px] font-semibold text-espresso-800">{a.name}</span>
                                <span className="block text-[11px] text-espresso-400">{a.area}</span>
                              </span>
                              {o.agentId === a.id && <CheckCircle2 className="h-4 w-4 text-champagne-600" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-champagne-200/70 bg-white/70 p-4">
                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Actions</h3>
                        <div className="grid gap-2">
                          {o.status === 'placed' && (
                            <button onClick={() => advance(o.id, 'confirmed', 'as Confirmed')} className="btn-dark w-full !py-2.5 !text-[11px]">
                              <CheckCircle2 className="h-4 w-4" /> Confirm Order
                            </button>
                          )}
                          {['confirmed', 'assigned'].includes(o.status) && (
                            <button onClick={() => advance(o.id, 'out_for_delivery', 'as Out for Delivery')} className="btn-gold w-full !py-2.5 !text-[11px]">
                              <Send className="h-4 w-4" /> Dispatch to Delivery
                            </button>
                          )}
                          {o.status === 'out_for_delivery' && (
                            <button onClick={() => advance(o.id, 'delivered', 'as Delivered')} className="btn-gold w-full !py-2.5 !text-[11px]">
                              <CheckCircle2 className="h-4 w-4" /> Mark Delivered
                            </button>
                          )}
                          {!['delivered', 'cancelled'].includes(o.status) && (
                            <button onClick={() => advance(o.id, 'cancelled', 'as Cancelled')} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2.5 text-[11px] font-medium uppercase tracking-luxury text-rose-600 transition-colors hover:bg-rose-50">
                              <XCircle className="h-4 w-4" /> Cancel Order
                            </button>
                          )}
                          {o.status === 'delivered' && (
                            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-[12px] font-medium text-emerald-700">
                              Delivered {o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
