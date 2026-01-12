'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Sanitize username to be URL-safe (lowercase, no spaces, alphanumeric + underscores)
function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30)
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to update your profile')
  }

  const rawUsername = formData.get('username') as string
  const displayName = formData.get('display_name') as string
  const bio = formData.get('bio') as string
  const avatarUrl = formData.get('avatar_url') as string

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login?error=Profile not found')
  }

  // Handle username change
  let newUsername = profile.username
  if (rawUsername && rawUsername !== profile.username) {
    newUsername = sanitizeUsername(rawUsername)

    if (newUsername.length < 3) {
      redirect('/profile/edit?error=Username must be at least 3 characters')
    }

    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newUsername)
      .neq('id', user.id)
      .single()

    if (existing) {
      redirect(`/profile/edit?error=Username "${newUsername}" is already taken`)
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: newUsername,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    redirect(`/profile/edit?error=${encodeURIComponent(error.message)}`)
  }

  // Revalidate both old and new paths in case username changed
  if (newUsername !== profile.username) {
    revalidatePath(`/profile/${profile.username}`)
  }
  revalidatePath(`/profile/${newUsername}`)
  redirect(`/profile/${newUsername}`)
}
