import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Gem, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { IMG } from '../../data/products'
import { Reveal } from '../../components/Reveal'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const { loginCustomerAccount, signupCustomer } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    let res
    if (mode === 'login') {
      res = await loginCustomerAccount(form.email, form.password)
      if (res.ok) {
        toast('Welcome back!')
        navigate('/orders')
      }
    } else {
      if (!form.name || !form.email || !form.phone || form.password.length < 6) {
        setError('Please fill all fields. Password must be at least 6 characters.')
        return
      }
      res = await signupCustomer({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      if (res.ok) {
        toast('Account created — welcome to the Sarika Circle!')
        navigate('/shop')
      }
    }
    if (res && !res.ok) setError(res.error)
  }

  const demoLogin = async () => {
    const r = await loginCustomerAccount('demo@sarikabeautyhub.in', 'demo123')
    if (r.ok) {
      toast('Signed in as Ananya Sharma (demo customer)')
      navigate('/orders')
    } else {
      setError(r.error)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-40px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMG.jewellery2} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/90 via-espresso-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-12">
          <p className="font-script text-3xl text-champagne-300">The Sarika Circle</p>
          <h2 className="mt-2 max-w-md font-serif text-4xl font-semibold leading-tight text-ivory-50">
            A world of fine jewellery, reserved for members
          </h2>
          <div className="mt-6 space-y-2.5 text-sm text-ivory-200/85">
            {['Track every order from boutique to doorstep', 'Early access to new collections & private previews', 'Exclusive member-only prices & festive offers'].map((t) => (
              <p key={t} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne-500/25 text-champagne-300"><Check className="h-3 w-3" /></span>
                {t}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-10">
        <Reveal className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="font-script text-3xl text-champagne-500">{mode === 'login' ? 'Welcome back' : 'Join the circle'}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-espresso-800">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>
          </div>

          <div className="mb-8 flex rounded-full border border-champagne-200 bg-white/70 p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 rounded-full py-2.5 text-[12px] font-medium uppercase tracking-luxury transition-all duration-300 ${mode === m ? 'bg-gold-gradient text-white shadow-goldSm' : 'text-espresso-600 hover:text-champagne-700'}`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                    <input value={form.name} onChange={set('name')} placeholder="Your name" className="input-lux !pl-10" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Mobile Number</span>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                    <input value={form.phone} onChange={set('phone')} placeholder="+91 98XXX XXXXX" className="input-lux !pl-10" />
                  </div>
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Email</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                <input value={form.email} onChange={set('email')} type="email" placeholder="you@example.com" className="input-lux !pl-10" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne-500" />
                <input value={form.password} onChange={set('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" className="input-lux !pl-10 !pr-11" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso-700">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] text-rose-600">{error}</p>
            )}

            <button type="submit" className="btn-gold w-full">
              {mode === 'login' ? 'Sign In' : 'Create My Account'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-6">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-espresso-400">
                <span className="h-px flex-1 bg-champagne-200" /> or <span className="h-px flex-1 bg-champagne-200" />
              </div>
              <button onClick={demoLogin} className="btn-outline mt-4 w-full">
                <Gem className="h-4 w-4 text-champagne-600" /> Try the demo customer (Ananya Sharma)
              </button>
              <p className="mt-3 text-center text-[12px] text-espresso-400">
                demo@sarikabeautyhub.in · password: demo123
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-[13px] text-espresso-500">
            {mode === 'login' ? "New to Sarika?" : 'Already a member?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="font-semibold text-champagne-700 underline underline-offset-2">
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 rounded-2xl border border-champagne-200 bg-white/70 p-4 text-[12px] leading-relaxed text-espresso-500">
            <strong className="text-champagne-700">Need the other portals?</strong>{' '}
            <Link to="/admin" className="underline underline-offset-2 hover:text-champagne-700">Admin Dashboard</Link> ·{' '}
            <Link to="/agent/login" className="underline underline-offset-2 hover:text-champagne-700">Delivery Agent Portal</Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
