import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Truck, Lock, Mail, Eye, EyeOff, ArrowRight, MapPin, ArrowLeft, Gem } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { Reveal } from '../../components/Reveal'

// Matches prisma/seed.ts's demo agent password.
const AGENT_PASSWORD = 'agent123'

export default function AgentLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { loginAgent } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    const res = await loginAgent(form.email, form.password)
    if (res.ok) {
      toast(`Welcome, ${res.agent.name}`)
      navigate('/agent')
    } else {
      setError(res.error)
    }
  }

  const quickLogin = async (email) => {
    const res = await loginAgent(email, AGENT_PASSWORD)
    if (res.ok) {
      toast(`Signed in as ${res.agent.name}`)
      navigate('/agent')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-espresso-900 via-espresso-800 to-champagne-900/40 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-champagne-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-champagne-500/10 blur-3xl" />
      </div>
      <Reveal className="relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-luxury text-champagne-400 hover:text-champagne-300">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
        <div className="rounded-3xl border border-champagne-500/20 bg-ivory-50/95 p-8 shadow-2xl backdrop-blur sm:p-10">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-champagne-500 to-amber-700 shadow-gold">
              <Truck className="h-8 w-8 text-white" />
            </span>
            <h1 className="mt-5 font-serif text-3xl font-semibold text-espresso-800">Delivery Agent Portal</h1>
            <p className="mt-1.5 text-[13px] text-espresso-500">Sarika Beauty Hub · On-time, every time</p>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Agent Email</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="agent@sarikadelivery.in" className="input-lux !pl-10" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Portal Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type={showPw ? 'text' : 'password'} placeholder="••••••••" className="input-lux !pl-10 !pr-11" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso-700">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] text-rose-600">{error}</p>}
            <button type="submit" className="btn-gold w-full">Sign In to Portal <ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="mt-6 rounded-2xl bg-champagne-50 px-4 py-4 text-[12px] text-champagne-800">
            <p className="flex items-center justify-center gap-1.5 font-medium"><Gem className="h-3.5 w-3.5" /> Demo agents</p>
            <div className="mt-2 grid gap-1.5">
              <button onClick={() => quickLogin('rahul.verma@sarikadelivery.in')} className="rounded-lg bg-white/70 px-3 py-1.5 text-left transition-colors hover:bg-white">
                Rahul Verma <span className="ml-1 text-champagne-600">(has assigned orders)</span>
              </button>
              <button onClick={() => quickLogin('priya.nair@sarikadelivery.in')} className="rounded-lg bg-white/70 px-3 py-1.5 text-left transition-colors hover:bg-white">
                Priya Nair <span className="ml-1 text-champagne-600">(has assigned orders)</span>
              </button>
            </div>
            <p className="mt-2 text-center">Password: {AGENT_PASSWORD}</p>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
