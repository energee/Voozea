import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Pencil } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FollowAsSelector } from '@/components/follow-as-selector'
import { SiteHeader } from '@/components/site-header'
import { RatingCard } from '@/components/rating-card'
import { getActableEntities, isFollowing as checkIsFollowing } from '@/lib/actions/entity-follow'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Get profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  // Get follower/following counts from entity_follows
  const [
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from('entity_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('entity_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  // Get entities the current user can act as (themselves + businesses they manage)
  let actableEntities: Awaited<ReturnType<typeof getActableEntities>> = []
  let followingEntityIds: string[] = []

  if (currentUser && currentUser.id !== profile.id) {
    actableEntities = await getActableEntities(currentUser.id)

    // Check which of the user's entities are following this profile
    for (const entity of actableEntities) {
      const following = await checkIsFollowing(entity.id, profile.id)
      if (following) {
        followingEntityIds.push(entity.id)
      }
    }
  }

  // Get user's ratings with product and business info
  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      id,
      score,
      comment,
      like_count,
      comment_count,
      created_at,
      products:product_id (
        id,
        name,
        businesses:business_id (
          name,
          slug
        )
      ),
      rating_photos (
        url
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get current user's likes on these ratings
  let userLikes: Set<string> = new Set()
  if (currentUser && ratings && ratings.length > 0) {
    const ratingIds = ratings.map((r) => r.id)
    const { data: likes } = await supabase
      .from('rating_likes')
      .select('rating_id')
      .eq('user_id', currentUser.id)
      .in('rating_id', ratingIds)

    userLikes = new Set(likes?.map((l) => l.rating_id) || [])
  }

  // Calculate stats
  const totalRatings = ratings?.length || 0
  const averageGiven = totalRatings > 0
    ? (ratings!.reduce((sum, r) => sum + r.score, 0) / totalRatings).toFixed(1)
    : '0.0'

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{profile.display_name || profile.username}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href="/profile/edit">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </Link>
                </Button>
              ) : currentUser && actableEntities.length > 0 && (
                <FollowAsSelector
                  targetEntityId={profile.id}
                  targetName={profile.display_name || profile.username}
                  actableEntities={actableEntities}
                  followingEntityIds={followingEntityIds}
                />
              )}
            </div>
            <p className="text-muted-foreground mb-2">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm mb-4">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold">{totalRatings}</span>
                <span className="text-muted-foreground ml-1">ratings</span>
              </div>
              <div>
                <span className="font-semibold">{averageGiven}</span>
                <span className="text-muted-foreground ml-1">avg given</span>
              </div>
              <div>
                <span className="font-semibold">{followerCount || 0}</span>
                <span className="text-muted-foreground ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold">{followingCount || 0}</span>
                <span className="text-muted-foreground ml-1">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <h2 className="text-xl font-semibold mb-4">Recent Ratings</h2>
        {ratings && ratings.length > 0 ? (
          <div className="border rounded-lg bg-card divide-y">
            {ratings.map((rating) => {
              const product = rating.products as unknown as { id: string; name: string; businesses: { name: string; slug: string } } | null
              const photos = rating.rating_photos as { url: string }[] | null
              const photoUrl = photos && photos.length > 0 ? photos[0].url : null
              if (!product) return null

              return (
                <RatingCard
                  key={rating.id}
                  variant="profile"
                  rating={{
                    id: rating.id,
                    score: rating.score,
                    comment: rating.comment,
                    like_count: rating.like_count ?? 0,
                    comment_count: rating.comment_count ?? 0,
                    created_at: rating.created_at ?? '',
                    photo_url: photoUrl,
                    product: {
                      id: product.id,
                      name: product.name,
                      business: {
                        name: product.businesses.name,
                        slug: product.businesses.slug,
                      },
                    },
                  }}
                  currentUserId={currentUser?.id}
                  isLiked={userLikes.has(rating.id)}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No ratings yet</p>
          </div>
        )}
      </main>
    </div>
  )
}
