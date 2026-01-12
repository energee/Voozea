import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LikeButton } from '@/components/like-button'
import { RatingDisplay } from '@/components/rating-display'
import { formatRelativeTime } from '@/lib/utils'

interface RatingCardProps {
  rating: {
    id: string
    score: number
    comment: string | null
    like_count: number
    comment_count: number
    created_at: string
    photo_url?: string | null
    user?: {
      username: string
      display_name: string | null
      avatar_url: string | null
    }
    product: {
      id: string
      name: string
      business: {
        name: string
        slug: string
      }
    }
  }
  currentUserId?: string
  isLiked?: boolean
  variant?: 'feed' | 'profile'
}

export function RatingCard({ rating, currentUserId, isLiked = false, variant = 'feed' }: RatingCardProps) {
  const displayName = rating.user?.display_name || rating.user?.username

  // Compact profile variant - simple one-line entry
  if (variant === 'profile') {
    return (
      <Link
        href={`/product/${rating.product.id}`}
        className="flex items-center gap-3 py-3 px-4 hover:bg-accent/50 transition-colors group"
      >
        <RatingDisplay score={rating.score} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="font-medium group-hover:underline">{rating.product.name}</span>
          <span className="text-muted-foreground"> at {rating.product.business.name}</span>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {formatRelativeTime(rating.created_at)}
        </span>
      </Link>
    )
  }

  // Full feed variant with card
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {rating.user && (
              <Link href={`/profile/${rating.user.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rating.user.avatar_url || undefined} />
                  <AvatarFallback>
                    {displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <div>
              {rating.user && (
                <Link
                  href={`/profile/${rating.user.username}`}
                  className="font-medium hover:underline"
                >
                  {displayName}
                </Link>
              )}
              <p className="text-sm text-muted-foreground">
                rated{' '}
                <Link
                  href={`/product/${rating.product.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {rating.product.name}
                </Link>
                {' '}at{' '}
                <Link
                  href={`/business/${rating.product.business.slug}`}
                  className="hover:underline"
                >
                  {rating.product.business.name}
                </Link>
              </p>
            </div>
          </div>
          <RatingDisplay score={rating.score} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        {rating.comment && (
          <p className="mb-4">{rating.comment}</p>
        )}
        {rating.photo_url && (
          <div className="mb-4">
            <Image
              src={rating.photo_url}
              alt="Rating photo"
              width={400}
              height={300}
              className="rounded-lg object-cover max-w-full"
            />
          </div>
        )}
        <div className="flex items-center gap-5 text-sm">
          {currentUserId ? (
            <LikeButton
              ratingId={rating.id}
              likeCount={rating.like_count}
              isLiked={isLiked}
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-4 w-4" />
              {rating.like_count}
            </span>
          )}
          <Link
            href={`/product/${rating.product.id}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {rating.comment_count}
          </Link>
          <span className="text-muted-foreground ml-auto">
            {formatRelativeTime(rating.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
