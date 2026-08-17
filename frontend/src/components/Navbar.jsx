import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Phone, Mail, Gem } from 'lucide-react'
import Logo from './Logo'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../data/products'

const TICKER = [
  'Complimentary insured shipping across India',
  'Certified 22K gold · BIS hallmark guarantee',
  'Use code SARIKA10 for 10% off your first order',
  'Lifetime buyback on diamonds & solitaires',
  'Handcrafted by master artisans in Jaipur'
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const { count } = useCart()
  const { isCustomer, session, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/shop?q=${encodeURIComponent(search)}`)
    setSearch('')
    setSearchOpen(false)
    setOpen(false)
  }

  const navLink = ({ isActive }) =>
    `relative py-1 text-[12px] font-medium uppercase tracking-wide2 transition-colors ${
      isActive ? 'text-champagne-700' : 'text-espresso-700 hover:text-champagne-700'
    }`

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-espresso-900 text-ivory-100">
        <div className="container-lux overflow-hidden py-1.5">
          <div className="flex w-max animate-marquee items-center gap-16">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-[11px] tracking-widest text-ivory-200/90">
                <Gem className="h-3 w-3 text-champagne-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ${
          scrolled
            ? 'border-b border-champagne-200/70 bg-ivory-50/90 shadow-card backdrop-blur-xl'
            : 'border-b border-transparent bg-ivory-50/60 backdrop-blur-sm'
        }`}
      >
        <div className="container-lux flex items-center justify-between gap-4 py-3.5">
          <button className="lg:hidden text-espresso-700" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>

          <Logo />

          <nav className="hidden items-center gap-8 lg:flex">
            <NavLink to="/" className={navLink} end>
              Home
            </NavLink>
            <NavLink to="/shop" className={navLink}>
              Shop All
            </NavLink>
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex items-center gap-1 py-1 text-[12px] font-medium uppercase tracking-wide2 text-espresso-700 transition-colors hover:text-champagne-700">
                Collections <ChevronDown className={`h-3.5 w-3.5 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`absolute left-1/2 top-full w-72 -translate-x-1/2 pt-4 transition-all duration-300 ${
                  catOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                }`}
              >
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-champagne-200 bg-white/95 p-3 shadow-cardHover backdrop-blur">
                  {CATEGORIES.map((c) => (
                    <NavLink
                      key={c.name}
                      to={`/shop?cat=${encodeURIComponent(c.name)}`}
                      className="rounded-xl px-3 py-2.5 text-[12px] uppercase tracking-wider text-espresso-700 transition-colors hover:bg-champagne-100/70 hover:text-champagne-800"
                    >
                      {c.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
            <NavLink to="/shop?sort=new" className={navLink}>
              New Arrivals
            </NavLink>
            <NavLink to="/orders" className={navLink}>
              My Orders
            </NavLink>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="rounded-full p-2.5 text-espresso-700 transition-all hover:bg-champagne-100 hover:text-champagne-800"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {isCustomer || session ? (
              <div className="group relative hidden sm:block">
                <button className="rounded-full p-2.5 text-espresso-700 transition-all hover:bg-champagne-100 hover:text-champagne-800" aria-label="Account">
                  <User className="h-5 w-5" />
                </button>
                <div className="invisible absolute right-0 top-full w-56 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-2xl border border-champagne-200 bg-white p-2 shadow-cardHover">
                    <p className="truncate px-3 pb-1 pt-2 text-xs text-espresso-400">Signed in as</p>
                    <p className="truncate px-3 pb-2 text-sm font-medium text-espresso-800">{session.name}</p>
                    <div className="divider-lux my-1" />
                    <Link to="/orders" className="block rounded-xl px-3 py-2 text-sm text-espresso-700 hover:bg-champagne-100/70">My Orders</Link>
                    <Link to="/account" className="block rounded-xl px-3 py-2 text-sm text-espresso-700 hover:bg-champagne-100/70">My Account</Link>
                    <button
                      onClick={() => logout('customer')}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="hidden rounded-full p-2.5 text-espresso-700 transition-all hover:bg-champagne-100 hover:text-champagne-800 sm:block" aria-label="Login">
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link to="/cart" className="relative rounded-full p-2.5 text-espresso-700 transition-all hover:bg-champagne-100 hover:text-champagne-800" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-gradient px-1 text-[10px] font-semibold text-white shadow-goldSm">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-champagne-200/60 bg-ivory-50/95 backdrop-blur">
            <form onSubmit={submitSearch} className="container-lux flex items-center gap-3 py-3">
              <Search className="h-5 w-5 text-champagne-600" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search necklaces, rings, bridal sets, mangalsutra…"
                className="flex-1 bg-transparent text-base text-espresso-800 outline-none placeholder:text-espresso-400"
              />
              <button type="submit" className="btn-gold !px-5 !py-2">Search</button>
            </form>
          </div>
        )}
      </div>

      <div className="hidden justify-end gap-5 border-b border-champagne-200/50 bg-ivory-100/60 px-6 py-1.5 text-[11px] tracking-wider text-espresso-600 lg:flex">
        <a href="tel:+919336837997" className="flex items-center gap-1.5 hover:text-champagne-700">
          <Phone className="h-3 w-3 text-champagne-600" /> +91 93368 37997
        </a>
        <a href="mailto:sarikabeautyhub.help@gmail.com" className="flex items-center gap-1.5 hover:text-champagne-700">
          <Mail className="h-3 w-3 text-champagne-600" /> sarikabeautyhub.help@gmail.com
        </a>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-espresso-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-ivory-50 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-champagne-200/70 p-4">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-espresso-700 hover:bg-champagne-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2 rounded-2xl border border-champagne-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-champagne-600" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </form>
              <nav className="flex flex-col">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/shop', label: 'Shop All' },
                  { to: '/orders', label: 'My Orders' },
                  { to: '/account', label: 'My Account' }
                ].map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)} className="border-b border-champagne-100 py-3.5 font-serif text-2xl text-espresso-800">
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <p className="mb-2 mt-6 text-[11px] uppercase tracking-luxury text-champagne-700">Collections</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <NavLink
                    key={c.name}
                    to={`/shop?cat=${encodeURIComponent(c.name)}`}
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-champagne-200 bg-white/70 px-3 py-2.5 text-[11px] uppercase tracking-wider text-espresso-700 hover:bg-champagne-100/70"
                  >
                    {c.name}
                  </NavLink>
                ))}
              </div>
              {isCustomer ? (
                <button onClick={() => { logout('customer'); setOpen(false); }} className="btn-outline mt-6 w-full">
                  Sign out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="btn-gold mt-6 w-full">
                  Sign in / Create account
                </Link>
              )}
            </div>
            <div className="border-t border-champagne-200/70 p-4 text-[11px] tracking-wider text-espresso-600">
              <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-champagne-600" /> +91 93368 37997</p>
              <p className="mt-1 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-champagne-600" /> sarikabeautyhub.help@gmail.com</p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
