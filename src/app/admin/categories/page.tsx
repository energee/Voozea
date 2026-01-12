import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from './category-manager'
import type { CategoryAttributeSchema } from '@/types/attributes'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, type, parent_id, default_product_category_id, attribute_schema')
    .order('type')
    .order('name')

  const businessTypes = categories?.filter(c => c.type === 'business_type') || []
  const productCategories = categories?.filter(c => c.type === 'product_category') || []

  // Format for components
  const formattedBusinessTypes = businessTypes.map(c => ({
    ...c,
    attribute_schema: c.attribute_schema as CategoryAttributeSchema | null,
  }))

  const formattedProductCategories = productCategories.map(c => ({
    ...c,
    attribute_schema: c.attribute_schema as CategoryAttributeSchema | null,
  }))

  return (
    <CategoryManager
      businessTypes={formattedBusinessTypes}
      productCategories={formattedProductCategories}
    />
  )
}
