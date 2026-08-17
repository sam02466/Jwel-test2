import { Link } from 'react-router-dom'
import { Gem } from 'lucide-react'

export default function Logo({ dark = false, size = 'md' }) {
  const textSize = size === 'lg' ? 'text-3xl sm:text-4xl' : size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl'
  const subSize = size === 'lg' ? 'text-[10px] sm:text-xs' : size === 'sm' ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
  return (
    <Link to="/" className="group flex flex-col items-center leading-none">
      <span className={`flex items-center gap-2 font-serif font-semibold ${textSize} ${dark ? 'text-ivory-100' : 'text-espresso-800'}`}>
        <Gem className={`${size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} text-champagne-500 transition-transform duration-500 group-hover:rotate-45`} />
        <span>
          SARIKA <span className="gold-text">BEAUTY HUB</span>
        </span>
      </span>
      <span className={`mt-1 font-script text-champagne-500 ${subSize}`}>fine jewellery & elegance</span>
    </Link>
  )
}
