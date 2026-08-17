import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Printer, ArrowRight, ShoppingBag, MapPin, Phone, Gem, BadgeCheck, Truck, User } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { fmtINR, addRecentOrder } from '../../data/store'
import { api } from '../../lib/api'
import { Reveal } from '../../components/Reveal'
import OrderMap from '../../components/OrderMap'

function statusStep(s) {
  const map = { placed: 1, confirmed: 2, assigned: 3, out_for_delivery: 4, delivered: 5 }
  return map[s] || 1
}

export default function OrderReceipt() {
  const { id } = useParams()
  const { orders } = useData()
  const [fetched, setFetched] = useState(null)
  const [liveOrder, setLiveOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef(null)

  const order = liveOrder || orders.find((o) => o.id === id) || fetched

  // DataContext's `orders` is scoped to whoever is signed in (admin/
  // agent/customer) or a guest's recently-placed ids (see DataContext.jsx).
  // Right after checkout that list may not have caught up yet — or the
  // buyer was a guest on their very first order — so this falls back to
  // the single-order lookup, which is public by design (the id itself,
  // an unguessable cuid, is the access control — see backend
  // app/api/orders/[id]/route.ts).
  useEffect(() => {
    if (order || !id) return
    setLoading(true)
    api
      .get(`/orders/${id}`)
      .then((o) => {
        setFetched(o)
        addRecentOrder(o.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, order])

  // While the order is actually out for delivery, poll for the agent's
  // live position (updated roughly every 15s on their end — see
  // AgentOrderDetail.jsx) so the tracking map below moves without the
  // customer needing to refresh the page. Stops on its own once the
  // status moves past out_for_delivery (the polled response's new
  // status flows back into `order` via `liveOrder`, so this effect
  // re-evaluates and the interval isn't recreated).
  useEffect(() => {
    if (!order || order.status !== 'out_for_delivery') return
    const interval = setInterval(() => {
      api.get(`/orders/${id}`).then(setLiveOrder).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [order?.status, id])

  if (!order) {
    if (loading) return null
    return (
      <div className="texture-paper flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Gem className="mx-auto h-12 w-12 text-champagne-300" />
          <h1 className="mt-4 font-serif text-3xl text-espresso-800">Order not found</h1>
          <Link to="/orders" className="btn-gold mt-6">View My Orders</Link>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'placed', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ]
  const step = statusStep(order.status)

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux max-w-3xl py-10 sm:py-14">
        <Reveal className="text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">Order Placed!</h1>
          <p className="mt-3 text-[15px] text-espresso-500">
            Thank you for shopping with Sarika Beauty Hub. Your order{' '}
            <strong className="text-champagne-700">{order.id}</strong> is being prepared with love.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="card-lux mt-10 overflow-hidden">
            <div className="flex items-center justify-between bg-espresso-900 px-6 py-4 text-ivory-100 sm:px-8">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-champagne-400" />
                <span className="font-serif text-lg font-semibold tracking-wider">SARIKA BEAUTY HUB</span>
              </div>
              <span className="badge-lux !border-champagne-400/40 !bg-transparent !text-champagne-300">Digital Receipt</span>
            </div>

            <div ref={printRef} className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Order Number</p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-espresso-800">{order.id}</p>
                  <p className="mt-1 text-[12px] text-espresso-400">
                    {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-[11px] uppercase tracking-luxury text-champagne-700">Scan to verify delivery</p>
                  <div className="rounded-2xl border-2 border-champagne-300 bg-white p-3 shadow-goldSm">
                    <QRCodeSVG value={order.qr} size={128} level="M" />
                  </div>
                </div>
              </div>

              <div className="divider-lux my-6" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Deliver To</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-espresso-800">
                    <User className="h-3.5 w-3.5 text-champagne-600" /> {order.customerName}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-espresso-600">
                    <Phone className="h-3.5 w-3.5 text-champagne-600" /> {order.customerPhone}
                  </p>
                  <p className="mt-1 flex items-start gap-2 text-sm text-espresso-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne-600" />
                    {order.address.line1}, {order.address.city} — {order.address.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Payment</p>
                  <p className="mt-2 text-sm font-medium text-espresso-800">{order.payment}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge-lux"><Truck className="h-3 w-3" /> Insured Free Shipping</span>
                    <span className="badge-lux"><BadgeCheck className="h-3 w-3" /> Hallmark Certified</span>
                  </div>
                </div>
              </div>

              <div className="divider-lux my-6" />

              <div className="space-y-3">
                {order.items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3 rounded-xl border border-champagne-200/70 bg-ivory-100/60 p-3">
                    <img src={i.image} alt={i.name} className="h-14 w-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-espresso-800">{i.name}</p>
                      <p className="text-[12px] text-espresso-400">Qty {i.qty} × {fmtINR(i.price)}</p>
                    </div>
                    <span className="text-sm font-semibold text-espresso-800">{fmtINR(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="divider-lux my-6" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-espresso-600"><span>Subtotal</span><span>{fmtINR(order.subtotal)}</span></div>
                <div className="flex justify-between text-espresso-600"><span>Shipping</span><span className="text-emerald-600">Free</span></div>
                <div className="flex justify-between text-espresso-600"><span>Taxes</span><span>Included</span></div>
                <div className="flex justify-between pt-2 text-lg font-semibold text-espresso-900">
                  <span>Total Paid</span><span>{fmtINR(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-champagne-200/60 px-6 py-4 sm:px-8">
              <p className="mb-3 text-[11px] uppercase tracking-luxury text-champagne-700">Order Progress</p>
              <div className="flex items-center">
                {steps.map((s, i) => {
                  const active = i + 1 <= step
                  const isLast = i === steps.length - 1
                  return (
                    <div key={s.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                      <div className="flex flex-col items-center">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all ${active ? 'border-champagne-500 bg-champagne-500 text-white' : 'border-champagne-200 bg-white text-espresso-400'}`}>
                          {active ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        <span className={`mt-1.5 whitespace-nowrap text-[10px] ${active ? 'font-semibold text-espresso-800' : 'text-espresso-400'}`}>{s.label}</span>
                      </div>
                      {!isLast && (
                        <div className={`mx-2 mb-5 h-0.5 flex-1 rounded-full ${i + 1 < step ? 'bg-champagne-500' : 'bg-champagne-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {(order.status === 'out_for_delivery' || order.status === 'assigned') && (order.coords || order.agentCoords) && (
          <Reveal delay={210}>
            <div className="card-lux mt-8 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-espresso-800">
                <Truck className="h-5 w-5 text-champagne-600" /> Track Your Delivery
                {order.agentCoords && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                  </span>
                )}
              </h2>
              <div className="mt-4">
                <OrderMap destination={order.coords} agentPosition={order.agentCoords} label="Delivering to you" agentLabel={order.agentName || 'Delivery agent'} className="h-72 w-full" />
              </div>
              <p className="mt-3 text-[12px] text-espresso-500">
                {order.agentCoords
                  ? `Your delivery agent's position updates roughly every 15 seconds.`
                  : `Your delivery agent hasn't started sharing their live location yet.`}
              </p>
            </div>
          </Reveal>
        )}

        <Reveal delay={260} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="h-4 w-4" /> Print / Save Receipt
          </button>
          <Link to="/orders" className="btn-gold">
            <ShoppingBag className="h-4 w-4" /> View My Orders
          </Link>
          <Link to="/shop" className="btn-dark">
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </div>
  )
}
