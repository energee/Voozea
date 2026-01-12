'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getBusinessRole } from './business-team'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Sanitize slug to be URL-safe (lowercase, no spaces, alphanumeric + hyphens)
function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function parseHours(formData: FormData): Record<string, { open: string; close: string } | null> | null {
  const hours: Record<string, { open: string; close: string } | null> = {}
  let hasAnyHours = false

  for (const day of DAYS) {
    const open = formData.get(`hours_${day}_open`) as string
    const close = formData.get(`hours_${day}_close`) as string

    if (open && close) {
      hours[day] = { open, close }
      hasAnyHours = true
    } else {
      hours[day] = null
    }
  }

  return hasAnyHours ? hours : null
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to add a business')
  }

  const name = formData.get('name') as string
  const categoryId = formData.get('category_id') as string
  const description = formData.get('description') as string
  const phone = formData.get('phone') as string
  const website = formData.get('website') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const postalCode = formData.get('postal_code') as string
  const country = formData.get('country') as string
  const logoUrl = formData.get('logo_url') as string
  const coverUrl = formData.get('cover_url') as string
  const instagramUrl = formData.get('instagram_url') as string
  const facebookUrl = formData.get('facebook_url') as string
  const twitterUrl = formData.get('twitter_url') as string
  const hours = parseHours(formData)

  const baseSlug = slugify(name)
  let slug = baseSlug
  let counter = 1

  // Ensure unique slug
  while (true) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const { error } = await supabase.from('businesses').insert({
    name,
    slug,
    category_id: categoryId || null,
    description: description || null,
    phone: phone || null,
    website: website || null,
    address: address || null,
    city: city || null,
    state: state || null,
    postal_code: postalCode || null,
    country: country || null,
    logo_url: logoUrl || null,
    cover_url: coverUrl || null,
    instagram_url: instagramUrl || null,
    facebook_url: facebookUrl || null,
    twitter_url: twitterUrl || null,
    hours: hours,
  })

  if (error) {
    redirect(`/businesses/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/business/${slug}`)
}

export async function claimBusiness(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to claim a business')
  }

  const businessId = formData.get('business_id') as string
  const reason = formData.get('reason') as string

  if (!reason || reason.trim().length < 10) {
    return { error: 'Please provide a reason with at least 10 characters explaining why you own this business' }
  }

  // Check if business exists and is not already claimed
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, is_claimed, owner_id')
    .eq('id', businessId)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  if (business.is_claimed) {
    return { error: 'This business has already been claimed' }
  }

  // Check if user already has a pending claim for this business
  const { data: existingClaim } = await supabase
    .from('business_claims')
    .select('id, status')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .single()

  if (existingClaim) {
    if (existingClaim.status === 'pending') {
      return { error: 'You already have a pending claim for this business' }
    }
    if (existingClaim.status === 'approved') {
      return { error: 'Your claim has already been approved' }
    }
    // If rejected, allow them to submit a new claim by deleting the old one
    await supabase
      .from('business_claims')
      .delete()
      .eq('id', existingClaim.id)
  }

  // Create the claim request
  const { error } = await supabase
    .from('business_claims')
    .insert({
      business_id: businessId,
      user_id: user.id,
      reason: reason.trim(),
      status: 'pending',
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/business/${business.slug}`)
  return { success: true, message: 'Your claim has been submitted and is pending review' }
}

export async function updateBusiness(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to update a business')
  }

  const businessId = formData.get('business_id') as string

  // Verify ownership (only owners can edit business details)
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', businessId)
    .single()

  if (!business) {
    redirect('/businesses?error=Business not found')
  }

  const role = await getBusinessRole(businessId, user.id)
  if (role !== 'owner') {
    redirect(`/business/${business.slug}?error=You do not have permission to edit this business`)
  }

  const name = formData.get('name') as string
  const rawSlug = formData.get('slug') as string
  const description = formData.get('description') as string
  const phone = formData.get('phone') as string
  const website = formData.get('website') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const postalCode = formData.get('postal_code') as string
  const country = formData.get('country') as string
  const logoUrl = formData.get('logo_url') as string
  const coverUrl = formData.get('cover_url') as string
  const instagramUrl = formData.get('instagram_url') as string
  const facebookUrl = formData.get('facebook_url') as string
  const twitterUrl = formData.get('twitter_url') as string
  const hours = parseHours(formData)

  // Handle slug change
  let newSlug = business.slug
  if (rawSlug && rawSlug !== business.slug) {
    newSlug = sanitizeSlug(rawSlug)

    if (newSlug.length < 3) {
      redirect(`/business/${business.slug}/edit?error=Business username must be at least 3 characters`)
    }

    // Check if username is taken
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', businessId)
      .single()

    if (existing) {
      redirect(`/business/${business.slug}/edit?error=Business username "${newSlug}" is already taken`)
    }
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      slug: newSlug,
      description: description || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postal_code: postalCode || null,
      country: country || null,
      logo_url: logoUrl || null,
      cover_url: coverUrl || null,
      instagram_url: instagramUrl || null,
      facebook_url: facebookUrl || null,
      twitter_url: twitterUrl || null,
      hours: hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId)

  if (error) {
    redirect(`/business/${business.slug}/edit?error=${encodeURIComponent(error.message)}`)
  }

  // Revalidate both old and new paths in case slug changed
  if (newSlug !== business.slug) {
    revalidatePath(`/business/${business.slug}`)
  }
  revalidatePath(`/business/${newSlug}`)
  redirect(`/business/${newSlug}`)
}

export async function cancelClaim(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to cancel a claim')
  }

  const claimId = formData.get('claim_id') as string

  // Get the claim to verify ownership and get business slug
  const { data: claim } = await supabase
    .from('business_claims')
    .select(`
      id,
      user_id,
      status,
      businesses!business_claims_business_id_fkey (slug)
    `)
    .eq('id', claimId)
    .single()

  if (!claim) {
    return { error: 'Claim not found' }
  }

  if (claim.user_id !== user.id) {
    return { error: 'You can only cancel your own claims' }
  }

  if (claim.status !== 'pending') {
    return { error: 'Only pending claims can be cancelled' }
  }

  const { error } = await supabase
    .from('business_claims')
    .delete()
    .eq('id', claimId)

  if (error) {
    return { error: error.message }
  }

  const business = claim.businesses as { slug: string }
  revalidatePath(`/business/${business.slug}`)
  return { success: true }
}
