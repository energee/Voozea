'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function followBusiness(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to follow businesses')
  }

  const businessId = formData.get('business_id') as string

  if (!businessId) {
    return { error: 'Missing business ID' }
  }

  const { error } = await supabase.from('business_follows').insert({
    business_id: businessId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You are already following this business' }
    }
    return { error: error.message }
  }

  revalidatePath(`/business`)
}

export async function unfollowBusiness(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to unfollow businesses')
  }

  const businessId = formData.get('business_id') as string

  if (!businessId) {
    return { error: 'Missing business ID' }
  }

  const { error } = await supabase
    .from('business_follows')
    .delete()
    .eq('business_id', businessId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/business`)
}
