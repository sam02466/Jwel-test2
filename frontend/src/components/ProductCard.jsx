import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Plus, Check } from 'lucide-react'
import { useState } from 'react'
import { fmtINR } from '../data/store'
import { Stars } from './Reveal'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [wished, setWished] = useState(false)

  const quickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
    toast(`${product.name} added to cart`)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-champagne-200/60 bg-white shadow-card transition-all duration-500 hover:shadow-cardHover hover:-translate-y-1.5 animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-champagne-100">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.badge && (
              <span className="badge-lux bg-espresso-800/90 !text-ivory-100 border-espresso-800/90 backdrop-blur">
                {product.badge}
              </span>
            )}
            {product.isNew && !product.badge && (
              <span className="badge-lux bg-white/90 backdrop-blur">New</span>
            )}
            {discount > 0 && (
              <span className="badge-lux bg-rose-700/90 !text-white border-rose-700/90 backdrop-blur">
                {discount}% off
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              setWished((w) => !w)
            }}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur transition-all duration-300 hover:scale-110 ${
              wished ? 'text-rosegold' : 'text-espresso-500'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${wished ? 'fill-rosegold' : ''}`} />
          </button>

          <div className="absolute inset-x-3 bottom-3 translate-y-14 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={quickAdd}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-[11px] font-semibold uppercase tracking-widest text-white shadow-gold backdrop-blur transition-all duration-300 ${
                added ? 'bg-emerald-600' : 'bg-espresso-800/90 hover:bg-champagne-600'
              }`}
            >
              {added ? <><Check className="h-4 w-4" /> Added to cart</> : <><ShoppingBag className="h-4 w-4" /> Quick Add</>}
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-luxury text-champagne-600">{product.category}</p>
          <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-espresso-800 transition-colors group-hover:text-champagne-700 line-clamp-1">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={product.rating} size={13} />
            <span className="text-[11px] text-espresso-400">({product.reviews})</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-espresso-800">{fmtINR(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-[13px] text-espresso-400 line-through">{fmtINR(product.mrp)}</span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={() => navigate(`/product/${product.id}`)}
        className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-gold-gradient text-white opacity-0 shadow-goldSm transition-all duration-500 hover:scale-110 group-hover:translate-y-0 group-hover:opacity-100"
        aria-label="View product"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
