'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { ImageUpload } from '@/components/image-upload'
import { createProduct } from '@/lib/actions/product'
import type { CategoryAttributeSchema, AttributeFieldSchema } from '@/types/attributes'

interface Category {
  id: string
  name: string
  slug: string
  attribute_schema: CategoryAttributeSchema | null
}

interface AddProductFormProps {
  businessId: string
  businessSlug: string
  categories: Category[]
  defaultCategoryId?: string | null
}

export function AddProductForm({ businessId, businessSlug, categories, defaultCategoryId }: AddProductFormProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const attributeSchema = selectedCategory?.attribute_schema || {}
  const hasAttributes = Object.keys(attributeSchema).length > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('business_id', businessId)
    formData.set('business_slug', businessSlug)
    if (selectedCategoryId) {
      formData.set('category_id', selectedCategoryId)
    }

    try {
      await createProduct(formData)
    } catch (err) {
      setError('Failed to create product. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe this product..."
          rows={3}
        />
      </div>

      <ImageUpload name="photo_url" label="Product Photo" />

      {categories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {defaultCategoryId && selectedCategoryId === defaultCategoryId
              ? 'Pre-selected based on business type. Change if needed.'
              : 'Selecting a category enables specific attributes for this product type'}
          </p>
        </div>
      )}

      {hasAttributes && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-4">
            {selectedCategory?.name} Attributes
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(attributeSchema).map(([key, field]) => (
              <AttributeField key={key} name={key} schema={field} />
            ))}
          </div>
        </div>
      )}

      {!hasAttributes && !selectedCategoryId && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Optional attributes
          </p>
          <div className="space-y-2">
            <Label htmlFor="abv">ABV %</Label>
            <Input
              id="abv"
              name="abv"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="5.5"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Product'}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/business/${businessSlug}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

function AttributeField({ name, schema }: { name: string; schema: AttributeFieldSchema }) {
  if (schema.type === 'select' && schema.options) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`attr-${name}`}>
          {schema.label}
          {!schema.optional && <span className="text-destructive"> *</span>}
        </Label>
        <Select name={name}>
          <SelectTrigger id={`attr-${name}`}>
            <SelectValue placeholder={`Select ${schema.label}`} />
          </SelectTrigger>
          <SelectContent>
            {schema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`attr-${name}`}>
        {schema.label}
        {!schema.optional && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={`attr-${name}`}
        name={name}
        type={schema.type === 'number' ? 'number' : 'text'}
        min={schema.min}
        max={schema.max}
        step={schema.step}
        required={!schema.optional}
        placeholder={schema.label}
      />
    </div>
  )
}
