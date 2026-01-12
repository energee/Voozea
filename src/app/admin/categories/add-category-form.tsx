'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCategory } from '@/lib/actions/admin'
import type { CategoryAttributeSchema } from '@/types/attributes'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  parent_id: string | null
  attribute_schema: CategoryAttributeSchema | null
}

interface AddCategoryFormProps {
  productCategories: Category[]
}

const NONE_VALUE = '__none__'

export function AddCategoryForm({ productCategories }: AddCategoryFormProps) {
  const [type, setType] = useState<'business_type' | 'product_category'>('business_type')
  const [parentId, setParentId] = useState<string>(NONE_VALUE)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>(NONE_VALUE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    formData.set('type', type)

    // Convert NONE_VALUE back to empty string for server
    if (parentId !== NONE_VALUE) {
      formData.set('parent_id', parentId)
    }
    if (defaultCategoryId !== NONE_VALUE) {
      formData.set('default_product_category_id', defaultCategoryId)
    }

    const result = await createCategory(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      // Reset form
      const form = document.getElementById('add-category-form') as HTMLFormElement
      form?.reset()
      setParentId(NONE_VALUE)
      setDefaultCategoryId(NONE_VALUE)
      router.refresh()
    }

    setIsLoading(false)
  }

  const topLevelProductCategories = productCategories.filter(c => !c.parent_id)

  return (
    <form id="add-category-form" action={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 bg-green-50 p-3 rounded">
          Category created successfully!
        </p>
      )}

      <div className="space-y-2">
        <Label>Category Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="business_type">Business Type</SelectItem>
            <SelectItem value="product_category">Product Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required placeholder="e.g., Brewery, Beer" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" name="slug" required placeholder="e.g., brewery, beer" />
        <p className="text-xs text-muted-foreground">URL-friendly identifier (lowercase, no spaces)</p>
      </div>

      {type === 'business_type' && (
        <div className="space-y-2">
          <Label>Default Product Category</Label>
          <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select default category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>No default</SelectItem>
              {topLevelProductCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Products added to businesses of this type will default to this category
          </p>
        </div>
      )}

      {type === 'product_category' && (
        <>
          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="No parent (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>No parent (top-level)</SelectItem>
                {topLevelProductCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribute_schema">Attribute Schema (JSON)</Label>
            <Textarea
              id="attribute_schema"
              name="attribute_schema"
              placeholder='{"abv": {"type": "number", "label": "ABV %", "min": 0, "max": 100, "step": 0.1}}'
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Define custom attributes for products in this category
            </p>
          </div>
        </>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Category'}
      </Button>
    </form>
  )
}
