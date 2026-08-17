import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Landmark, Wallet, Lock, ChevronRight, MapPin, User, Phone, ArrowRight, LocateFixed } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../components/Toast'
import { fmtINR } from '../../data/store'
import { addRecentOrder } from '../../data/store'
import { api, ApiError } from '../../lib/api'
import { openRazorpayCheckout } from '../../lib/razorpay'

const PAYMENTS = [
  { key: 'UPI', label: 'UPI', icon: Wallet, note: 'GPay, PhonePe, Paytm' },
  { key: 'Card', label: 'Card', icon: CreditCard, note: 'Credit / Debit' },
  { key: 'COD', label: 'Cash on Delivery', icon: Landmark, note: 'Pay when it arrives' }
]

export default function Checkout() {
  const { items, subtotal, count, clearCart } = useCart()
  const { isCustomer, currentCustomer } = useAuth()
  const { placeOrder } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const customer = isCustomer ? currentCustomer() : null

  const [form, setForm] = useState({
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    line1: customer?.address?.line1 || '',
    city: customer?.address?.city || 'Kolkata',
    pincode: customer?.address?.pincode || ''
  })
  const [payment, setPayment] = useState('UPI')
  const [placing, setPlacing] = useState(false)
  const [locating, setLocating] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // One-shot GPS lookup (not a continuous watch — checkout just needs
  // "where am I right now", unlike the delivery agent's continuous live
  // sharing during a delivery). Reverse-geocoded server-side via
  // Nominatim (see backend app/api/geocode/reverse/route.ts) rather than
  // calling it directly from the browser, so it goes through the same
  // rate limiting and User-Agent handling as the rest of the app's
  // Nominatim usage. Every field it fills stays editable — a reverse
  // geocode is a best guess, not a guarantee.
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      toast('Location is not supported on this device.', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { lat, lng } = { lat: position.coords.latitude, lng: position.coords.longitude }
          const address = await api.get(`/geocode/reverse?lat=${lat}&lng=${lng}`)
          setForm((f) => ({
            ...f,
            line1: address.line1 || f.line1,
            city: address.city || f.city,
            pincode: address.pincode || f.pincode
          }))
          toast('Address filled from your current location — please double-check it')
        } catch (err) {
          toast(err.message || 'Could not determine your address. Please enter it manually.', 'error')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        toast(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Enter your address manually below.'
            : 'Could not get your location. Please enter your address manually.',
          'error'
        )
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  if (items.length === 0) {
    return (
      <div className="texture-paper flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-espresso-800">Nothing to checkout yet</h1>
          <Link to="/shop" className="btn-gold mt-6">Explore Jewellery</Link>
        </div>
      </div>
    )
  }

  // Real flow, replacing the old fake setTimeout(): the order is created
  // server-side first (prices are recomputed from the DB there — never
  // trusted from the client), then for UPI/Card a real Razorpay Checkout
  // widget opens and the payment is verified server-side before the
  // order is marked paid. COD orders skip straight to confirmation,
  // same as before.
  const place = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.line1 || !form.pincode) {
      toast('Please complete all delivery details', 'error')
      return
    }
    setPlacing(true)
    try {
      const order = await placeOrder({
        customerName: form.fullName,
        phone: form.phone,
        email: form.email,
        addressLine1: form.line1,
        addressCity: form.city,
        addressPincode: form.pincode,
        paymentMethod: payment,
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty }))
      })
      addRecentOrder(order.id)

      if (payment === 'COD') {
        clearCart()
        navigate(`/order-receipt/${order.id}`)
        return
      }

      const { razorpayOrderId, amountPaise, keyId } = await api.post('/payments/create-order', { orderId: order.id })
      const verification = await openRazorpayCheckout({
        keyId,
        razorpayOrderId,
        amountPaise,
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        orderLabel: `Order #${order.id.slice(-6)}`
      })
      await api.post('/payments/verify', { orderId: order.id, ...verification })

      clearCart()
      navigate(`/order-receipt/${order.id}`)
    } catch (err) {
      // Order was created but payment didn't complete (cancelled/failed)
      // — cart is left intact so the customer can retry from here.
      toast(err instanceof ApiError ? err.message : err.message || 'Something went wrong. Please try again.', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux py-10 sm:py-14">
        <p className="eyebrow"><span className="h-px w-8 bg-champagne-500" /> Almost there</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">Checkout</h1>

        <form onSubmit={place} className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <div className="card-lux p-6 sm:p-8">
              <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-espresso-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-white">1</span>
                Contact Details
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                    <input value={form.fullName} onChange={set('fullName')} placeholder="e.g. Ananya Sharma" className="input-lux !pl-10" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Mobile Number</span>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                    <input value={form.phone} onChange={set('phone')} placeholder="+91 98XXX XXXXX" className="input-lux !pl-10" />
                  </div>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Email (for order updates)</span>
                  <input value={form.email} onChange={set('email')} type="email" placeholder="you@example.com" className="input-lux" />
                </label>
              </div>
            </div>

            <div className="card-lux p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-espresso-800">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-white">2</span>
                  Delivery Address
                </h2>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 rounded-full border border-champagne-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-champagne-700 transition-colors hover:border-champagne-400 hover:bg-champagne-50 disabled:opacity-60"
                >
                  {locating ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-champagne-300 border-t-champagne-700" />
                  ) : (
                    <LocateFixed className="h-3.5 w-3.5" />
                  )}
                  {locating ? 'Locating…' : 'Use my current location'}
                </button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Address</span>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                    <input value={form.line1} onChange={set('line1')} placeholder="House / street / landmark" className="input-lux !pl-10" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">City</span>
                  <input value={form.city} onChange={set('city')} className="input-lux" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">PIN Code</span>
                  <input value={form.pincode} onChange={set('pincode')} placeholder="700071" className="input-lux" />
                </label>
              </div>
              {!isCustomer && (
                <p className="mt-4 rounded-xl bg-champagne-50 px-4 py-2.5 text-[12px] text-champagne-800">
                  Already have an account?{' '}
                  <Link to="/auth" className="font-semibold underline underline-offset-2">Sign in</Link> to track your order faster.
                </p>
              )}
            </div>

            <div className="card-lux p-6 sm:p-8">
              <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-espresso-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-white">3</span>
                Payment Method
              </h2>
              <div className="mt-6 grid gap-3">
                {PAYMENTS.map((p) => (
                  <button
                    type="button"
                    key={p.key}
                    onClick={() => setPayment(p.key)}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                      payment === p.key
                        ? 'border-champagne-500 bg-champagne-50 shadow-goldSm'
                        : 'border-champagne-200/80 bg-white/60 hover:border-champagne-300'
                    }`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${payment === p.key ? 'bg-gold-gradient text-white' : 'bg-champagne-100 text-champagne-700'}`}>
                      <p.icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-espresso-800">{p.label}</span>
                      <span className="block text-[12px] text-espresso-500">{p.note}</span>
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${payment === p.key ? 'border-champagne-500' : 'border-champagne-300'}`}>
                      {payment === p.key && <span className="h-2.5 w-2.5 rounded-full bg-champagne-500" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-fit lg:sticky lg:top-40">
            <div className="card-lux p-6 sm:p-7">
              <h2 className="font-serif text-2xl font-semibold text-espresso-800">Your Order</h2>
              <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-champagne-200">
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                      <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-espresso-800 px-1 text-[10px] font-bold text-white">×{i.qty}</span>
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-espresso-800">{i.name}</p>
                      <p className="text-[12px] text-espresso-400">{fmtINR(i.price)} each</p>
                    </div>
                    <span className="text-sm font-semibold text-espresso-800">{fmtINR(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="divider-lux my-5" />
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-espresso-600"><span>Subtotal ({count})</span><span>{fmtINR(subtotal)}</span></div>
                <div className="flex justify-between text-espresso-600"><span>Shipping</span><span className="text-emerald-600">Free</span></div>
                <div className="flex justify-between text-espresso-600"><span>Taxes</span><span>Included</span></div>
                <div className="divider-lux" />
                <div className="flex justify-between text-lg font-semibold text-espresso-900"><span>Total</span><span>{fmtINR(subtotal)}</span></div>
              </div>
              <button
                type="submit"
                disabled={placing}
                className="btn-gold mt-6 w-full disabled:opacity-70"
              >
                {placing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Placing your order…
                  </span>
                ) : (
                  <><Lock className="h-4 w-4" /> Place Order · {fmtINR(subtotal)}</>
                )}
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-espresso-400">
                <Lock className="h-3 w-3" /> 256-bit encrypted · Insured delivery
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
