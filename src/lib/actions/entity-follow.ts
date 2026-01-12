'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessRole } from './business-team'

export type EntityType = 'user' | 'business'

export interface EntityInfo {
  id: string
  type: EntityType
  name: string
  avatarUrl: string | null
  slug?: string // Only for businesses
  username?: string // Only for users
}

/**
 * Check if a user can act as a given entity
 * Users can always act as themselves, and can act as businesses they own/manage
 */
export async function canActAsEntity(userId: string, entityId: string): Promise<boolean> {
  // User can always act as themselves
  if (userId === entityId) {
    return true
  }

  // Check if the entity is a business the user owns/manages
  const role = await getBusinessRole(entityId, userId)
  return role !== null
}

/**
 * Get the list of entities a user can act as (themselves + businesses they manage)
 */
export async function getActableEntities(userId: string): Promise<EntityInfo[]> {
  const supabase = await createClient()

  const entities: EntityInfo[] = []

  // Get user's own profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', userId)
    .single()

  if (profile) {
    entities.push({
      id: profile.id,
      type: 'user',
      name: profile.display_name || profile.username,
      avatarUrl: profile.avatar_url,
      username: profile.username,
    })
  }

  // Get businesses the user owns
  const { data: ownedBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url')
    .eq('owner_id', userId)

  if (ownedBusinesses) {
    for (const business of ownedBusinesses) {
      entities.push({
        id: business.id,
        type: 'business',
        name: business.name,
        avatarUrl: business.logo_url,
        slug: business.slug,
      })
    }
  }

  // Get businesses the user manages (active status)
  const { data: managedBusinesses } = await supabase
    .from('business_members')
    .select(`
      business_id,
      businesses!business_members_business_id_fkey (
        id,
        name,
        slug,
        logo_url,
        owner_id
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('role', 'manager')

  if (managedBusinesses) {
    for (const membership of managedBusinesses) {
      const business = membership.businesses as unknown as {
        id: string
        name: string
        slug: string
        logo_url: string | null
        owner_id: string
      }
      // Skip if already added as owned business
      if (business && business.owner_id !== userId) {
        entities.push({
          id: business.id,
          type: 'business',
          name: business.name,
          avatarUrl: business.logo_url,
          slug: business.slug,
        })
      }
    }
  }

  return entities
}

/**
 * Get entity info by ID
 */
export async function getEntityInfo(entityId: string): Promise<EntityInfo | null> {
  const supabase = await createClient()

  // First check what type of entity this is
  const { data: entity } = await supabase
    .from('entities')
    .select('type')
    .eq('id', entityId)
    .single()

  if (!entity) {
    return null
  }

  if (entity.type === 'user') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', entityId)
      .single()

    if (!profile) return null

    return {
      id: profile.id,
      type: 'user',
      name: profile.display_name || profile.username,
      avatarUrl: profile.avatar_url,
      username: profile.username,
    }
  } else {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, slug, logo_url')
      .eq('id', entityId)
      .single()

    if (!business) return null

    return {
      id: business.id,
      type: 'business',
      name: business.name,
      avatarUrl: business.logo_url,
      slug: business.slug,
    }
  }
}

/**
 * Follow an entity as another entity
 * @param followerId - The entity doing the following
 * @param followingId - The entity being followed
 */
export async function followEntity(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to follow' }
  }

  const followerId = formData.get('follower_id') as string
  const followingId = formData.get('following_id') as string

  if (!followerId || !followingId) {
    return { error: 'Missing required fields' }
  }

  if (followerId === followingId) {
    return { error: 'Cannot follow yourself' }
  }

  // Verify the user can act as the follower entity
  const canAct = await canActAsEntity(user.id, followerId)
  if (!canAct) {
    return { error: 'You do not have permission to follow as this entity' }
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('entity_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (existing) {
    return { error: 'Already following' }
  }

  // Create the follow
  const { error } = await supabase
    .from('entity_follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })

  if (error) {
    return { error: error.message }
  }

  // Get entity info for revalidation
  const followerInfo = await getEntityInfo(followerId)
  const followingInfo = await getEntityInfo(followingId)

  // Revalidate relevant paths
  if (followerInfo?.type === 'user' && followerInfo.username) {
    revalidatePath(`/profile/${followerInfo.username}`)
  } else if (followerInfo?.type === 'business' && followerInfo.slug) {
    revalidatePath(`/business/${followerInfo.slug}`)
  }

  if (followingInfo?.type === 'user' && followingInfo.username) {
    revalidatePath(`/profile/${followingInfo.username}`)
  } else if (followingInfo?.type === 'business' && followingInfo.slug) {
    revalidatePath(`/business/${followingInfo.slug}`)
  }

  return { success: true }
}

/**
 * Unfollow an entity
 */
export async function unfollowEntity(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to unfollow' }
  }

  const followerId = formData.get('follower_id') as string
  const followingId = formData.get('following_id') as string

  if (!followerId || !followingId) {
    return { error: 'Missing required fields' }
  }

  // Verify the user can act as the follower entity
  const canAct = await canActAsEntity(user.id, followerId)
  if (!canAct) {
    return { error: 'You do not have permission to unfollow as this entity' }
  }

  // Delete the follow
  const { error } = await supabase
    .from('entity_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    return { error: error.message }
  }

  // Get entity info for revalidation
  const followerInfo = await getEntityInfo(followerId)
  const followingInfo = await getEntityInfo(followingId)

  // Revalidate relevant paths
  if (followerInfo?.type === 'user' && followerInfo.username) {
    revalidatePath(`/profile/${followerInfo.username}`)
  } else if (followerInfo?.type === 'business' && followerInfo.slug) {
    revalidatePath(`/business/${followerInfo.slug}`)
  }

  if (followingInfo?.type === 'user' && followingInfo.username) {
    revalidatePath(`/profile/${followingInfo.username}`)
  } else if (followingInfo?.type === 'business' && followingInfo.slug) {
    revalidatePath(`/business/${followingInfo.slug}`)
  }

  return { success: true }
}

/**
 * Check if an entity follows another entity
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('entity_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  return !!data
}

/**
 * Get followers of an entity
 */
export async function getEntityFollowers(entityId: string): Promise<EntityInfo[]> {
  const supabase = await createClient()

  const { data: follows } = await supabase
    .from('entity_follows')
    .select('follower_id')
    .eq('following_id', entityId)
    .order('created_at', { ascending: false })

  if (!follows) return []

  const followers: EntityInfo[] = []
  for (const follow of follows) {
    const info = await getEntityInfo(follow.follower_id)
    if (info) followers.push(info)
  }

  return followers
}

/**
 * Get entities that an entity follows
 */
export async function getEntityFollowing(entityId: string): Promise<EntityInfo[]> {
  const supabase = await createClient()

  const { data: follows } = await supabase
    .from('entity_follows')
    .select('following_id')
    .eq('follower_id', entityId)
    .order('created_at', { ascending: false })

  if (!follows) return []

  const following: EntityInfo[] = []
  for (const follow of follows) {
    const info = await getEntityInfo(follow.following_id)
    if (info) following.push(info)
  }

  return following
}

/**
 * Search for entities to follow
 */
export async function searchEntities(query: string, excludeIds: string[] = []): Promise<EntityInfo[]> {
  const supabase = await createClient()
  const results: EntityInfo[] = []

  // Search profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(5)

  if (profiles) {
    for (const profile of profiles) {
      if (!excludeIds.includes(profile.id)) {
        results.push({
          id: profile.id,
          type: 'user',
          name: profile.display_name || profile.username,
          avatarUrl: profile.avatar_url,
          username: profile.username,
        })
      }
    }
  }

  // Search businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url')
    .ilike('name', `%${query}%`)
    .limit(5)

  if (businesses) {
    for (const business of businesses) {
      if (!excludeIds.includes(business.id)) {
        results.push({
          id: business.id,
          type: 'business',
          name: business.name,
          avatarUrl: business.logo_url,
          slug: business.slug,
        })
      }
    }
  }

  return results
}
