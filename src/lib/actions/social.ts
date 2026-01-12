'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// =====================================================
// FOLLOW ACTIONS
// =====================================================

export async function followUser(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to follow users')
  }

  await ensureProfile(supabase)

  const followingId = formData.get('user_id') as string

  if (followingId === user.id) {
    return { error: 'You cannot follow yourself' }
  }

  // Use entity_follows table (user's entity_id equals their profile id)
  const { error } = await supabase.from('entity_follows').insert({
    follower_id: user.id,
    following_id: followingId,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You are already following this user' }
    }
    return { error: error.message }
  }

  revalidatePath(`/profile`)
}

export async function unfollowUser(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to unfollow users')
  }

  const followingId = formData.get('user_id') as string

  // Use entity_follows table (user's entity_id equals their profile id)
  const { error } = await supabase
    .from('entity_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/profile`)
}

// =====================================================
// LIKE ACTIONS
// =====================================================

export async function likeRating(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to like ratings')
  }

  await ensureProfile(supabase)

  const ratingId = formData.get('rating_id') as string

  const { error } = await supabase.from('rating_likes').insert({
    rating_id: ratingId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You already liked this rating' }
    }
    return { error: error.message }
  }

  revalidatePath(`/product`)
  revalidatePath(`/feed`)
}

export async function unlikeRating(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to unlike ratings')
  }

  const ratingId = formData.get('rating_id') as string

  const { error } = await supabase
    .from('rating_likes')
    .delete()
    .eq('rating_id', ratingId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/product`)
  revalidatePath(`/feed`)
}

// =====================================================
// COMMENT ACTIONS
// =====================================================

export async function createComment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to comment')
  }

  await ensureProfile(supabase)

  const ratingId = formData.get('rating_id') as string
  const content = formData.get('content') as string

  if (!content || content.trim().length === 0) {
    return { error: 'Comment cannot be empty' }
  }

  const { data: comment, error } = await supabase
    .from('rating_comments')
    .insert({
      rating_id: ratingId,
      user_id: user.id,
      content: content.trim(),
    })
    .select('id, content, created_at')
    .single()

  if (error) {
    return { error: error.message }
  }

  // Fetch user profile for the response
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  revalidatePath(`/product`)
  revalidatePath(`/feed`)

  return {
    comment: {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: profile ? {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      } : {
        id: user.id,
        username: 'user',
        display_name: null,
        avatar_url: null,
      },
    },
  }
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to delete comments')
  }

  const commentId = formData.get('comment_id') as string

  const { error } = await supabase
    .from('rating_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/product`)
  revalidatePath(`/feed`)
}

// =====================================================
// NOTIFICATION ACTIONS
// =====================================================

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const notificationId = formData.get('notification_id') as string

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/notifications`)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return
  }

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  revalidatePath(`/notifications`)
}
