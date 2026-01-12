'use client'

import { useState } from 'react'
import { Loader2, ChevronDown, User, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { followEntity, unfollowEntity, type EntityInfo } from '@/lib/actions/entity-follow'

interface FollowAsSelectorProps {
  // The entity being followed
  targetEntityId: string
  targetName: string
  // Entities the current user can follow as
  actableEntities: EntityInfo[]
  // Which entities are already following the target
  followingEntityIds: string[]
  // Show compact version (just dropdown, no extra info)
  compact?: boolean
}

export function FollowAsSelector({
  targetEntityId,
  targetName,
  actableEntities,
  followingEntityIds,
  compact = false,
}: FollowAsSelectorProps) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set(followingEntityIds))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  async function handleToggleFollow(entityId: string, isCurrentlyFollowing: boolean) {
    setLoadingIds((prev) => new Set(prev).add(entityId))

    const formData = new FormData()
    formData.set('follower_id', entityId)
    formData.set('following_id', targetEntityId)

    try {
      if (isCurrentlyFollowing) {
        const result = await unfollowEntity(formData)
        if (!result?.error) {
          setFollowingIds((prev) => {
            const next = new Set(prev)
            next.delete(entityId)
            return next
          })
          const entity = actableEntities.find((e) => e.id === entityId)
          toast.success(`${entity?.name || 'Entity'} unfollowed ${targetName}`)
        } else {
          toast.error(result.error || 'Failed to unfollow')
        }
      } else {
        const result = await followEntity(formData)
        if (!result?.error) {
          setFollowingIds((prev) => new Set(prev).add(entityId))
          const entity = actableEntities.find((e) => e.id === entityId)
          toast.success(`${entity?.name || 'Entity'} is now following ${targetName}`)
        } else {
          toast.error(result.error || 'Failed to follow')
        }
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(entityId)
        return next
      })
    }
  }

  // If user only has themselves (no businesses), show simple follow button
  if (actableEntities.length === 1) {
    const entity = actableEntities[0]
    const isFollowing = followingIds.has(entity.id)
    const isLoading = loadingIds.has(entity.id)

    return (
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={() => handleToggleFollow(entity.id, isFollowing)}
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
    )
  }

  // Multiple entities - show dropdown
  const followingCount = actableEntities.filter((e) => followingIds.has(e.id)).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {followingCount > 0 ? (
            <>Following ({followingCount})</>
          ) : (
            <>Follow</>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Follow as...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actableEntities.map((entity) => {
          const isFollowing = followingIds.has(entity.id)
          const isLoading = loadingIds.has(entity.id)

          return (
            <DropdownMenuItem
              key={entity.id}
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                if (!isLoading) {
                  handleToggleFollow(entity.id, isFollowing)
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={entity.avatarUrl || undefined} />
                  <AvatarFallback>
                    {entity.type === 'business' ? (
                      <Store className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{entity.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {entity.type === 'business' ? 'Business' : 'Personal'}
                  </span>
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFollow(entity.id, isFollowing)
                  }}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
