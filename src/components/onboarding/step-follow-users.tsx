'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { followMultipleUsers } from '@/lib/actions/onboarding'
import type { SuggestedUser } from '@/lib/actions/suggestions'

interface StepFollowUsersProps {
  suggestedUsers: SuggestedUser[]
  followedUserIds: Set<string>
  onFollowToggle: (userId: string, isFollowing: boolean) => void
}

export function StepFollowUsers({
  suggestedUsers,
  followedUserIds,
  onFollowToggle,
}: StepFollowUsersProps) {
  const [isFollowingAll, setIsFollowingAll] = useState(false)
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set())

  async function handleFollowAll() {
    const unfollowedUsers = suggestedUsers.filter((u) => !followedUserIds.has(u.id))
    if (unfollowedUsers.length === 0) return

    setIsFollowingAll(true)
    try {
      const userIds = unfollowedUsers.map((u) => u.id)
      const result = await followMultipleUsers(userIds)

      if (result.error) {
        toast.error(result.error)
      } else {
        userIds.forEach((id) => onFollowToggle(id, true))
        toast.success(`Following ${userIds.length} people!`)
      }
    } catch {
      toast.error('Failed to follow users')
    } finally {
      setIsFollowingAll(false)
    }
  }

  async function handleToggleFollow(user: SuggestedUser) {
    const isCurrentlyFollowing = followedUserIds.has(user.id)

    setFollowingInProgress((prev) => new Set(prev).add(user.id))

    try {
      if (!isCurrentlyFollowing) {
        const result = await followMultipleUsers([user.id])
        if (result.error) {
          toast.error(result.error)
        } else {
          onFollowToggle(user.id, true)
          toast.success(`Following ${user.display_name || user.username}`)
        }
      } else {
        // For unfollow, we'll just update local state
        // The actual unfollow will happen when they click the button again
        onFollowToggle(user.id, false)
      }
    } catch {
      toast.error('Failed to update follow status')
    } finally {
      setFollowingInProgress((prev) => {
        const next = new Set(prev)
        next.delete(user.id)
        return next
      })
    }
  }

  if (suggestedUsers.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Find people to follow</h2>
        <p className="text-muted-foreground mb-8">
          No suggested users available right now. You can find people to follow later!
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">Find people to follow</h2>
      <p className="text-muted-foreground mb-4">
        Follow people to see their ratings in your feed
      </p>

      {suggestedUsers.length > 1 && (
        <Button
          onClick={handleFollowAll}
          disabled={isFollowingAll || followedUserIds.size === suggestedUsers.length}
          className="mb-6"
        >
          {isFollowingAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Following...
            </>
          ) : followedUserIds.size === suggestedUsers.length ? (
            'Following all'
          ) : (
            'Follow all'
          )}
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {suggestedUsers.map((user) => {
          const displayName = user.display_name || user.username
          const isFollowing = followedUserIds.has(user.id)
          const isLoading = followingInProgress.has(user.id)

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${user.username}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${user.username}`}
                          className="font-medium hover:underline block truncate"
                        >
                          {displayName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleFollow(user)}
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
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {user.follower_count} {user.follower_count === 1 ? 'follower' : 'followers'}
                    </p>

                    {user.recent_rating && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Rated &ldquo;{user.recent_rating.product_name}&rdquo; {user.recent_rating.score.toFixed(1)}/10
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
