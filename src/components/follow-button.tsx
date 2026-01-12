'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { followUser, unfollowUser } from '@/lib/actions/social'
import { followEntity, unfollowEntity } from '@/lib/actions/entity-follow'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  username?: string
  // Optional: follow as a different entity (e.g., as a business)
  actAsEntityId?: string
  // Optional: show follower count
  followerCount?: number
  showCount?: boolean
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  username,
  actAsEntityId,
  followerCount: initialFollowerCount,
  showCount = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount || 0)

  async function handleClick() {
    setIsLoading(true)

    try {
      if (actAsEntityId) {
        // Use entity follow system when acting as a different entity
        const formData = new FormData()
        formData.set('follower_id', actAsEntityId)
        formData.set('following_id', userId)

        if (isFollowing) {
          const result = await unfollowEntity(formData)
          if (!result?.error) {
            setIsFollowing(false)
            if (showCount) setFollowerCount((c) => Math.max(0, c - 1))
            toast.success(username ? `Unfollowed ${username}` : 'Unfollowed')
          } else {
            toast.error(result.error || 'Failed to unfollow')
          }
        } else {
          const result = await followEntity(formData)
          if (!result?.error) {
            setIsFollowing(true)
            if (showCount) setFollowerCount((c) => c + 1)
            toast.success(username ? `Following ${username}` : 'Following')
          } else {
            toast.error(result.error || 'Failed to follow')
          }
        }
      } else {
        // Use regular user follow for user-to-user follows
        const formData = new FormData()
        formData.set('user_id', userId)

        if (isFollowing) {
          const result = await unfollowUser(formData)
          if (!result?.error) {
            setIsFollowing(false)
            if (showCount) setFollowerCount((c) => Math.max(0, c - 1))
            toast.success(username ? `Unfollowed ${username}` : 'Unfollowed')
          } else {
            toast.error('Failed to unfollow')
          }
        } else {
          const result = await followUser(formData)
          if (!result?.error) {
            setIsFollowing(true)
            if (showCount) setFollowerCount((c) => c + 1)
            toast.success(username ? `Following ${username}` : 'Following')
          } else {
            toast.error('Failed to follow')
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </Button>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  )
}
