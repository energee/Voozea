'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Sanitize username to be URL-safe (lowercase, no spaces, alphanumeric + underscores)
function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_|_$/g, '')        // Remove leading/trailing underscores
    .slice(0, 30)                 // Limit length
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawUsername = formData.get('username') as string

  // Sanitize username for URL safety, keep original as display name
  const username = sanitizeUsername(rawUsername)
  const displayName = rawUsername.trim()

  if (username.length < 3) {
    redirect('/register?error=Username must be at least 3 characters')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Check if user needs onboarding
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_skipped')
      .eq('id', data.user.id)
      .single()

    if (profile && !profile.onboarding_completed && !profile.onboarding_skipped) {
      redirect('/onboarding')
    }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Check your email for the password reset link')
}
