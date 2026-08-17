import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, RefreshCcw, BadgeCheck, Heart, ChevronRight, Gem } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/Toast'
import { fmtINR } from '../../data/store'
import { Stars } from '../../components/Reveal'
import ProductCard from '../../components/ProductCard'
import SectionHeading from '../../components/SectionHeading'

export default function ProductDetail() {
  const { id } = useParams()
  const { products } = useData()
  const { addToCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id)
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [wished, setWished] = useState(false)

  const related = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : []),
    [product, products]
  )

  if (!product) {
    return (
      <div className="container-lux flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Gem className="h-12 w-12 text-champagne-300" />
        <h1 className="mt-4 font-serif text-3xl text-espresso-800">Piece not found</h1>
        <Link to="/shop" className="btn-gold mt-6">Back to Shop</Link>
      </div>
    )
  }

  const discount = Math.round((1 - product.price / product.mrp) * 100)
  const images = product.images.length > 1 ? product.images : [product.images[0], product.images[0]]

  const buyNow = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux pt-6">
        <nav className="flex items-center gap-1.5 text-[12px] tracking-wider text-espresso-500">
          <Link to="/" className="hover:text-champagne-700">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="hover:text-champagne-700">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/shop?cat=${encodeURIComponent(product.category)}`} className="hover:text-champagne-700">{product.category}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-espresso-800">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="animate-fade-up">
            <div className="relative overflow-hidden rounded-[2rem] border border-champagne-200/60 bg-champagne-100 shadow-card">
              <div key={active} className="relative aspect-square animate-fade-in">
                <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
              </div>
              {product.badge && (
                <span className="absolute left-5 top-5 badge-lux bg-espresso-800/90 !text-ivory-100 border-espresso-800/90">{product.badge}</span>
              )}
              <button
                onClick={() => setWished((w) => !w)}
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-espresso-600 shadow-card backdrop-blur transition-all hover:scale-110"
              >
                <Heart className={`h-5 w-5 ${wished ? 'fill-rosegold text-rosegold' : ''}`} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`overflow-hidden rounded-2xl border-2 transition-all duration-300 ${active === i ? 'border-champagne-500 shadow-goldSm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <p className="text-[11px] font-medium uppercase tracking-luxury text-champagne-600">{product.category}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-espresso-800 sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <Stars rating={product.rating} size={16} />
              <span className="text-sm text-espresso-500">{product.rating} · {product.reviews} reviews</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-serif text-4xl font-semibold text-champagne-700">{fmtINR(product.price)}</span>
              {product.mrp > product.price && (
                <>
                  <span className="mb-1 text-lg text-espresso-400 line-through">{fmtINR(product.mrp)}</span>
                  <span className="mb-1 badge-lux bg-emerald-100 !text-emerald-700 border-emerald-200">Save {discount}%</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[12px] text-espresso-400">Inclusive of all taxes · EMI available from ₹{Math.round(product.price / 12 / 100) * 100}/mo</p>

            <div className="divider-lux my-7" />

            <p className="text-[15px] leading-relaxed text-espresso-600">{product.description}</p>

            <div className="mt-7 rounded-2xl border border-champagne-200/70 bg-white/70 p-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Specifications</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {Object.entries(product.details).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 border-b border-champagne-100 pb-2 text-sm">
                    <dt className="text-espresso-400">{k}</dt>
                    <dd className="text-right font-medium text-espresso-700">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-champagne-300 bg-white px-2 py-1.5">
                <button onClick={() => setQty((x) => Math.max(1, x - 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-espresso-600 transition-colors hover:bg-champagne-100" aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-espresso-800">{qty}</span>
                <button onClick={() => setQty((x) => Math.min(10, x + 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-espresso-600 transition-colors hover:bg-champagne-100" aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => { addToCart(product, qty); toast(`${product.name} added to cart`) }}
                className="btn-dark flex-1 sm:flex-none"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
              <button onClick={buyNow} className="btn-gold flex-1 sm:flex-none">
                Buy Now
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Truck, t: 'Free Insured Shipping' },
                { icon: BadgeCheck, t: 'Hallmark Certified' },
                { icon: RefreshCcw, t: '30-Day Returns' },
                { icon: ShieldCheck, t: 'Authenticity Card' }
              ].map((f) => (
                <div key={f.t} className="flex flex-col items-center gap-2 rounded-2xl border border-champagne-200/70 bg-white/60 p-3 text-center">
                  <f.icon className="h-5 w-5 text-champagne-600" />
                  <span className="text-[11px] text-espresso-600">{f.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="container-lux mt-24">
          <SectionHeading eyebrow="Complete the look" title="You May Also Love" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
