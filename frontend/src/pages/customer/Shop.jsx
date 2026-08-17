import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Search, PackageSearch } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import { CATEGORIES } from '../../data/products'
import { useData } from '../../context/DataContext'
import { Reveal } from '../../components/Reveal'

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' }
]

const PRICE_BANDS = [
  { key: 'all', label: 'All Prices', min: 0, max: Infinity },
  { key: 'u10k', label: 'Under ₹10,000', min: 0, max: 10000 },
  { key: '10-30k', label: '₹10,000 – ₹30,000', min: 10000, max: 30000 },
  { key: '30-60k', label: '₹30,000 – ₹60,000', min: 30000, max: 60000 },
  { key: '60k', label: 'Above ₹60,000', min: 60000, max: Infinity }
]

export default function Shop() {
  const { products } = useData()
  const [params, setParams] = useSearchParams()
  const [mobileFilters, setMobileFilters] = useState(false)
  const [priceBand, setPriceBand] = useState('all')
  const [sortKey, setSortKey] = useState('featured')

  const q = params.get('q') || ''
  const cat = params.get('cat') || ''

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const results = useMemo(() => {
    let list = [...products]
    if (q) {
      const t = q.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          p.category.toLowerCase().includes(t) ||
          p.description.toLowerCase().includes(t) ||
          Object.values(p.details).some((v) => String(v).toLowerCase().includes(t))
      )
    }
    if (cat) {
      list = list.filter((p) => p.category === cat)
    }
    const band = PRICE_BANDS.find((b) => b.key === priceBand)
    if (band) list = list.filter((p) => p.price >= band.min && p.price < band.max)

    switch (sortKey) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'new':
        list.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.rating - a.rating)
        break
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
    }
    return list
  }, [products, q, cat, priceBand, sortKey])

  const activeCat = (name) => (cat === name ? 'text-champagne-800' : '')
  const clearAll = () => {
    setParams({})
    setPriceBand('all')
    setSortKey('featured')
  }

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Category</h4>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { setParams((p) => { const n = new URLSearchParams(p); n.delete('cat'); return n }) }}
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-champagne-100/60 ${!cat ? 'bg-champagne-100/80 font-medium text-champagne-800' : 'text-espresso-600'}`}
          >
            All Collections
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('cat', c.name); return n })}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-champagne-100/60 ${activeCat(c.name)}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Price</h4>
        <div className="flex flex-col gap-1">
          {PRICE_BANDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setPriceBand(b.key)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-champagne-100/60 ${priceBand === b.key ? 'bg-champagne-100/80 font-medium text-champagne-800' : 'text-espresso-600'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={clearAll} className="btn-outline w-full !py-2.5">
        Clear all filters
      </button>
    </div>
  )

  return (
    <div className="texture-paper min-h-screen">
      <div className="border-b border-champagne-200/60 bg-gradient-to-b from-champagne-100/60 to-transparent">
        <div className="container-lux py-10 sm:py-14">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-8 bg-champagne-500" /> The Boutique
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">
              {cat || (q ? `Results for “${q}”` : 'All Jewellery')}
            </h1>
            <p className="mt-3 text-[15px] text-espresso-500">
              {results.length} {results.length === 1 ? 'piece' : 'pieces'} · crafted with love in Jaipur
            </p>
          </Reveal>
        </div>
      </div>

      <div className="container-lux grid gap-10 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-40">{filterPanel}</div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setMobileFilters(true)}
              className="btn-outline !py-2.5 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <div className="relative ml-auto">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="input-lux w-auto appearance-none !py-2.5 pr-10 text-[13px]"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>Sort: {s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-600" />
            </div>
          </div>

          {(q || cat) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {q && (
                <span className="badge-lux">“{q}” <button onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.delete('q'); return n })}><X className="h-3 w-3" /></button></span>
              )}
              {cat && (
                <span className="badge-lux">{cat} <button onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.delete('cat'); return n })}><X className="h-3 w-3" /></button></span>
              )}
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-champagne-200/70 bg-white/70 px-6 py-24 text-center">
              <PackageSearch className="h-14 w-14 text-champagne-300" />
              <h3 className="mt-5 font-serif text-2xl font-semibold text-espresso-800">No pieces found</h3>
              <p className="mt-2 max-w-sm text-sm text-espresso-500">
                We couldn&apos;t find anything matching your filters. Try a different search or explore the full collection.
              </p>
              <button onClick={clearAll} className="btn-gold mt-6">View All Jewellery</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-espresso-900/40 backdrop-blur-sm" onClick={() => setMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-ivory-50 p-6 shadow-2xl animate-fade-up">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-serif text-2xl font-semibold text-espresso-800">Filters</h3>
              <button onClick={() => setMobileFilters(false)} className="rounded-full bg-champagne-100 p-2 text-espresso-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <button onClick={() => setMobileFilters(false)} className="btn-gold mt-6 w-full">
              Show {results.length} pieces
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
