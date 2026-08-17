import { Reveal } from './Reveal'

export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false }) {
  return (
    <Reveal className={`${align === 'center' ? 'text-center' : 'text-left'} mb-10 sm:mb-14`}>
      {eyebrow && (
        <p className={`eyebrow ${align === 'center' ? 'justify-center' : ''}`}>
          <span className="h-px w-8 bg-champagne-500" />
          {eyebrow}
          {align === 'center' && <span className="h-px w-8 bg-champagne-500" />}
        </p>
      )}
      <h2
        className={`mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl ${
          light ? 'text-ivory-100' : 'text-espresso-800'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mx-auto mt-4 max-w-xl text-[15px] leading-relaxed ${align === 'center' ? 'mx-auto' : ''} ${light ? 'text-ivory-200/80' : 'text-espresso-500'}`}>
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
