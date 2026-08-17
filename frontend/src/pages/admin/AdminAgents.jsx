import { useState } from 'react'
import { Plus, Bike, Star, X, MapPin, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../components/Toast'

// Matches prisma/seed.ts's demo agent password — every agent this form
// creates is auto-assigned the same portal password (each still gets
// their own bcrypt hash row; they just happen to share a value), same
// "shared portal password" UX the app was originally built around.
const AGENT_PASSWORD = 'agent123'

export default function AdminAgents() {
  const { agents, orders, createAgent, removeAgent: removeAgentApi } = useData()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '', vehicle: '' })

  const assignedCount = (id) => orders.filter((o) => o.agentId === id && !['delivered', 'cancelled'].includes(o.status)).length
  const deliveredCount = (id) => orders.filter((o) => o.agentId === id && o.status === 'delivered').length

  const addAgent = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone) {
      toast('Please fill name, email and phone', 'error')
      return
    }
    try {
      await createAgent({
        username: form.email,
        password: AGENT_PASSWORD,
        name: form.name,
        phone: form.phone,
        area: form.area || 'Kolkata area',
        vehicle: form.vehicle || 'Bike'
      })
      setForm({ name: '', phone: '', email: '', area: '', vehicle: '' })
      setAdding(false)
      toast('Delivery agent onboarded')
    } catch (err) {
      toast(err.message || 'Could not add this agent. Please try again.', 'error')
    }
  }

  const removeAgent = async (agent) => {
    try {
      await removeAgentApi(agent.id)
      toast(`${agent.name} removed`, 'error')
    } catch (err) {
      toast(err.message || 'Could not remove this agent.', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-espresso-800">Delivery Agents</h1>
          <p className="mt-1 text-[13px] text-espresso-500">{agents.length} agents · all agents sign in with the shared portal password</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-gold !py-2.5">
          <Plus className="h-4 w-4" /> Onboard Agent
        </button>
      </div>

      {adding && (
        <form onSubmit={addAgent} className="card-lux mt-6 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="input-lux" />
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone *" className="input-lux" />
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email *" className="input-lux" />
          <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} placeholder="Serving area" className="input-lux" />
          <input value={form.vehicle} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))} placeholder="Vehicle" className="input-lux" />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" className="btn-gold">Add Agent</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a, i) => (
          <div key={a.id} className="card-lux relative p-6 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <button onClick={() => removeAgent(a)} className="absolute right-4 top-4 rounded-full p-1.5 text-espresso-300 transition-colors hover:bg-rose-50 hover:text-rose-500" aria-label="Remove agent">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient font-serif text-xl font-semibold text-white shadow-goldSm">{a.name[0]}</span>
              <div>
                <p className="font-serif text-xl font-semibold text-espresso-800">{a.name}</p>
                <p className="flex items-center gap-1 text-[12px] text-espresso-500"><MapPin className="h-3 w-3 text-champagne-600" /> {a.area}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-ivory-100/80 p-3">
                <p className="text-lg font-semibold text-espresso-800">{assignedCount(a.id)}</p>
                <p className="text-[10px] uppercase tracking-wider text-espresso-400">Active</p>
              </div>
              <div className="rounded-xl bg-ivory-100/80 p-3">
                <p className="text-lg font-semibold text-espresso-800">{deliveredCount(a.id)}</p>
                <p className="text-[10px] uppercase tracking-wider text-espresso-400">Delivered</p>
              </div>
              <div className="rounded-xl bg-ivory-100/80 p-3">
                <p className="flex items-center justify-center gap-1 text-lg font-semibold text-espresso-800"><Star className="h-3.5 w-3.5 fill-champagne-500 text-champagne-500" />{a.rating}</p>
                <p className="text-[10px] uppercase tracking-wider text-espresso-400">Rating</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-champagne-200/70 bg-white/60 px-4 py-2.5 text-[12px] text-espresso-500">
              <span className="flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-champagne-600" /> {a.vehicle}</span>
              <span className="font-mono text-[11px]">{a.phone}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-lux mt-6 p-6">
        <h2 className="font-serif text-xl font-semibold text-espresso-800">Agent Portal Access</h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-espresso-500">
          Agents sign in at the <strong className="text-champagne-700">/agent/login</strong> portal using their email and the shared portal password
          <strong className="text-champagne-700"> {AGENT_PASSWORD}</strong>. They can view assigned orders, open the delivery map, scan the customer&apos;s QR receipt and mark orders delivered.
        </p>
      </div>
    </div>
  )
}
