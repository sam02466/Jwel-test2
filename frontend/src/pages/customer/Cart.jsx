import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Gem } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { fmtINR } from '../../data/store'
import { useToast } from '../../components/Toast'
import { Reveal } from '../../components/Reveal'

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, count } = useCart()
  const toast = useToast()

  if (items.length === 0) {
    return (
      <div className="texture-paper flex min-h-[70vh] items-center justify-center">
        <div className="text-center animate-fade-up">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-champagne-100">
            <ShoppingBag className="h-10 w-10 text-champagne-500" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-espresso-800">Your bag is empty</h1>
          <p className="mt-3 text-espresso-500">Fill it with something beautiful — your collection awaits.</p>
          <Link to="/shop" className="btn-gold mt-8">Start Shopping <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux py-10 sm:py-14">
        <Reveal>
          <p className="eyebrow"><span className="h-px w-8 bg-champagne-500" /> Your Selection</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">Shopping Bag</h1>
          <p className="mt-2 text-[15px] text-espresso-500">{count} {count === 1 ? 'item' : 'items'} in your bag</p>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="card-lux flex gap-4 p-4 sm:gap-5 sm:p-5 animate-fade-up">
                <Link to={`/product/${item.productId}`} className="block h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-28">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-luxury text-champagne-600">{item.category}</p>
                      <Link to={`/product/${item.productId}`}>
                        <h3 className="mt-0.5 font-serif text-lg font-semibold text-espresso-800 hover:text-champagne-700">{item.name}</h3>
                      </Link>
                    </div>
                    <button
                      onClick={() => { removeItem(item.productId); toast('Removed from bag', 'error') }}
                      className="rounded-full p-2 text-espresso-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center rounded-full border border-champagne-300 bg-white px-1.5 py-1">
                      <button onClick={() => updateQty(item.productId, item.qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-espresso-600 hover:bg-champagne-100" aria-label="Decrease">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, item.qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-espresso-600 hover:bg-champagne-100" aria-label="Increase">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-espresso-800">{fmtINR(item.price * item.qty)}</p>
                      <p className="text-[12px] text-espresso-400">{fmtINR(item.price)} each</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/shop" className="mt-2 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide2 text-champagne-700 hover:text-champagne-800">
              <ArrowRight className="h-4 w-4 rotate-180" /> Continue shopping
            </Link>
          </div>

          <div className="h-fit lg:sticky lg:top-40">
            <div className="card-lux p-6 sm:p-7 animate-fade-up" style={{ animationDelay: '120ms' }}>
              <h2 className="font-serif text-2xl font-semibold text-espresso-800">Order Summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-espresso-600">
                  <span>Subtotal ({count} items)</span>
                  <span className="font-medium text-espresso-800">{fmtINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-espresso-600">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between text-espresso-600">
                  <span>Taxes</span>
                  <span className="font-medium text-espresso-800">Included</span>
                </div>
                <div className="divider-lux" />
                <div className="flex justify-between text-base font-semibold text-espresso-900">
                  <span>Total</span>
                  <span>{fmtINR(subtotal)}</span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-champagne-50 px-4 py-2.5 text-[12px] text-champagne-800">
                Apply code <strong>SARIKA10</strong> for 10% off your first order
              </div>
              <Link to="/checkout" className="btn-gold mt-6 w-full">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-espresso-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-champagne-600" /> Secure checkout</span>
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-champagne-600" /> Free shipping</span>
                <span className="flex items-center gap-1.5"><Gem className="h-3.5 w-3.5 text-champagne-600" /> Insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
