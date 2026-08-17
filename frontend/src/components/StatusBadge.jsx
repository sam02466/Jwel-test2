export const STATUS_META = {
  placed: { label: 'Placed', cls: 'bg-champagne-100 text-champagne-800 border-champagne-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
  assigned: { label: 'Assigned', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  out_for_delivery: { label: 'Out for Delivery', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700 border-rose-200' }
}

export default function StatusBadge({ status, small = false }) {
  const meta = STATUS_META[status] || STATUS_META.placed
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium capitalize ${meta.cls} ${small ? 'text-[10px]' : 'text-[11px]'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  )
}
