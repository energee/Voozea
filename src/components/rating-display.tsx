import { cn } from '@/lib/utils'

interface RatingDisplayProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

function getRatingColor(score: number): string {
  if (score < 4) return 'bg-rating-low text-white'
  if (score < 7) return 'bg-rating-mid text-foreground'
  return 'bg-rating-high text-white'
}

function getRatingLabel(score: number): string {
  if (score < 3) return 'Poor'
  if (score < 5) return 'Fair'
  if (score < 7) return 'Good'
  if (score < 8.5) return 'Great'
  return 'Excellent'
}

const sizeClasses = {
  sm: 'h-8 w-12 text-sm',
  md: 'h-10 w-14 text-lg',
  lg: 'h-14 w-20 text-2xl',
}

export function RatingDisplay({
  score,
  size = 'md',
  showLabel = false,
  className,
}: RatingDisplayProps) {
  const colorClass = getRatingColor(score)
  const label = getRatingLabel(score)

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-lg font-bold flex items-center justify-center transition-colors',
          sizeClasses[size],
          colorClass
        )}
      >
        {score.toFixed(1)}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  )
}

interface RatingBadgeProps {
  score: number
  totalRatings?: number
  className?: string
}

export function RatingBadge({ score, totalRatings, className }: RatingBadgeProps) {
  const colorClass = getRatingColor(score)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-md px-2 py-1 text-sm font-bold',
          colorClass
        )}
      >
        {score.toFixed(1)}
      </div>
      {totalRatings !== undefined && (
        <span className="text-sm text-muted-foreground">
          {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
