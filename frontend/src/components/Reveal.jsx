import { useEffect, useRef, useState } from 'react'

export function Reveal({ children, delay = 0, className = '', direction = 'up', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hidden =
    direction === 'up'
      ? 'opacity-0 translate-y-10'
      : direction === 'down'
        ? 'opacity-0 -translate-y-10'
        : direction === 'left'
          ? 'opacity-0 translate-x-12'
          : direction === 'right'
            ? 'opacity-0 -translate-x-12'
            : 'opacity-0 scale-95'

  return (
    <Tag
      ref={ref}
      className={`${className} transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${shown ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hidden}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

export function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon size={size} className="text-champagne-200" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <StarIcon size={size} className="text-champagne-600" />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

export function StarIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2.94 6.26 6.87.83-5.1 4.67 1.35 6.78L12 17.27l-6.06 3.27 1.35-6.78L2.2 9.09l6.87-.83L12 2z" />
    </svg>
  )
}
