'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateOnboardingProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const avatarUrl = formData.get('avatar_url') as string | null
  const bio = formData.get('bio') as string | null
  const displayName = formData.get('display_name') as string | null

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl || null,
      bio: bio || null,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/onboarding')
  return { success: true }
}

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
    })
    .eq('id', user.id)

  redirect('/')
}

export async function skipOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('profiles')
    .update({
      onboarding_skipped: true,
    })
    .eq('id', user.id)

  redirect('/')
}

export async function followMultipleUsers(userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (userIds.length === 0) {
    return { success: true }
  }

  const follows = userIds.map((id) => ({
    follower_id: user.id,
    following_id: id,
  }))

  const { error } = await supabase
    .from('follows')
    .upsert(follows, { onConflict: 'follower_id,following_id', ignoreDuplicates: true })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/onboarding')
  revalidatePath('/feed')
  return { success: true }
}
