import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  chain: {
    CRUZ_VERDE: 'bg-green-100 text-green-800',
    SALCOBRAND: 'bg-blue-100 text-blue-800',
    AHUMADA: 'bg-orange-100 text-orange-800',
    SIMILARES: 'bg-purple-100 text-purple-800',
    OTHER: 'bg-gray-100 text-gray-700',
  },
} as const

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof Omit<typeof variants, 'chain'>
  chain?: keyof typeof variants.chain
  className?: string
}

export function Badge({ children, variant = 'default', chain, className }: BadgeProps) {
  const colorClass = chain ? variants.chain[chain] : variants[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  )
}
