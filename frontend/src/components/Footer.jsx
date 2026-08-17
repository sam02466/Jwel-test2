import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, Heart, Gem, BadgeCheck, Truck, ShieldCheck, RefreshCcw } from 'lucide-react'
import Logo from './Logo'
import { CATEGORIES } from '../data/products'

const FEATURES = [
  { icon: BadgeCheck, title: 'BIS Hallmark Certified', text: 'Every piece purity certified' },
  { icon: Truck, title: 'Insured Free Shipping', text: 'Nationwide, fully insured' },
  { icon: ShieldCheck, title: 'Secure Payments', text: 'UPI, cards & COD available' },
  { icon: RefreshCcw, title: '30-Day Easy Returns', text: 'Hassle-free exchanges' }
]

export default function Footer() {
  return (
    <footer className="mt-24">
      <div className="border-y border-champagne-200/70 bg-ivory-100/70">
        <div className="container-lux grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne-300/70 bg-white/80 text-champagne-700">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide2 text-espresso-800">{f.title}</p>
                <p className="text-[12px] text-espresso-500">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="texture-paper">
        <div className="container-lux grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-espresso-500">
              Handcrafted fine jewellery for life&apos;s most precious moments. Certified gold,
              lab-grown diamonds and heirloom-worthy craftsmanship — designed in Jaipur, cherished everywhere.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne-300/70 bg-white/70 text-espresso-600 transition-all hover:-translate-y-1 hover:bg-champagne-500 hover:text-white hover:shadow-goldSm">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Collections</h4>
            <ul className="grid gap-2.5 text-sm text-espresso-600">
              {CATEGORIES.slice(0, 8).map((c) => (
                <li key={c.name}>
                  <Link to={`/shop?cat=${encodeURIComponent(c.name)}`} className="transition-colors hover:text-champagne-700">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Help & Care</h4>
            <ul className="grid gap-2.5 text-sm text-espresso-600">
              <li><Link to="/shop" className="hover:text-champagne-700">Shop Jewellery</Link></li>
              <li><Link to="/orders" className="hover:text-champagne-700">Track My Order</Link></li>
              <li><Link to="/cart" className="hover:text-champagne-700">Shopping Cart</Link></li>
              <li><Link to="/auth" className="hover:text-champagne-700">My Account</Link></li>
              <li><Link to="/" className="hover:text-champagne-700">Jewellery Care Guide</Link></li>
              <li><Link to="/" className="hover:text-champagne-700">Size Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-luxury text-champagne-700">Visit Our Boutique</h4>
            <ul className="grid gap-4 text-sm text-espresso-600">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                <span>12, Shakespeare Sarani,<br />Kolkata, West Bengal 700071</span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="h-4 w-4 shrink-0 text-champagne-600" />
                <a href="tel:+919336837997" className="hover:text-champagne-700">+91 93368 37997</a>
              </li>
              <li className="flex gap-3 items-center">
                <Mail className="h-4 w-4 shrink-0 text-champagne-600" />
                <a href="mailto:sarikabeautyhub.help@gmail.com" className="hover:text-champagne-700">sarikabeautyhub.help@gmail.com</a>
              </li>
            </ul>
            <div className="mt-5 rounded-2xl border border-champagne-300/60 bg-white/70 p-4">
              <p className="flex items-center gap-2 text-[12px] font-medium text-espresso-700">
                <Gem className="h-4 w-4 text-champagne-600" /> Join the Sarika Circle
              </p>
              <p className="mt-1 text-[12px] text-espresso-500">Receive 10% off your first order & early access to new collections.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-champagne-200/70">
          <div className="container-lux flex flex-col items-center justify-between gap-3 py-6 text-[11px] tracking-wider text-espresso-500 md:flex-row">
            <p>© {new Date().getFullYear()} Sarika Beauty Hub. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Crafted with <Heart className="h-3 w-3 text-rosegold" /> for jewellery lovers across India
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
