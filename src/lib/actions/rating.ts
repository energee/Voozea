'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRating(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to rate a product')
  }

  // Ensure user has a profile
  await ensureProfile(supabase)

  const productId = formData.get('product_id') as string
  const score = parseFloat(formData.get('score') as string)
  const comment = formData.get('comment') as string
  const photoUrl = formData.get('photo_url') as string | null

  if (score < 1 || score > 10) {
    return { error: 'Rating must be between 1 and 10' }
  }

  // Check for existing rating
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing rating
    const { error } = await supabase
      .from('ratings')
      .update({
        score,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }

    // Handle photo: delete existing and insert new if provided
    await supabase
      .from('rating_photos')
      .delete()
      .eq('rating_id', existing.id)

    if (photoUrl) {
      await supabase
        .from('rating_photos')
        .insert({
          rating_id: existing.id,
          url: photoUrl,
        })
    }
  } else {
    // Create new rating
    const { data: newRating, error } = await supabase
      .from('ratings')
      .insert({
        product_id: productId,
        user_id: user.id,
        score,
        comment: comment || null,
      })
      .select('id')
      .single()

    if (error) {
      return { error: error.message }
    }

    // Insert photo if provided
    if (photoUrl && newRating) {
      await supabase
        .from('rating_photos')
        .insert({
          rating_id: newRating.id,
          url: photoUrl,
        })
    }
  }

  revalidatePath(`/product/${productId}`)
  revalidatePath('/feed')
}
