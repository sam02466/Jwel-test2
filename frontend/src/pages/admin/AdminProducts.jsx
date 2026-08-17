import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Star, X, Gem } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../components/Toast'
import { fmtINR } from '../../data/store'

export default function AdminProducts() {
  const { products, deleteProduct, updateProduct } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [toDelete, setToDelete] = useState(null)

  const cats = useMemo(() => ['all', ...new Set(products.map((p) => p.category))], [products])

  const list = useMemo(() => {
    let l = [...products]
    if (cat !== 'all') l = l.filter((p) => p.category === cat)
    if (q) {
      const t = q.toLowerCase()
      l = l.filter((p) => p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t))
    }
    return l
  }, [products, q, cat])

  const confirmDelete = async () => {
    try {
      await deleteProduct(toDelete.id)
      toast(`${toDelete.name} removed`)
    } catch (err) {
      // e.g. this product appears in past orders — the backend blocks a
      // hard delete on purpose so order history is never orphaned (see
      // backend app/api/products/[id]/route.ts).
      toast(err.message || 'Could not delete this product.', 'error')
    } finally {
      setToDelete(null)
    }
  }

  const toggleFeatured = async (p) => {
    try {
      await updateProduct(p.id, { featured: !p.featured })
      toast(`${p.name} ${p.featured ? 'removed from' : 'added to'} featured`)
    } catch (err) {
      toast(err.message || 'Could not update this product.', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-espresso-800">Product Catalogue</h1>
          <p className="mt-1 text-[13px] text-espresso-500">{products.length} pieces across {cats.length - 1} collections.</p>
        </div>
        <button onClick={() => navigate('/admin/products/new')} className="btn-gold !py-2.5">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input-lux w-64 !pl-10 !py-2.5" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input-lux w-auto !py-2.5 text-[13px]">
          {cats.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-champagne-200/60 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-champagne-100 bg-ivory-100/60 text-[11px] uppercase tracking-wider text-espresso-400">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Rating</th>
                <th className="px-4 py-3.5">Featured</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-champagne-100/60 transition-colors hover:bg-champagne-50/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="h-12 w-12 rounded-xl border border-champagne-200 object-cover" />
                      <div>
                        <p className="font-medium text-espresso-800">{p.name}</p>
                        <p className="text-[11px] text-espresso-400">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-lux">{p.category}</span></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-espresso-800">{fmtINR(p.price)}</p>
                    {p.mrp > p.price && <p className="text-[11px] text-espresso-400 line-through">{fmtINR(p.mrp)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-lux ${p.stock > 5 ? '!bg-emerald-50 !text-emerald-700 !border-emerald-200' : p.stock > 0 ? '!bg-amber-50 !text-amber-700 !border-amber-200' : '!bg-rose-50 !text-rose-700 !border-rose-200'}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-espresso-600">{p.rating} ★ ({p.reviews})</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFeatured(p)} className={`rounded-full p-2 transition-colors ${p.featured ? 'text-champagne-600' : 'text-espresso-300 hover:text-champagne-500'}`} aria-label="Toggle featured">
                      <Star className={`h-5 w-5 ${p.featured ? 'fill-champagne-500' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/admin/products/${p.id}/edit`)} className="rounded-xl border border-champagne-200 p-2 text-espresso-600 transition-colors hover:border-champagne-400 hover:text-champagne-700" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setToDelete(p)} className="rounded-xl border border-rose-200 p-2 text-rose-500 transition-colors hover:bg-rose-50" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="p-16 text-center">
            <Gem className="mx-auto h-10 w-10 text-champagne-300" />
            <p className="mt-3 text-espresso-500">No products match your filters.</p>
          </div>
        )}
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-espresso-900/50 backdrop-blur-sm" onClick={() => setToDelete(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-ivory-50 p-7 text-center shadow-2xl animate-zoom-in">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </span>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-espresso-800">Delete product?</h3>
            <p className="mt-2 text-sm text-espresso-500">
              “{toDelete.name}” will be permanently removed from the catalogue.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setToDelete(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 rounded-full bg-rose-600 px-6 py-3 text-[12px] font-medium uppercase tracking-luxury text-white transition-all hover:bg-rose-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
