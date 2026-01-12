import { SupabaseClient } from '@supabase/supabase-js'

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

export async function ensureProfile(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) return profile

  // Create profile if missing
  const rawUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'user'
  const username = sanitizeUsername(rawUsername)
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: `${username}_${Date.now()}`, // Ensure unique
      display_name: user.user_metadata?.display_name || rawUsername,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create profile:', error)
    return null
  }

  return newProfile
}
