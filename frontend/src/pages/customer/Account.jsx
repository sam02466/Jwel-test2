import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Mail, MapPin, LogOut, Package, Gem } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { Reveal } from '../../components/Reveal'

export default function Account() {
  const { isCustomer, ready, session, logout, currentCustomer, updateProfile } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const customer = currentCustomer()
  const [form, setForm] = useState(() => ({
    name: customer?.name || '',
    phone: customer?.phone || '',
    line1: customer?.address?.line1 || '',
    city: customer?.address?.city || '',
    pincode: customer?.address?.pincode || ''
  }))

  // Session restore is async (see AuthContext), so `customer` is often
  // still null on this component's first render — this keeps the form
  // in sync once the real profile arrives, instead of getting stuck
  // with the blank defaults useState's initializer saw at mount.
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        phone: customer.phone || '',
        line1: customer.address?.line1 || '',
        city: customer.address?.city || '',
        pincode: customer.address?.pincode || ''
      })
    }
  }, [customer])

  if (!ready) return null

  if (!isCustomer || !customer) {
    return (
      <div className="texture-paper flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Gem className="mx-auto h-12 w-12 text-champagne-300" />
          <h1 className="mt-4 font-serif text-3xl text-espresso-800">Sign in to view your account</h1>
          <Link to="/auth" className="btn-gold mt-6">Sign In / Register</Link>
        </div>
      </div>
    )
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        addressLine1: form.line1,
        addressCity: form.city,
        addressPincode: form.pincode
      })
      setEditing(false)
      toast('Profile updated')
    } catch (err) {
      toast(err.message || 'Could not update your profile. Please try again.', 'error')
    }
  }

  return (
    <div className="texture-paper min-h-screen">
      <div className="container-lux py-10 sm:py-14">
        <Reveal>
          <p className="eyebrow"><span className="h-px w-8 bg-champagne-500" /> My Account</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">Hello, {customer.name.split(' ')[0]}</h1>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr]">
          <Reveal className="space-y-4">
            <div className="card-lux p-6 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient font-serif text-3xl font-semibold text-white shadow-gold">
                {customer.name[0]}
              </span>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-espresso-800">{customer.name}</h2>
              <p className="mt-1 text-[12px] text-espresso-400">Member since {new Date().getFullYear()}</p>
              <div className="divider-lux my-5" />
              <div className="space-y-3 text-left text-sm">
                <p className="flex items-center gap-2.5 text-espresso-600"><Mail className="h-4 w-4 text-champagne-600" /> {customer.email}</p>
                <p className="flex items-center gap-2.5 text-espresso-600"><Phone className="h-4 w-4 text-champagne-600" /> {customer.phone}</p>
                <p className="flex items-start gap-2.5 text-espresso-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" /> {customer.address.line1 || '—'}, {customer.address.city} {customer.address.pincode}</p>
              </div>
              <button onClick={() => logout('customer')} className="btn-outline mt-6 w-full !py-2.5 !text-rose-600 !border-rose-200 hover:!bg-rose-50">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
            <Link to="/orders" className="card-lux flex items-center gap-4 p-5 transition-all hover:shadow-cardHover">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne-100 text-champagne-700"><Package className="h-5 w-5" /></span>
              <div>
                <p className="font-medium text-espresso-800">My Orders</p>
                <p className="text-[12px] text-espresso-400">Track deliveries & receipts</p>
              </div>
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="card-lux p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-espresso-800">
                  <User className="h-5 w-5 text-champagne-600" /> Profile Details
                </h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="btn-outline !py-2 !px-5">Edit</button>
                )}
              </div>
              <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Full Name</span>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!editing} className="input-lux disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Mobile</span>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={!editing} className="input-lux disabled:opacity-60" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">Address</span>
                  <input value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} disabled={!editing} className="input-lux disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">City</span>
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} disabled={!editing} className="input-lux disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-espresso-600">PIN Code</span>
                  <input value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} disabled={!editing} className="input-lux disabled:opacity-60" />
                </label>
                {editing && (
                  <div className="flex gap-3 sm:col-span-2">
                    <button type="submit" className="btn-gold">Save Changes</button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
                  </div>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
