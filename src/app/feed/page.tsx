import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RatingCard } from '@/components/rating-card'
import { SiteHeader } from '@/components/site-header'
import { SuggestedUsers } from '@/components/suggested-users'
import { getSuggestedUsers, type SuggestedUser } from '@/lib/actions/suggestions'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const isFollowingView = view === 'following' && user

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ratings: any[] | null = null
  let userLikes: Set<string> = new Set()
  let suggestedUsers: SuggestedUser[] = []

  if (isFollowingView) {
    // Get IDs of users the current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = following?.map((f) => f.following_id) || []

    if (followingIds.length > 0) {
      // Get ratings from followed users
      const { data } = await supabase
        .from('ratings')
        .select(`
          id,
          score,
          comment,
          like_count,
          comment_count,
          created_at,
          user_id,
          profiles!ratings_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          products!ratings_product_id_fkey (
            id,
            name,
            businesses!products_business_id_fkey (
              name,
              slug
            )
          ),
          rating_photos (
            url
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50)

      ratings = data
      // If no ratings from followed users, get suggestions
      if (!data || data.length === 0) {
        suggestedUsers = await getSuggestedUsers(user.id, 6)
      }
    } else {
      ratings = []
      // Get suggestions when not following anyone
      suggestedUsers = await getSuggestedUsers(user.id, 6)
    }
  } else {
    // Global feed - all recent ratings
    const { data } = await supabase
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        like_count,
        comment_count,
        created_at,
        user_id,
        profiles!ratings_user_id_fkey (
          username,
          display_name,
          avatar_url
        ),
        products!ratings_product_id_fkey (
          id,
          name,
          businesses!products_business_id_fkey (
            name,
            slug
          )
        ),
        rating_photos (
          url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    ratings = data
  }

  // Get user's likes if logged in
  if (user && ratings && ratings.length > 0) {
    const ratingIds = ratings.map((r) => r.id)
    const { data: likes } = await supabase
      .from('rating_likes')
      .select('rating_id')
      .eq('user_id', user.id)
      .in('rating_id', ratingIds)

    userLikes = new Set(likes?.map((l) => l.rating_id) || [])
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Activity Feed</h1>

          {user && (
            <Tabs defaultValue={isFollowingView ? 'following' : 'global'}>
              <TabsList>
                <TabsTrigger value="global" asChild>
                  <Link href="/feed">Global</Link>
                </TabsTrigger>
                <TabsTrigger value="following" asChild>
                  <Link href="/feed?view=following">Following</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {ratings && ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((rating) => {
              const profile = rating.profiles as { username: string; display_name: string | null; avatar_url: string | null } | null
              const product = rating.products as { id: string; name: string; businesses: { name: string; slug: string } } | null
              const photos = rating.rating_photos as { url: string }[] | null
              const photoUrl = photos && photos.length > 0 ? photos[0].url : null

              if (!profile || !product) return null

              return (
                <RatingCard
                  key={rating.id}
                  rating={{
                    id: rating.id,
                    score: rating.score,
                    comment: rating.comment,
                    like_count: rating.like_count,
                    comment_count: rating.comment_count,
                    created_at: rating.created_at,
                    photo_url: photoUrl,
                    user: {
                      username: profile.username,
                      display_name: profile.display_name,
                      avatar_url: profile.avatar_url,
                    },
                    product: {
                      id: product.id,
                      name: product.name,
                      business: {
                        name: product.businesses.name,
                        slug: product.businesses.slug,
                      },
                    },
                  }}
                  currentUserId={user?.id}
                  isLiked={userLikes.has(rating.id)}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            {isFollowingView ? (
              <>
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No ratings from people you follow yet
                </p>
                {suggestedUsers.length > 0 ? (
                  <div className="text-left mt-8 px-4">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Suggested people to follow
                    </h3>
                    <SuggestedUsers users={suggestedUsers} currentUserId={user!.id} />
                  </div>
                ) : (
                  <Button asChild>
                    <Link href="/feed">View Global Feed</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No ratings yet. Be the first to rate something!
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
