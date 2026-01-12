'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { likeRating, unlikeRating } from '@/lib/actions/social'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  ratingId: string
  likeCount: number
  isLiked: boolean
}

export function LikeButton({ ratingId, likeCount: initialCount, isLiked: initialIsLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    if (isLoading) return
    setIsLoading(true)

    const formData = new FormData()
    formData.set('rating_id', ratingId)

    if (isLiked) {
      setIsLiked(false)
      setLikeCount((c) => Math.max(0, c - 1))

      const result = await unlikeRating(formData)
      if (result?.error) {
        setIsLiked(true)
        setLikeCount((c) => c + 1)
        toast.error('Failed to unlike')
      }
    } else {
      setIsLiked(true)
      setLikeCount((c) => c + 1)

      const result = await likeRating(formData)
      if (result?.error) {
        setIsLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
        toast.error('Failed to like')
      }
    }

    setIsLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm transition-colors',
        isLiked
          ? 'text-red-500'
          : 'text-muted-foreground hover:text-foreground',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all',
          isLiked && 'fill-current scale-110'
        )}
      />
      <span>{likeCount}</span>
    </button>
  )
}
