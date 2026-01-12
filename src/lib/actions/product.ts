'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ProductAttributes, CategoryAttributeSchema, AttributeFieldSchema } from '@/types/attributes'
import { getBusinessRole } from './business-team'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to add a product')
  }

  const businessId = formData.get('business_id') as string
  const businessSlug = formData.get('business_slug') as string

  // Verify user has permission (owner or manager)
  const role = await getBusinessRole(businessId, user.id)
  if (!role) {
    redirect(`/business/${businessSlug}?error=You do not have permission to add products to this business`)
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const photoUrl = formData.get('photo_url') as string
  const categoryId = formData.get('category_id') as string | null

  // Build attributes object from form data
  const attributes: Record<string, string | number> = {}

  // If category is selected, fetch its schema and extract those attributes
  if (categoryId) {
    const { data: category } = await supabase
      .from('categories')
      .select('attribute_schema')
      .eq('id', categoryId)
      .single()

    const schema = (category?.attribute_schema as unknown as CategoryAttributeSchema) || {}

    for (const [key, fieldSchema] of Object.entries(schema)) {
      const value = formData.get(key) as string
      if (value) {
        if (fieldSchema.type === 'number') {
          attributes[key] = parseFloat(value)
        } else {
          attributes[key] = value
        }
      }
    }
  } else {
    // Fallback: check for common attributes when no category selected
    const abv = formData.get('abv') as string
    const price = formData.get('price') as string

    if (abv) attributes.abv = parseFloat(abv)
    if (price) attributes.price = parseFloat(price)
  }

  const baseSlug = slugify(name)
  let slug = baseSlug
  let counter = 1

  // Ensure unique slug within business
  while (true) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', businessId)
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      business_id: businessId,
      name,
      slug,
      description: description || null,
      photo_url: photoUrl || null,
      category_id: categoryId || null,
      attributes: Object.keys(attributes).length > 0 ? attributes : null,
    })
    .select()
    .single()

  if (error) {
    redirect(`/business/${businessSlug}/add-product?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/product/${product.id}`)
}

function validateAttributes(
  attributes: ProductAttributes,
  schema: CategoryAttributeSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = attributes[key]

    // Check required fields
    if (!fieldSchema.optional && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldSchema.label} is required`)
      continue
    }

    // Skip validation for empty optional fields
    if (value === null || value === undefined || value === '') continue

    // Type validation
    if (fieldSchema.type === 'number') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        errors.push(`${fieldSchema.label} must be a number`)
        continue
      }
      if (fieldSchema.min !== undefined && numValue < fieldSchema.min) {
        errors.push(`${fieldSchema.label} must be at least ${fieldSchema.min}`)
      }
      if (fieldSchema.max !== undefined && numValue > fieldSchema.max) {
        errors.push(`${fieldSchema.label} must be at most ${fieldSchema.max}`)
      }
    }

    if (fieldSchema.type === 'select' && fieldSchema.options) {
      if (!fieldSchema.options.includes(String(value))) {
        errors.push(`${fieldSchema.label} must be one of: ${fieldSchema.options.join(', ')}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export async function updateProductAttributes(
  productId: string,
  attributes: ProductAttributes
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be logged in to update product attributes' }
  }

  // Fetch product with business and category info
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select(`
      id,
      business_id,
      category_id,
      businesses!inner (
        id,
        owner_id
      ),
      categories (
        id,
        attribute_schema
      )
    `)
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    return { success: false, error: 'Product not found' }
  }

  // Verify user has permission (owner or manager)
  const role = await getBusinessRole(product.business_id, user.id)
  if (!role) {
    return { success: false, error: 'You do not have permission to edit this product' }
  }

  // Validate against category schema if available
  const category = product.categories as unknown as { id: string; attribute_schema: CategoryAttributeSchema } | null
  if (category?.attribute_schema && Object.keys(category.attribute_schema).length > 0) {
    const validation = validateAttributes(attributes, category.attribute_schema)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') }
    }
  }

  // Process attributes - convert string numbers to actual numbers
  const processedAttributes: ProductAttributes = {}
  const schema = category?.attribute_schema || {}

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === '') continue

    const fieldSchema = schema[key] as AttributeFieldSchema | undefined
    if (fieldSchema?.type === 'number') {
      processedAttributes[key] = typeof value === 'string' ? parseFloat(value) : value
    } else {
      processedAttributes[key] = value
    }
  }

  // Update product attributes
  const { error: updateError } = await supabase
    .from('products')
    .update({
      attributes: Object.keys(processedAttributes).length > 0 ? processedAttributes : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export async function updateProduct(
  productId: string,
  data: { name?: string; description?: string | null; photo_url?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be logged in to update this product' }
  }

  // Fetch product with business info
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select(`
      id,
      business_id,
      businesses!inner (
        id,
        owner_id
      )
    `)
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    return { success: false, error: 'Product not found' }
  }

  // Verify user has permission (owner or manager)
  const role = await getBusinessRole(product.business_id, user.id)
  if (!role) {
    return { success: false, error: 'You do not have permission to edit this product' }
  }

  // Validate name if provided
  if (data.name !== undefined) {
    const trimmedName = data.name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Product name is required' }
    }
    data.name = trimmedName
  }

  // Update product
  const { error: updateError } = await supabase
    .from('products')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
