'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search, Loader2, User, Store, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  followEntity,
  unfollowEntity,
  searchEntities,
  type EntityInfo,
} from '@/lib/actions/entity-follow'

interface BusinessFollowingManagerProps {
  businessId: string
  businessName: string
  following: EntityInfo[]
}

export function BusinessFollowingManager({
  businessId,
  businessName,
  following: initialFollowing,
}: BusinessFollowingManagerProps) {
  const [following, setFollowing] = useState<EntityInfo[]>(initialFollowing)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<EntityInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Exclude the business itself and entities already being followed
      const excludeIds = [businessId, ...following.map((f) => f.id)]
      const results = await searchEntities(query, excludeIds)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  async function handleFollow(entity: EntityInfo) {
    setLoadingIds((prev) => new Set(prev).add(entity.id))

    const formData = new FormData()
    formData.set('follower_id', businessId)
    formData.set('following_id', entity.id)

    startTransition(async () => {
      const result = await followEntity(formData)
      if (!result?.error) {
        setFollowing((prev) => [entity, ...prev])
        setSearchResults((prev) => prev.filter((r) => r.id !== entity.id))
        toast.success(`${businessName} is now following ${entity.name}`)
      } else {
        toast.error(result.error || 'Failed to follow')
      }
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(entity.id)
        return next
      })
    })
  }

  async function handleUnfollow(entity: EntityInfo) {
    setLoadingIds((prev) => new Set(prev).add(entity.id))

    const formData = new FormData()
    formData.set('follower_id', businessId)
    formData.set('following_id', entity.id)

    startTransition(async () => {
      const result = await unfollowEntity(formData)
      if (!result?.error) {
        setFollowing((prev) => prev.filter((f) => f.id !== entity.id))
        toast.success(`${businessName} unfollowed ${entity.name}`)
      } else {
        toast.error(result.error || 'Failed to unfollow')
      }
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(entity.id)
        return next
      })
    })
  }

  function getEntityLink(entity: EntityInfo) {
    if (entity.type === 'business' && entity.slug) {
      return `/business/${entity.slug}`
    }
    if (entity.type === 'user' && entity.username) {
      return `/profile/${entity.username}`
    }
    return '#'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Following</CardTitle>
        <CardDescription>
          Manage who {businessName} follows. Followers will see {businessName} in their followers list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users or businesses to follow..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map((entity) => {
                const isLoading = loadingIds.has(entity.id)
                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3 hover:bg-accent/50"
                  >
                    <Link href={getEntityLink(entity)} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entity.avatarUrl || undefined} />
                        <AvatarFallback>
                          {entity.type === 'business' ? (
                            <Store className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{entity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entity.type === 'business' ? 'Business' : 'User'}
                        </p>
                      </div>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleFollow(entity)}
                      disabled={isLoading || isPending}
                      className="gap-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No users or businesses found
            </p>
          )}
        </div>

        {/* Current Following */}
        <div>
          <h3 className="font-medium mb-3">
            Following ({following.length})
          </h3>
          {following.length > 0 ? (
            <div className="space-y-2">
              {following.map((entity) => {
                const isLoading = loadingIds.has(entity.id)
                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <Link href={getEntityLink(entity)} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entity.avatarUrl || undefined} />
                        <AvatarFallback>
                          {entity.type === 'business' ? (
                            <Store className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{entity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entity.type === 'business' ? 'Business' : 'User'}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnfollow(entity)}
                      disabled={isLoading || isPending}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
              {businessName} is not following anyone yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
