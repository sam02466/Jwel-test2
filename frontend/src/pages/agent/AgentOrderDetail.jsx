import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle2, XCircle, QrCode, MapPin, Phone, User, ShieldCheck, Truck, Keyboard, Navigation } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { fmtINR } from '../../data/store'
import { api } from '../../lib/api'
import { startSharingLocation } from '../../lib/geolocation'
import StatusBadge from '../../components/StatusBadge'
import OrderMap from '../../components/OrderMap'

export default function AgentOrderDetail() {
  const { id } = useParams()
  const { orders, verifyQr } = useData()
  const { agentSession, ready, currentAgent } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const agent = currentAgent()
  const order = orders.find((o) => o.id === id)

  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState('')
  const [verified, setVerified] = useState(null)
  const [qrToken, setQrToken] = useState(null)
  const [verifyError, setVerifyError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [myPosition, setMyPosition] = useState(null)
  const [lastSharedAt, setLastSharedAt] = useState(null)
  const [locationError, setLocationError] = useState('')
  const readerRef = useRef(null)
  const stopSharingRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    if (agentSession?.role !== 'agent') navigate('/agent/login', { replace: true })
    else if (order && order.agentId !== agentSession?.id) navigate('/agent', { replace: true })
  }, [ready, agentSession, order, navigate])

  // Live location sharing — off by default (a delivery agent's position
  // is sensitive; this asks rather than starting silently in the
  // background), only meaningful once the order is actually out for
  // delivery. Reported position goes straight into local state for this
  // page's own map (no round-trip needed to see your own dot move) and,
  // throttled, to the backend via PATCH /api/agent/location so the
  // order carries it for anyone else who fetches it (see
  // src/lib/geolocation.js and backend app/api/agent/location/route.ts).
  useEffect(() => {
    if (order?.status !== 'out_for_delivery' && stopSharingRef.current) {
      stopSharingRef.current()
      stopSharingRef.current = null
      setSharing(false)
    }
  }, [order?.status])

  useEffect(() => {
    return () => {
      if (stopSharingRef.current) stopSharingRef.current()
    }
  }, [])

  const toggleSharing = () => {
    if (sharing) {
      stopSharingRef.current?.()
      stopSharingRef.current = null
      setSharing(false)
      return
    }
    setLocationError('')
    stopSharingRef.current = startSharingLocation({
      onUpdate: ({ lat, lng }) => {
        setMyPosition({ lat, lng })
        setLastSharedAt(new Date())
        api.patch('/agent/location', { lat, lng }).catch(() => {})
      },
      onError: (err) => {
        setLocationError(err.message)
        setSharing(false)
        stopSharingRef.current = null
      }
    })
    setSharing(true)
  }

  useEffect(() => {
    return () => { if (readerRef.current) { try { readerRef.current.stop().catch(() => {}) } catch { /* noop */ } } }
  }, [])

  if (!order || !agent) return null

  // Lightweight, local, unauthenticated pre-check — just confirms the
  // scanned text is shaped like this app's QR format and names *this*
  // order, so the agent gets instant feedback. It intentionally proves
  // nothing on its own: the qrToken it extracts is only checked against
  // the database (the real authorization) when "Confirm Delivery" is
  // tapped — see markDelivered() and backend
  // app/api/orders/[id]/verify-qr/route.ts.
  const attemptVerify = (text) => {
    setVerifyError('')
    const match = String(text || '').match(/^SARIKA\|([^|]+)\|([^|]+)$/)
    if (!match) {
      setVerifyError('Invalid QR code format.')
      setVerified(null)
      return
    }
    const [, scannedOrderId, token] = match
    if (scannedOrderId !== order.id) {
      setVerifyError('This QR code belongs to a different order. Please check the customer again.')
      setVerified(null)
      return
    }
    setQrToken(token)
    setVerified(order)
    stopScan()
    toast('QR recognized — tap Confirm Delivery to complete the handover')
  }

  const startScan = async () => {
    setScanning(true)
    setVerifyError('')
    try {
      const scanner = new Html5Qrcode('agent-qr-reader', false)
      readerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => attemptVerify(decodedText),
        () => {}
      )
    } catch (e) {
      setVerifyError('Camera unavailable in this environment. Please enter the QR code manually below.')
      setScanning(false)
    }
  }

  const stopScan = async () => {
    setScanning(false)
    if (readerRef.current) {
      try { await readerRef.current.stop() } catch { /* noop */ }
      try { readerRef.current.clear() } catch { /* noop */ }
      readerRef.current = null
    }
  }

  const markDelivered = async () => {
    setConfirming(true)
    try {
      // The real, atomic, server-verified handover — qrToken is checked
      // against the order in the database here (see backend
      // app/api/orders/[id]/verify-qr/route.ts); everything before this
      // was just local UI feedback.
      await verifyQr(order.id, qrToken)
      toast('Order marked as Delivered')
      navigate('/agent')
    } catch (err) {
      setVerifyError(err.message || 'Could not verify this delivery. Please try scanning again.')
      setVerified(null)
    } finally {
      setConfirming(false)
    }
  }

  const statusStep = { placed: 1, confirmed: 2, assigned: 3, out_for_delivery: 4, delivered: 5 }[order.status] || 1
  const delivered = order.status === 'delivered'

  return (
    <div className="min-h-screen bg-ivory-100">
      <div className="bg-espresso-900 text-ivory-100">
        <div className="container-lux flex items-center justify-between py-3.5">
          <Link to="/agent" className="flex items-center gap-2 text-[12px] uppercase tracking-luxury text-champagne-300 hover:text-champagne-200">
            <ArrowLeft className="h-4 w-4" /> Back to deliveries
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ivory-200/80">{agent.name}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-[12px] font-bold text-white">{agent.name[0]}</span>
          </div>
        </div>
      </div>

      <div className="container-lux max-w-5xl py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl font-semibold text-espresso-800 sm:text-4xl">Order {order.id}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1.5 text-[13px] text-espresso-500">
              Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {order.payment}
            </p>
          </div>
          {!delivered && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] font-medium text-amber-700">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-amber-500" /> Awaiting delivery
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="card-lux p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-espresso-800">
                <Truck className="h-5 w-5 text-champagne-600" /> Delivery Progress
              </h2>
              <div className="flex items-center">
                {['placed', 'confirmed', 'assigned', 'out_for_delivery', 'delivered'].map((s, i) => {
                  const active = i + 1 <= statusStep
                  const isLast = i === 4
                  return (
                    <div key={s} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold ${active ? 'border-champagne-500 bg-champagne-500 text-white' : 'border-champagne-200 bg-white text-espresso-400'}`}>
                        {active && i + 1 <= 5 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      {!isLast && <span className={`mx-1 h-0.5 flex-1 rounded ${i + 1 < statusStep ? 'bg-champagne-500' : 'bg-champagne-200'}`} />}
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-espresso-400">
                <span>Placed</span><span>Confirmed</span><span>Assigned</span><span>Out</span><span>Delivered</span>
              </div>
              {delivered && (
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-[13px] font-medium text-emerald-700">
                  Delivered on {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '—'}
                </p>
              )}
            </div>

            <div className="card-lux p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-espresso-800">
                <MapPin className="h-5 w-5 text-champagne-600" /> Delivery Location
              </h2>
              <OrderMap
                destination={order.coords}
                agentPosition={myPosition}
                label={`${order.customerName} — ${order.address.line1}`}
                className="h-72 w-full"
              />
              <p className="mt-3 flex items-start gap-2 text-sm text-espresso-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                {order.address.line1}, {order.address.city} — {order.address.pincode}
              </p>

              {order.status === 'out_for_delivery' && (
                <div className="mt-4 rounded-xl border border-champagne-200/70 bg-champagne-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-espresso-800">
                      <Navigation className={`h-4 w-4 ${sharing ? 'text-emerald-600' : 'text-espresso-400'}`} />
                      {sharing ? 'Sharing your live location' : 'Share your live location'}
                    </div>
                    <button
                      onClick={toggleSharing}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        sharing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-gold !py-1.5 !px-4 !text-xs'
                      }`}
                    >
                      {sharing ? 'Stop sharing' : 'Start sharing'}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-espresso-500">
                    {sharing
                      ? lastSharedAt
                        ? `Last updated ${lastSharedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — updates roughly every 15 seconds.`
                        : 'Getting your position…'
                      : 'Saves your position to this order every ~15 seconds while sharing is on.'}
                  </p>
                  {locationError && <p className="mt-1.5 text-xs font-medium text-rose-600">{locationError}</p>}
                </div>
              )}
            </div>

            <div className="card-lux p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-espresso-800">
                <User className="h-5 w-5 text-champagne-600" /> Customer
              </h2>
              <p className="text-sm font-medium text-espresso-800">{order.customerName}</p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-espresso-600"><Phone className="h-4 w-4 text-champagne-600" /> {order.customerPhone}</p>
              <div className="mt-4 rounded-xl border border-champagne-200/70 bg-white/70 p-4">
                <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Items to deliver</p>
                <div className="mt-3 space-y-2.5">
                  {order.items.map((it) => (
                    <div key={it.productId} className="flex items-center gap-3">
                      <img src={it.image} alt={it.name} className="h-12 w-10 rounded-lg border border-champagne-200 object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-espresso-800">{it.name}</p>
                        <p className="text-[11px] text-espresso-400">Qty {it.qty}</p>
                      </div>
                      <span className="text-sm font-semibold text-espresso-800">{fmtINR(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t border-champagne-200 pt-3 text-sm font-semibold text-espresso-900">
                  <span>Total ({order.payment})</span><span>{fmtINR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-lux overflow-hidden">
              <div className="bg-gold-gradient px-6 py-4">
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-white">
                  <QrCode className="h-5 w-5" /> Verify Customer Order
                </h2>
                <p className="text-[12px] text-white/80">Scan the QR code from the customer&apos;s digital receipt to confirm identity before delivery.</p>
              </div>
              <div className="p-6">
                {!verified ? (
                  <>
                    <div className="flex gap-3">
                      <button onClick={scanning ? stopScan : startScan} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-[12px] font-semibold uppercase tracking-wider transition-all ${scanning ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-champagne-400 bg-champagne-50 text-champagne-800 hover:bg-champagne-100'}`}>
                        <Camera className="h-4 w-4" /> {scanning ? 'Stop Camera' : 'Scan QR Code'}
                      </button>
                    </div>
                    <div id="agent-qr-reader" className={`mt-4 overflow-hidden rounded-2xl border border-champagne-200 ${scanning ? 'block' : 'hidden'}`} />

                    <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-espresso-400">
                      <span className="h-px flex-1 bg-champagne-200" /> or <span className="h-px flex-1 bg-champagne-200" />
                    </div>

                    <div className="mt-4">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-espresso-600">
                        <Keyboard className="h-3.5 w-3.5 text-champagne-600" /> Enter QR code manually
                      </p>
                      <div className="flex gap-2">
                        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. SARIKA|orderId|token" className="input-lux flex-1 font-mono !text-[12px]" />
                        <button onClick={() => manual && attemptVerify(manual.trim())} className="btn-dark !px-5 !py-2.5">Verify</button>
                      </div>
                    </div>

                    <button
                      onClick={() => attemptVerify(order.qr)}
                      className="mt-3 w-full rounded-2xl border border-dashed border-champagne-400/70 bg-ivory-100/60 px-4 py-3 text-[12px] font-medium text-champagne-700 transition-colors hover:bg-champagne-50"
                    >
                      Demo: simulate scan with this order&apos;s QR
                    </button>

                    {verifyError && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 animate-fade-in">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                        <p className="text-[13px] font-medium text-rose-600">{verifyError}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="animate-zoom-in">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-700">Order Verified</p>
                        <p className="mt-1 text-[13px] text-emerald-800">
                          Identity confirmed for <strong>{verified.customerName}</strong> — this matches order {verified.id} and the customer&apos;s registered phone.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-champagne-200 bg-white/70 p-4">
                      <p className="flex items-center gap-2 text-sm text-espresso-600"><ShieldCheck className="h-4 w-4 text-champagne-600" /> Verified at {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
                      <p className="mt-1 text-sm text-espresso-600">Order value: <strong>{fmtINR(verified.total)}</strong> · Payment: {verified.payment}</p>
                    </div>
                    <button onClick={markDelivered} disabled={confirming} className="btn-gold mt-4 w-full !py-4 disabled:opacity-60">
                      <CheckCircle2 className="h-5 w-5" /> {confirming ? 'Confirming…' : 'Confirm Delivery'}
                    </button>
                    <button onClick={() => { setVerified(null); setManual('') }} className="btn-outline mt-2 w-full !py-2.5">
                      Verify another order
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card-lux p-6">
              <h2 className="mb-3 font-serif text-xl font-semibold text-espresso-800">Delivery Notes</h2>
              <ul className="space-y-2.5 text-[13px] leading-relaxed text-espresso-600">
                <li>• Verify the QR code with the customer before handing over the parcel.</li>
                <li>• For COD orders, confirm the exact amount of <strong>{fmtINR(order.total)}</strong> in cash / UPI.</li>
                <li>• Take a photo of the delivered parcel if required by the store.</li>
                <li>• If the customer is unreachable, return to the hub by evening.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
