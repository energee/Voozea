'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  businesses: Array<{
    id: string
    name: string
    slug: string
    logo_url: string | null
    description: string | null
    average_rating: number | null
  }>
  products: Array<{
    id: string
    name: string
    photo_url: string | null
    business_name: string
    business_slug: string
    average_rating: number | null
  }>
  users: Array<{
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }>
}

export async function globalSearch(query: string): Promise<SearchResult> {
  if (!query || query.trim().length < 2) {
    return { businesses: [], products: [], users: [] }
  }

  const supabase = await createClient()
  const searchTerm = `%${query.trim()}%`

  // Search in parallel
  const [businessesResult, productsResult, usersResult] = await Promise.all([
    // Search businesses
    supabase
      .from('businesses')
      .select('id, name, slug, logo_url, description, average_rating')
      .ilike('name', searchTerm)
      .limit(5),

    // Search products with business info
    supabase
      .from('products')
      .select(`
        id,
        name,
        photo_url,
        average_rating,
        businesses!inner (
          name,
          slug
        )
      `)
      .ilike('name', searchTerm)
      .limit(5),

    // Search users
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
      .limit(5),
  ])

  // Transform products to include business info at top level
  const products = (productsResult.data || []).map((product) => {
    const business = product.businesses as unknown as { name: string; slug: string }
    return {
      id: product.id,
      name: product.name,
      photo_url: product.photo_url,
      average_rating: product.average_rating,
      business_name: business.name,
      business_slug: business.slug,
    }
  })

  return {
    businesses: businessesResult.data || [],
    products,
    users: usersResult.data || [],
  }
}
