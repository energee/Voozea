'use client'

import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateCategory, deleteCategory } from '@/lib/actions/admin'
import type { CategoryAttributeSchema } from '@/types/attributes'

const NONE_VALUE = '__none__'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  parent_id: string | null
  default_product_category_id: string | null
  attribute_schema: CategoryAttributeSchema | null
}

interface CategoryListProps {
  categories: Category[]
  type: 'business_type' | 'product_category'
  productCategories: Category[]
}

export function CategoryList({ categories, type, productCategories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editParentId, setEditParentId] = useState<string>(NONE_VALUE)
  const [editDefaultCategoryId, setEditDefaultCategoryId] = useState<string>(NONE_VALUE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Sync select values when editing category changes
  useEffect(() => {
    if (editingCategory) {
      setEditParentId(editingCategory.parent_id || NONE_VALUE)
      setEditDefaultCategoryId(editingCategory.default_product_category_id || NONE_VALUE)
    }
  }, [editingCategory])

  const topLevelCategories = categories.filter(c => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  const handleUpdate = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    // Set the select values from state (converting NONE_VALUE to empty)
    if (editParentId !== NONE_VALUE) {
      formData.set('parent_id', editParentId)
    } else {
      formData.delete('parent_id')
    }
    if (editDefaultCategoryId !== NONE_VALUE) {
      formData.set('default_product_category_id', editDefaultCategoryId)
    } else {
      formData.delete('default_product_category_id')
    }

    const result = await updateCategory(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setEditingCategory(null)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('id', id)

    const result = await deleteCategory(formData)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }

    setIsLoading(false)
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id)
    const defaultProductCategory = type === 'business_type' && category.default_product_category_id
      ? productCategories.find(c => c.id === category.default_product_category_id)
      : null

    return (
      <div key={category.id} style={{ marginLeft: level * 16 }}>
        <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 group">
          <div className="flex-1">
            <span className="font-medium">{category.name}</span>
            <span className="text-xs text-muted-foreground ml-2">/{category.slug}</span>
            {defaultProductCategory && (
              <span className="text-xs text-muted-foreground ml-2">
                → {defaultProductCategory.name}
              </span>
            )}
            {category.attribute_schema && Object.keys(category.attribute_schema).length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-2">
                {Object.keys(category.attribute_schema).length} attributes
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingCategory(category)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(category.id)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
        {children.map(child => renderCategory(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {topLevelCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No {type === 'business_type' ? 'business types' : 'product categories'} yet
        </p>
      ) : (
        topLevelCategories.map(category => renderCategory(category))
      )}

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>

          {editingCategory && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editingCategory.id} />
              <input type="hidden" name="type" value={editingCategory.type} />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  defaultValue={editingCategory.slug}
                  required
                />
              </div>

              {editingCategory.type === 'business_type' && (
                <div className="space-y-2">
                  <Label>Default Product Category</Label>
                  <Select
                    value={editDefaultCategoryId}
                    onValueChange={setEditDefaultCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No default</SelectItem>
                      {productCategories.filter(c => !c.parent_id).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingCategory.type === 'product_category' && (
                <>
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select
                      value={editParentId}
                      onValueChange={setEditParentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No parent (top-level)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>No parent (top-level)</SelectItem>
                        {productCategories
                          .filter(c => !c.parent_id && c.id !== editingCategory.id)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-schema">Attribute Schema (JSON)</Label>
                    <Textarea
                      id="edit-schema"
                      name="attribute_schema"
                      defaultValue={editingCategory.attribute_schema
                        ? JSON.stringify(editingCategory.attribute_schema, null, 2)
                        : ''}
                      placeholder='{"abv": {"type": "number", "label": "ABV %", "min": 0, "max": 100}}'
                      rows={4}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define attributes for products in this category
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
