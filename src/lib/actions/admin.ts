'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CategoryAttributeSchema } from '@/types/attributes'
import type { Json } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=You must be logged in')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/?error=You do not have admin access')
  }

  return { supabase, user }
}

// =====================================================
// CATEGORY MANAGEMENT
// =====================================================

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const type = formData.get('type') as 'business_type' | 'product_category'
  const parentId = formData.get('parent_id') as string
  const defaultProductCategoryId = formData.get('default_product_category_id') as string
  const attributeSchemaRaw = formData.get('attribute_schema') as string

  let attributeSchema: CategoryAttributeSchema | null = null
  if (attributeSchemaRaw) {
    try {
      attributeSchema = JSON.parse(attributeSchemaRaw)
    } catch {
      return { error: 'Invalid attribute schema JSON' }
    }
  }

  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    type,
    parent_id: parentId || null,
    default_product_category_id: defaultProductCategoryId || null,
    attribute_schema: attributeSchema as Json | null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateCategory(formData: FormData) {
  const { supabase } = await requireAdmin()

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const type = formData.get('type') as 'business_type' | 'product_category'
  const parentId = formData.get('parent_id') as string
  const defaultProductCategoryId = formData.get('default_product_category_id') as string
  const attributeSchemaRaw = formData.get('attribute_schema') as string

  let attributeSchema: CategoryAttributeSchema | null = null
  if (attributeSchemaRaw) {
    try {
      attributeSchema = JSON.parse(attributeSchemaRaw)
    } catch {
      return { error: 'Invalid attribute schema JSON' }
    }
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      type,
      parent_id: parentId || null,
      default_product_category_id: defaultProductCategoryId || null,
      attribute_schema: attributeSchema as Json | null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin()

  const id = formData.get('id') as string

  // Check if category is in use by businesses
  const { data: businessesUsingCategory } = await supabase
    .from('businesses')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (businessesUsingCategory && businessesUsingCategory.length > 0) {
    return { error: 'Cannot delete: this category is assigned to one or more businesses' }
  }

  // Check if category is in use by products
  const { data: productsUsingCategory } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (productsUsingCategory && productsUsingCategory.length > 0) {
    return { error: 'Cannot delete: this category is assigned to one or more products' }
  }

  // Check if this product category is set as default for any business type
  const { data: businessTypesUsingAsDefault } = await supabase
    .from('categories')
    .select('id, name')
    .eq('default_product_category_id', id)
    .limit(1)

  if (businessTypesUsingAsDefault && businessTypesUsingAsDefault.length > 0) {
    return { error: `Cannot delete: this is the default product category for "${businessTypesUsingAsDefault[0].name}"` }
  }

  // Check if this category has child categories
  const { data: childCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', id)
    .limit(1)

  if (childCategories && childCategories.length > 0) {
    return { error: 'Cannot delete: this category has subcategories. Delete them first.' }
  }

  const { error, count } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    return { error: error.message }
  }

  // Check if anything was actually deleted (RLS might silently block)
  const { data: stillExists } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .single()

  if (stillExists) {
    return { error: 'Delete failed - you may not have permission to delete this category' }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

// =====================================================
// BUSINESS CLAIMS MANAGEMENT
// =====================================================

export async function approveClaim(formData: FormData) {
  const { supabase } = await requireAdmin()

  const claimId = formData.get('claim_id') as string

  // Get the claim details
  const { data: claim, error: claimError } = await supabase
    .from('business_claims')
    .select('id, business_id, user_id, status')
    .eq('id', claimId)
    .single()

  if (claimError || !claim) {
    return { error: 'Claim not found' }
  }

  if (claim.status !== 'pending') {
    return { error: 'Claim is not pending' }
  }

  // Update the claim status
  const { error: updateClaimError } = await supabase
    .from('business_claims')
    .update({ status: 'approved' })
    .eq('id', claimId)

  if (updateClaimError) {
    return { error: updateClaimError.message }
  }

  // Update the business to set owner and mark as claimed
  const { error: updateBusinessError } = await supabase
    .from('businesses')
    .update({
      owner_id: claim.user_id,
      is_claimed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', claim.business_id)

  if (updateBusinessError) {
    return { error: updateBusinessError.message }
  }

  // Update the user's profile to mark as business owner
  await supabase
    .from('profiles')
    .update({ is_business_owner: true })
    .eq('id', claim.user_id)

  revalidatePath('/admin/claims')
  return { success: true, message: 'Claim approved successfully' }
}

export async function rejectClaim(formData: FormData) {
  const { supabase } = await requireAdmin()

  const claimId = formData.get('claim_id') as string
  const reason = formData.get('reason') as string

  const { data: claim } = await supabase
    .from('business_claims')
    .select('id, status')
    .eq('id', claimId)
    .single()

  if (!claim) {
    return { error: 'Claim not found' }
  }

  if (claim.status !== 'pending') {
    return { error: 'Claim is not pending' }
  }

  const { error } = await supabase
    .from('business_claims')
    .update({
      status: 'rejected',
      review_notes: reason || null,
    })
    .eq('id', claimId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/claims')
  return { success: true, message: 'Claim rejected' }
}

export async function getAdminStats() {
  const { supabase } = await requireAdmin()

  const [
    { count: pendingClaimsCount },
    { count: totalBusinesses },
    { count: totalProducts },
    { count: totalUsers },
    { count: totalCategories },
  ] = await Promise.all([
    supabase.from('business_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])

  return {
    pendingClaims: pendingClaimsCount || 0,
    totalBusinesses: totalBusinesses || 0,
    totalProducts: totalProducts || 0,
    totalUsers: totalUsers || 0,
    totalCategories: totalCategories || 0,
  }
}
