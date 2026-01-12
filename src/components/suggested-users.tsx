'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from '@/components/follow-button'
import type { SuggestedUser } from '@/lib/actions/suggestions'

interface SuggestedUsersProps {
  users: SuggestedUser[]
  currentUserId: string
}

export function SuggestedUsers({ users, currentUserId }: SuggestedUsersProps) {
  if (users.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map((user) => {
        const displayName = user.display_name || user.username

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
                    <FollowButton
                      userId={user.id}
                      isFollowing={false}
                      username={displayName}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {user.follower_count} {user.follower_count === 1 ? 'follower' : 'followers'}
                  </p>

                  {user.recent_rating && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Rated &ldquo;{user.recent_rating.product_name}&rdquo; at {user.recent_rating.business_name} &bull; {user.recent_rating.score.toFixed(1)}/10
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
