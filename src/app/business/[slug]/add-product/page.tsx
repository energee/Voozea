import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { AddProductForm } from '@/components/product/add-product-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { CategoryAttributeSchema } from '@/types/attributes'

export default async function AddProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch business with its type (category) which has the default product category
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      category:categories (
        id,
        name,
        default_product_category_id
      )
    `)
    .eq('slug', slug)
    .single()

  if (!business) {
    notFound()
  }

  // Get the default product category from the business type
  const businessType = business.category as { id: string; name: string; default_product_category_id: string | null } | null
  const defaultProductCategoryId = businessType?.default_product_category_id || null

  // Fetch product categories with their attribute schemas
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, attribute_schema')
    .eq('type', 'product_category')
    .order('name')

  const formattedCategories = (categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    attribute_schema: cat.attribute_schema as CategoryAttributeSchema | null,
  }))

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="max-w-2xl mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/businesses">Businesses</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/business/${business.slug}`}>{business.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Product</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add a Product</CardTitle>
            <CardDescription>
              Add a beer, dish, or other product to {business.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddProductForm
              businessId={business.id}
              businessSlug={business.slug}
              categories={formattedCategories}
              defaultCategoryId={defaultProductCategoryId}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
