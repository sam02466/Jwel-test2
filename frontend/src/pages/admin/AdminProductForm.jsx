import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, ImageIcon } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../components/Toast'
import { CATEGORIES } from '../../data/products'
import { fmtINR } from '../../data/store'

const IMG_POOL = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
  'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  'https://images.unsplash.com/photo-1512163143273-bde0e3cc7407',
  'https://images.unsplash.com/photo-1620656798579-1984d9e87df7',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9',
  'https://images.unsplash.com/photo-1615813967515-e1838c1c5116'
]
const imgUrl = (id) => `${id}?auto=format&fit=crop&w=1000&q=80`

const DEFAULT_DETAILS = [
  ['Metal', '22K Gold Plated'],
  ['Purity', 'BIS Hallmarked'],
  ['Weight', '20 g approx.'],
  ['Stones', 'Zircon'],
  ['Origin', 'Handcrafted in Jaipur']
]

export default function AdminProductForm() {
  const { id } = useParams()
  const { products, createProduct, updateProduct } = useData()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = id ? products.find((p) => p.id === id) : null

  const [form, setForm] = useState(() =>
    existing
      ? {
          name: existing.name,
          category: existing.category,
          price: existing.price,
          mrp: existing.mrp,
          badge: existing.badge || '',
          rating: existing.rating,
          reviews: existing.reviews,
          stock: existing.stock,
          description: existing.description,
          images: existing.images.map((i) => i.split('?')[0]),
          details: Object.entries(existing.details),
          featured: existing.featured,
          isNew: existing.isNew
        }
      : {
          name: '',
          category: 'Necklaces',
          price: '',
          mrp: '',
          badge: '',
          rating: 4.7,
          reviews: 0,
          stock: 10,
          description: '',
          images: [IMG_POOL[0], IMG_POOL[2], IMG_POOL[1]],
          details: DEFAULT_DETAILS.map((d) => [...d]),
          featured: false,
          isNew: true
        }
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setImg = (i, v) => setForm((f) => ({ ...f, images: f.images.map((x, idx) => (idx === i ? v : x)) }))

  const save = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category) {
      toast('Please provide a name, category and price', 'error')
      return
    }
    const cleanImages = form.images.map((i) => (i.startsWith('http') ? i : imgUrl(i))).filter(Boolean)
    const product = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      images: cleanImages.length ? cleanImages : [imgUrl(IMG_POOL[0])],
      badge: form.badge || (form.isNew ? 'New' : null),
      rating: Number(form.rating) || 4.7,
      reviews: Number(form.reviews) || 0,
      description: form.description || `${form.name} — handcrafted with love by Sarika Beauty Hub artisans.`,
      details: Object.fromEntries(form.details.filter(([k]) => k.trim())),
      featured: form.featured,
      isNew: form.isNew,
      stock: Number(form.stock) || 0
    }
    try {
      if (existing) {
        await updateProduct(existing.id, product)
        toast('Product updated')
      } else {
        await createProduct(product)
        toast('Product added to catalogue')
      }
      navigate('/admin/products')
    } catch (err) {
      toast(err.message || 'Could not save this product. Please try again.', 'error')
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/admin/products')} className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-luxury text-champagne-700 hover:text-champagne-800">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </button>
      <h1 className="font-serif text-3xl font-semibold text-espresso-800">{existing ? `Edit ${existing.name}` : 'Add New Product'}</h1>

      <form onSubmit={save} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="card-lux p-6 sm:p-7">
            <h2 className="mb-5 font-serif text-xl font-semibold text-espresso-800">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Product Name *</span>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Zara Gold Choker" className="input-lux" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Category *</span>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-lux">
                  {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Badge</span>
                <input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="Bestseller / Exclusive / New" className="input-lux" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Selling Price (₹) *</span>
                <input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" min="0" placeholder="15000" className="input-lux" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">MRP (₹)</span>
                <input value={form.mrp} onChange={(e) => set('mrp', e.target.value)} type="number" min="0" placeholder="20000" className="input-lux" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Stock</span>
                <input value={form.stock} onChange={(e) => set('stock', e.target.value)} type="number" min="0" className="input-lux" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Rating</span>
                <input value={form.rating} onChange={(e) => set('rating', e.target.value)} type="number" step="0.1" min="0" max="5" className="input-lux" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Description</span>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows="4" className="input-lux resize-none" placeholder="Tell the story of this piece…" />
              </label>
            </div>
          </div>

          <div className="card-lux p-6 sm:p-7">
            <h2 className="mb-5 font-serif text-xl font-semibold text-espresso-800">Specifications</h2>
            <div className="space-y-2.5">
              {form.details.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input value={d[0]} onChange={(e) => setForm((f) => ({ ...f, details: f.details.map((x, idx) => (idx === i ? [e.target.value, x[1]] : x)) }))} placeholder="Field (e.g. Metal)" className="input-lux w-1/2 !py-2.5" />
                  <input value={d[1]} onChange={(e) => setForm((f) => ({ ...f, details: f.details.map((x, idx) => (idx === i ? [x[0], e.target.value] : x)) }))} placeholder="Value (e.g. 22K Gold)" className="input-lux flex-1 !py-2.5" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, details: f.details.filter((_, idx) => idx !== i) }))} className="rounded-xl border border-rose-200 p-2 text-rose-500 hover:bg-rose-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setForm((f) => ({ ...f, details: [...f.details, ['', '']] }))} className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-champagne-700 hover:text-champagne-800">
                <Plus className="h-4 w-4" /> Add specification
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-lux p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-espresso-800">Images</h2>
            <div className="grid grid-cols-3 gap-3">
              {form.images.map((img, i) => (
                <div key={i}>
                  <div className="aspect-square overflow-hidden rounded-xl border border-champagne-200 bg-champagne-50">
                    {img ? (
                      <img src={img.startsWith('http') ? img : imgUrl(img)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-champagne-300"><ImageIcon className="h-6 w-6" /></span>
                    )}
                  </div>
                  <input value={img} onChange={(e) => setImg(i, e.target.value)} placeholder="Image URL" className="input-lux mt-2 !px-2.5 !py-1.5 !text-[11px]" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="w-full text-[11px] text-espresso-400">Quick pick (samples):</p>
              {IMG_POOL.slice(0, 6).map((s) => (
                <button key={s} type="button" onClick={() => setImg(0, s)} className="h-12 w-12 overflow-hidden rounded-lg border border-champagne-200 hover:border-champagne-500">
                  <img src={imgUrl(s)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="card-lux p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-espresso-800">Visibility</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-champagne-200 bg-white/70 p-3.5">
                <div>
                  <p className="text-sm font-medium text-espresso-800">Featured on homepage</p>
                  <p className="text-[11px] text-espresso-400">Show in the featured carousel</p>
                </div>
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="h-5 w-5 accent-[#b8934f]" />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-champagne-200 bg-white/70 p-3.5">
                <div>
                  <p className="text-sm font-medium text-espresso-800">Mark as New Arrival</p>
                  <p className="text-[11px] text-espresso-400">Show the “New” badge</p>
                </div>
                <input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} className="h-5 w-5 accent-[#b8934f]" />
              </label>
            </div>
            {form.price && (
              <div className="mt-5 rounded-2xl bg-champagne-50 p-4 text-center">
                <p className="text-[11px] uppercase tracking-luxury text-champagne-700">Live price preview</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-champagne-800">{fmtINR(form.price)}</p>
              </div>
            )}
          </div>

          <button type="submit" className="btn-gold w-full">
            <Save className="h-4 w-4" /> {existing ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
