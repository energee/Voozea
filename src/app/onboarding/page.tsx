import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { getSuggestedUsers } from '@/lib/actions/suggestions'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // If already completed or skipped onboarding, go to home
  if (profile.onboarding_completed || profile.onboarding_skipped) {
    redirect('/')
  }

  // Fetch suggested users to follow
  const suggestedUsers = await getSuggestedUsers(user.id, 8)

  // Fetch sample products for first rating
  const { data: sampleProducts } = await supabase
    .from('products')
    .select(`
      id,
      name,
      photo_url,
      average_rating,
      total_ratings,
      businesses:business_id (
        name,
        slug
      )
    `)
    .order('total_ratings', { ascending: false })
    .limit(6)

  return (
    <OnboardingWizard
      profile={profile}
      suggestedUsers={suggestedUsers}
      sampleProducts={sampleProducts || []}
    />
  )
}
