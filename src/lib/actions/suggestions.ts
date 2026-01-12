'use server'

import { createClient } from '@/lib/supabase/server'

export interface SuggestedUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  follower_count: number
  recent_rating: {
    product_name: string
    business_name: string
    score: number
  } | null
}

export async function getSuggestedUsers(
  currentUserId: string,
  limit: number = 6
): Promise<SuggestedUser[]> {
  const supabase = await createClient()

  // Get IDs of users the current user already follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)

  const followingIds = following?.map((f) => f.following_id) || []
  const excludeIds = [currentUserId, ...followingIds]

  // Get popular users by follower count (excluding followed and self)
  const { data: popularUsers } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, follower_count')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .order('follower_count', { ascending: false, nullsFirst: false })
    .limit(limit * 2)

  // Get recently active users (those with recent ratings)
  const { data: recentRatings } = await supabase
    .from('ratings')
    .select(`
      user_id,
      score,
      created_at,
      products!ratings_product_id_fkey (
        name,
        businesses!products_business_id_fkey (
          name
        )
      )
    `)
    .not('user_id', 'in', `(${excludeIds.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(50)

  // Group recent ratings by user, keeping only the most recent
  const userRecentRatings = new Map<string, { product_name: string; business_name: string; score: number }>()
  recentRatings?.forEach((rating) => {
    if (!userRecentRatings.has(rating.user_id)) {
      const product = rating.products as { name: string; businesses: { name: string } } | null
      if (product) {
        userRecentRatings.set(rating.user_id, {
          product_name: product.name,
          business_name: product.businesses.name,
          score: rating.score,
        })
      }
    }
  })

  // Get profile info for active users not already in popular list
  const activeUserIds = Array.from(userRecentRatings.keys())
  const popularUserIds = new Set(popularUsers?.map((u) => u.id) || [])
  const additionalUserIds = activeUserIds.filter((id) => !popularUserIds.has(id))

  let activeUsers: typeof popularUsers = []
  if (additionalUserIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, follower_count')
      .in('id', additionalUserIds)
      .limit(limit)

    activeUsers = data || []
  }

  // Merge and score users
  const userScores = new Map<string, { user: NonNullable<typeof popularUsers>[0]; score: number }>()

  // Score popular users (higher follower rank = more points)
  popularUsers?.forEach((user, index) => {
    const popularityScore = (popularUsers.length - index) * 2
    userScores.set(user.id, { user, score: popularityScore })
  })

  // Add activity score
  activeUsers?.forEach((user, index) => {
    const activityScore = (activeUsers.length - index) * 1.5
    const existing = userScores.get(user.id)
    if (existing) {
      existing.score += activityScore
    } else {
      userScores.set(user.id, { user, score: activityScore })
    }
  })

  // Also boost users who have recent ratings
  userRecentRatings.forEach((_, userId) => {
    const existing = userScores.get(userId)
    if (existing) {
      existing.score += 3 // Boost for having recent activity
    }
  })

  // Sort by combined score and take top users
  const sortedUsers = Array.from(userScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // Build result with recent rating info
  return sortedUsers.map(({ user }) => ({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    follower_count: user.follower_count ?? 0,
    recent_rating: userRecentRatings.get(user.id) || null,
  }))
}
