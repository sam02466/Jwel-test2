import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IndianRupee, ShoppingCart, PackageCheck, Truck, TrendingUp, ArrowUpRight, Gem, Users, Star } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { fmtINR } from '../../data/store'
import StatusBadge from '../../components/StatusBadge'

export default function AdminDashboard() {
  const { orders, products, agents } = useData()

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered')
    const pending = orders.filter((o) => ['placed', 'confirmed'].includes(o.status))
    const out = orders.filter((o) => ['assigned', 'out_for_delivery'].includes(o.status))
    const revenue = delivered.reduce((s, o) => s + o.total, 0)
    return { total: orders.length, revenue, pending: pending.length, out: out.length, delivered: delivered.length }
  }, [orders])

  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    })
    const data = days.map((label, idx) => {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - (6 - idx))
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      const value = orders
        .filter((o) => o.status === 'delivered')
        .filter((o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd)
        .reduce((s, o) => s + o.total, 0)
      return { label, value }
    })
    return data
  }, [orders])

  const maxChart = Math.max(...chart.map((d) => d.value), 1)

  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const statusDist = useMemo(() => {
    const counts = {}
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1 })
    return counts
  }, [orders])

  const topProducts = useMemo(() => {
    const map = {}
    orders.forEach((o) => o.items.forEach((i) => { map[i.name] = (map[i.name] || 0) + i.qty }))
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [orders])

  const kpis = [
    { label: 'Total Revenue', value: fmtINR(stats.revenue), sub: `${stats.delivered} delivered orders`, icon: IndianRupee, tint: 'from-emerald-500 to-teal-600' },
    { label: 'Total Orders', value: stats.total, sub: 'All time', icon: ShoppingCart, tint: 'from-champagne-500 to-amber-600' },
    { label: 'Pending Action', value: stats.pending, sub: 'Need confirmation', icon: PackageCheck, tint: 'from-sky-500 to-blue-600' },
    { label: 'In Transit', value: stats.out, sub: `${agents.length} active agents`, icon: Truck, tint: 'from-violet-500 to-purple-600' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-espresso-800">Overview</h1>
          <p className="mt-1 text-[13px] text-espresso-500">A snapshot of your boutique's performance.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/products" className="btn-outline !py-2">Manage Products</Link>
          <Link to="/admin/orders" className="btn-gold !py-2">View Orders</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className="card-lux relative overflow-hidden p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-luxury text-espresso-400">{k.label}</p>
                <p className="mt-2 font-serif text-3xl font-semibold text-espresso-900">{k.value}</p>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600"><TrendingUp className="h-3.5 w-3.5" /> {k.sub}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${k.tint} text-white shadow-md`}>
                <k.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-lux p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-espresso-800">Sales — Last 7 Days</h2>
              <p className="text-[12px] text-espresso-400">Delivered order revenue</p>
            </div>
            <span className="badge-lux"><ArrowUpRight className="h-3 w-3" /> Live</span>
          </div>
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {chart.map((d, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-espresso-500 opacity-0 transition-opacity group-hover:opacity-100">
                  {d.value ? fmtINR(d.value) : '—'}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-champagne-700 to-champagne-400 transition-all duration-700 hover:from-champagne-800 hover:to-champagne-500"
                  style={{ height: `${Math.max((d.value / maxChart) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-espresso-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-lux p-6">
          <h2 className="font-serif text-xl font-semibold text-espresso-800">Order Status</h2>
          <div className="mt-5 space-y-3.5">
            {[
              { k: 'placed', label: 'Placed' },
              { k: 'confirmed', label: 'Confirmed' },
              { k: 'assigned', label: 'Assigned' },
              { k: 'out_for_delivery', label: 'Out for Delivery' },
              { k: 'delivered', label: 'Delivered' }
            ].map((s) => {
              const count = statusDist[s.k] || 0
              const pct = orders.length ? (count / orders.length) * 100 : 0
              return (
                <div key={s.k}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-espresso-600">{s.label}</span>
                    <span className="font-semibold text-espresso-800">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-champagne-100">
                    <div className="h-full rounded-full bg-gold-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-champagne-50 p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium text-champagne-800"><Users className="h-4 w-4" /> Delivery Team</p>
            <div className="mt-2 flex items-center gap-2">
              {agents.slice(0, 3).map((a) => (
                <span key={a.id} title={a.name} className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-[11px] font-bold text-white">{a.name[0]}</span>
              ))}
              <span className="text-[11px] text-espresso-400">{agents.length} agents online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-lux overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="font-serif text-xl font-semibold text-espresso-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-[12px] font-semibold uppercase tracking-wider text-champagne-700 hover:text-champagne-800">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-champagne-100 bg-ivory-100/50 text-[11px] uppercase tracking-wider text-espresso-400">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-champagne-100/70 transition-colors hover:bg-champagne-50/50">
                    <td className="px-6 py-3.5 font-mono text-[12px] font-semibold text-champagne-700">{o.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-espresso-800">{o.customerName}</p>
                      <p className="text-[11px] text-espresso-400">{o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-espresso-800">{fmtINR(o.total)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.status} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-lux p-6">
          <h2 className="font-serif text-xl font-semibold text-espresso-800">Top Selling</h2>
          <div className="mt-5 space-y-4">
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne-100 font-serif text-sm font-semibold text-champagne-700">{i + 1}</span>
                <p className="flex-1 truncate text-sm text-espresso-700">{name}</p>
                <span className="badge-lux">{qty} sold</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-espresso-400">No sales yet</p>}
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-champagne-200 bg-ivory-100/60 p-4">
            <Gem className="h-5 w-5 text-champagne-600" />
            <div>
              <p className="text-[13px] font-semibold text-espresso-800">{products.length} live products</p>
              <p className="text-[11px] text-espresso-400">across {new Set(products.map((p) => p.category)).size} collections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
