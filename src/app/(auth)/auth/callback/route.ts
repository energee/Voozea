import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user needs onboarding (this is typically a new user confirming email)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_skipped')
        .eq('id', data.user.id)
        .single()

      if (profile && !profile.onboarding_completed && !profile.onboarding_skipped) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Could not authenticate`)
}
