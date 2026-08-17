import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, BadgeCheck, Truck, ShieldCheck, Gem, Quote, Phone, Mail } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import SectionHeading from '../../components/SectionHeading'
import { Reveal, Stars } from '../../components/Reveal'
import { IMG, CATEGORIES, TESTIMONIALS } from '../../data/products'
import { fmtINR } from '../../data/store'
import { useToast } from '../../components/Toast'
import { useData } from '../../context/DataContext'

function HeroImage({ src, className, float = true, delay = '0s' }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[2rem] border border-champagne-300/50 shadow-cardHover ${className}`}
      style={{ animationDelay: delay }}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />
    </div>
  )
}

export default function Home() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  // Pulled from the live, admin-managed catalogue (see DataContext) —
  // previously this read a hardcoded static array, so a product an
  // admin added or edited never actually showed up here.
  const { products } = useData()
  const featured = products.filter((p) => p.featured).slice(0, 8)
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4)
  const bestsellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4)

  return (
    <div className="overflow-x-clip">
      {/* ============ HERO ============ */}
      <section className="texture-paper relative overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full border border-champagne-300/40" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full border border-champagne-300/30" />
        <div className="absolute right-[12%] top-24 hidden text-champagne-300/40 lg:block">
          <Gem className="h-24 w-24 animate-spin-slow" />
        </div>

        <div className="container-lux relative grid min-h-[88vh] items-center gap-12 py-16 lg:grid-cols-2 lg:py-8">
          <div className="relative z-10 pt-8">
            <Reveal>
              <p className="eyebrow">
                <Sparkles className="h-4 w-4 text-champagne-500" />
                The 2026 Festive Collection
              </p>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-6 font-serif text-[44px] font-semibold leading-[1.05] text-espresso-900 sm:text-6xl lg:text-[64px]">
                Where Every Woman
                <span className="gold-text block italic">Shines Like a Queen</span>
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-espresso-500">
                Handcrafted kundan, certified 22K gold and lab-grown diamonds —
                curated for brides, dreamers and everyday elegance.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/shop" className="btn-gold">
                  Shop the Collection <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop?cat=Kundan%20Sets" className="btn-outline">
                  Explore Bridal Sets
                </Link>
              </div>
            </Reveal>
            <Reveal delay={480}>
              <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
                {[
                  ['10K+', 'Happy Customers'],
                  ['4.9★', 'Average Rating'],
                  ['30+', 'Years of Craft'],
                  ['BIS', 'Certified Gold']
                ].map(([v, l]) => (
                  <div key={l} className="flex flex-col">
                    <span className="font-serif text-3xl font-semibold text-champagne-700">{v}</span>
                    <span className="text-[11px] uppercase tracking-wide2 text-espresso-500">{l}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="relative hidden h-[600px] lg:block">
            <HeroImage src={IMG.jewellery2} className="left-0 top-10 h-[420px] w-[62%] animate-float" delay="0s" />
            <HeroImage src={IMG.ringGold} className="right-0 top-0 h-[300px] w-[46%] animate-float" delay="1.4s" />
            <HeroImage src={IMG.jewellery4} className="bottom-0 right-[8%] h-[260px] w-[40%] animate-float" delay="2.8s" />
            <div className="absolute bottom-8 left-6 z-10 rounded-2xl border border-champagne-200/70 bg-white/90 px-5 py-3.5 shadow-cardHover backdrop-blur animate-fade-up" style={{ animationDelay: '0.9s' }}>
              <p className="font-serif text-lg font-semibold text-espresso-800">Aadhya Bridal Set</p>
              <p className="text-[11px] tracking-widest text-champagne-600">from {fmtINR(48999)}</p>
            </div>
            <div className="absolute left-[30%] top-4 z-10 rounded-full bg-espresso-800/90 px-4 py-2 text-[11px] tracking-widest text-ivory-100 shadow-cardHover backdrop-blur animate-pulse-soft">
              ✦ Certified 22K Gold
            </div>
          </div>
        </div>

        <div className="relative -mb-px">
          <svg viewBox="0 0 1440 60" className="block w-full fill-white" preserveAspectRatio="none">
            <path d="M0,32 C240,72 480,0 720,20 C960,40 1200,0 1440,36 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Curated for you"
            title="Shop by Collection"
            subtitle="Eight signature collections, each handcrafted to celebrate a different side of you."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.name} delay={i * 70}>
                <Link
                  to={`/shop?cat=${encodeURIComponent(c.name)}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-card transition-all duration-500 hover:shadow-cardHover"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1300ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/80 via-espresso-900/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="font-serif text-xl font-semibold text-ivory-50 sm:text-2xl">{c.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] tracking-wider text-ivory-200/80">{c.tagline}</p>
                    <span className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-luxury text-champagne-300 opacity-0 transition-all duration-500 group-hover:opacity-100">
                      Explore <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BESTSELLERS ============ */}
      <section className="texture-paper py-16 sm:py-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Loved by thousands"
            title="Our Bestsellers"
            subtitle="The pieces our customers reach for again and again — and gift to the people they love."
          />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {bestsellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Link to="/shop" className="btn-dark">
              View All Jewellery <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ BRIDAL COLLECTION BANNER ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.jewellery5} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso-900/95 via-espresso-900/80 to-espresso-900/30" />
        </div>
        <div className="container-lux relative py-24 sm:py-32">
          <Reveal direction="left">
            <p className="eyebrow text-champagne-300">
              <Gem className="h-4 w-4" /> Signature
            </p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">
              The Bridal Edit —<br />
              <span className="text-champagne-300 italic">For the day it&apos;s all about you</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ivory-200/85">
              From the Aadhya kundan set to the Veer diamond mangalsutra, our bridal
              trousseau is designed by master karigars in Jaipur and finished with
              certificates you can treasure forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop?cat=Kundan%20Sets" className="btn-gold">Shop Bridal</Link>
              <Link to="/shop?cat=Mangalsutra" className="inline-flex items-center gap-2 rounded-full border border-ivory-100/40 px-7 py-3 text-[12px] font-medium uppercase tracking-luxury text-ivory-100 transition-all hover:bg-ivory-100/10">
                Mangalsutra Edit
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Just landed"
            title="New Arrivals"
            subtitle="Fresh from the atelier — limited pieces, first come first cherished."
          />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ CRAFT / VALUES ============ */}
      <section className="bg-espresso-900 py-16 sm:py-24 text-ivory-100">
        <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="left">
            <div className="relative">
              <img src={IMG.jewellery8} alt="Artisan craftsmanship" className="aspect-[4/5] w-full rounded-[2rem] object-cover" />
              <div className="absolute -bottom-5 -right-5 hidden rounded-2xl border border-champagne-400/40 bg-espresso-800/95 px-6 py-5 shadow-gold sm:block">
                <p className="font-serif text-4xl font-semibold text-champagne-300">40+</p>
                <p className="text-[11px] uppercase tracking-wide2 text-ivory-200/80">Master Karigars</p>
              </div>
            </div>
          </Reveal>
          <Reveal direction="right">
            <p className="eyebrow text-champagne-300">
              <Sparkles className="h-4 w-4" /> The Sarika Promise
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Crafted by hand,<br />cherished for generations
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ivory-200/80">
              Every Sarika piece passes through 27 quality checkpoints before it reaches
              your doorstep — from hallmark verification to final polish. We believe
              jewellery should be as honest as it is beautiful.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { icon: BadgeCheck, t: 'BIS Hallmark', d: 'Certified purity on every gold piece' },
                { icon: ShieldCheck, t: 'Authentic Stones', d: 'IGI / GIA certified diamonds & polki' },
                { icon: Truck, t: 'Insured Delivery', d: 'Free insured shipping, pan-India' },
                { icon: Gem, t: 'Lifetime Buyback', d: 'On diamonds, solitaires & 22K gold' }
              ].map((f) => (
                <div key={f.t} className="flex gap-3.5 rounded-2xl border border-ivory-100/10 bg-ivory-100/[0.04] p-4">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-champagne-400" />
                  <div>
                    <p className="text-sm font-semibold text-ivory-50">{f.t}</p>
                    <p className="mt-0.5 text-[13px] text-ivory-200/70">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURED STRIP ============ */}
      <section className="bg-white py-14">
        <div className="container-lux grid gap-10 lg:grid-cols-3">
          {[
            { img: IMG.jewellery6, tag: 'Solitaires', title: 'Diamond Pendants', link: '/shop?cat=Necklaces' },
            { img: IMG.earrings, tag: 'Handcrafted', title: 'Kundan & Polki Earrings', link: '/shop?cat=Earrings' },
            { img: IMG.gold, tag: 'Heritage', title: 'Antique Gold Bangles', link: '/shop?cat=Bangles' }
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 110}>
              <Link to={f.link} className="group relative block aspect-[16/10] overflow-hidden rounded-2xl shadow-card">
                <img src={f.img} alt={f.title} className="h-full w-full object-cover transition-transform duration-[1300ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/75 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-[10px] uppercase tracking-luxury text-champagne-300">{f.tag}</p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-ivory-50">{f.title}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="texture-paper py-16 sm:py-24">
        <div className="container-lux">
          <SectionHeading
            eyebrow="Word of mouth"
            title="Loved Across India"
            subtitle="Stories from brides, gifters and everyday jewellery lovers."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="card-lux flex h-full flex-col p-6">
                  <Quote className="h-7 w-7 text-champagne-300" />
                  <p className="mt-4 flex-1 text-[14px] leading-relaxed text-espresso-600">
                    “{t.text}”
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-champagne-100 pt-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-gradient font-serif text-lg font-semibold text-white">
                      {t.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-espresso-800">{t.name}</p>
                      <p className="text-[11px] text-espresso-400">{t.role}</p>
                    </div>
                    <div className="ml-auto">
                      <Stars rating={t.rating} size={12} />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="relative overflow-hidden bg-white py-16">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne-200/70" />
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne-200/50" />
        <div className="container-lux relative text-center">
          <Reveal>
            <p className="font-script text-3xl text-champagne-500">Join the Sarika Circle</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-espresso-800 sm:text-5xl">
              Exclusive Pieces, First to You
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-espresso-500">
              Subscribe for early access to new collections, private previews and a
              10% welcome gift on your first order.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email) {
                  toast('Welcome to the Sarika Circle! Check your inbox for your 10% code.')
                  setEmail('')
                }
              }}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-lux flex-1 !rounded-full !px-6"
              />
              <button type="submit" className="btn-gold shrink-0">Subscribe</button>
            </form>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
