'use client'

import { useState } from 'react'
import { Loader2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { followBusiness, unfollowBusiness } from '@/lib/actions/business-follow'

interface BusinessFollowButtonProps {
  businessId: string
  isFollowing: boolean
  businessName?: string
  followerCount?: number
  showCount?: boolean
}

export function BusinessFollowButton({
  businessId,
  isFollowing: initialIsFollowing,
  businessName,
  followerCount = 0,
  showCount = false,
}: BusinessFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(followerCount)

  async function handleClick() {
    setIsLoading(true)

    const formData = new FormData()
    formData.set('business_id', businessId)

    if (isFollowing) {
      const result = await unfollowBusiness(formData)
      if (!result?.error) {
        setIsFollowing(false)
        setCount((c) => Math.max(0, c - 1))
        toast.success(businessName ? `Unfollowed ${businessName}` : 'Unfollowed')
      } else {
        toast.error('Failed to unfollow')
      }
    } else {
      const result = await followBusiness(formData)
      if (!result?.error) {
        setIsFollowing(true)
        setCount((c) => c + 1)
        toast.success(businessName ? `Following ${businessName}` : 'Following')
      } else {
        toast.error('Failed to follow')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
            {isFollowing ? 'Following' : 'Follow'}
          </>
        )}
      </Button>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  )
}
