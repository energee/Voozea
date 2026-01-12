'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Package, ChevronRight, Pencil, Trash2, X, Check, Settings2 } from 'lucide-react'
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
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/admin'
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

interface CategoryManagerProps {
  businessTypes: Category[]
  productCategories: Category[]
}

export function CategoryManager({ businessTypes, productCategories }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'business_type' | 'product_category'>('business_type')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Form state for new category
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newParentId, setNewParentId] = useState(NONE_VALUE)
  const [newDefaultCategoryId, setNewDefaultCategoryId] = useState(NONE_VALUE)
  const [newAttributeSchema, setNewAttributeSchema] = useState('')

  // Form state for editing
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editParentId, setEditParentId] = useState(NONE_VALUE)
  const [editDefaultCategoryId, setEditDefaultCategoryId] = useState(NONE_VALUE)
  const [editAttributeSchema, setEditAttributeSchema] = useState('')

  // Sync edit form when category changes
  useEffect(() => {
    if (editingCategory) {
      setEditName(editingCategory.name)
      setEditSlug(editingCategory.slug)
      setEditParentId(editingCategory.parent_id || NONE_VALUE)
      setEditDefaultCategoryId(editingCategory.default_product_category_id || NONE_VALUE)
      setEditAttributeSchema(editingCategory.attribute_schema ? JSON.stringify(editingCategory.attribute_schema, null, 2) : '')
    }
  }, [editingCategory])

  // Auto-generate slug from name
  useEffect(() => {
    if (newName && !newSlug) {
      setNewSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [newName, newSlug])

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const resetNewForm = () => {
    setNewName('')
    setNewSlug('')
    setNewParentId(NONE_VALUE)
    setNewDefaultCategoryId(NONE_VALUE)
    setNewAttributeSchema('')
    setIsAddingNew(false)
  }

  const handleCreate = async () => {
    clearMessages()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('name', newName)
    formData.set('slug', newSlug)
    formData.set('type', activeTab)
    if (newParentId !== NONE_VALUE) formData.set('parent_id', newParentId)
    if (newDefaultCategoryId !== NONE_VALUE) formData.set('default_product_category_id', newDefaultCategoryId)
    if (newAttributeSchema) formData.set('attribute_schema', newAttributeSchema)

    const result = await createCategory(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Category created successfully')
      resetNewForm()
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    clearMessages()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('id', editingCategory.id)
    formData.set('name', editName)
    formData.set('slug', editSlug)
    formData.set('type', editingCategory.type)
    if (editParentId !== NONE_VALUE) formData.set('parent_id', editParentId)
    if (editDefaultCategoryId !== NONE_VALUE) formData.set('default_product_category_id', editDefaultCategoryId)
    if (editAttributeSchema) formData.set('attribute_schema', editAttributeSchema)

    const result = await updateCategory(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Category updated successfully')
      setEditingCategory(null)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
    clearMessages()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('id', category.id)

    const result = await deleteCategory(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Category deleted')
      router.refresh()
    }

    setIsLoading(false)
  }

  const currentCategories = activeTab === 'business_type' ? businessTypes : productCategories
  const topLevelCategories = currentCategories.filter(c => !c.parent_id)
  const topLevelProductCategories = productCategories.filter(c => !c.parent_id)
  const getChildren = (parentId: string) => currentCategories.filter(c => c.parent_id === parentId)

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id)
    const defaultProductCategory = activeTab === 'business_type' && category.default_product_category_id
      ? productCategories.find(c => c.id === category.default_product_category_id)
      : null
    const hasAttributes = category.attribute_schema && Object.keys(category.attribute_schema).length > 0

    return (
      <div key={category.id}>
        <div
          className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50"
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {level > 0 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{category.name}</span>
              <span className="text-xs text-muted-foreground font-mono">/{category.slug}</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {defaultProductCategory && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {defaultProductCategory.name}
                </span>
              )}
              {hasAttributes && (
                <span className="text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  {Object.keys(category.attribute_schema!).length} attrs
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setEditingCategory(category)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(category)}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {children.map(child => renderCategory(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage business types and product categories</p>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 text-red-600 rounded-lg border border-red-500/20">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={clearMessages} className="ml-auto hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 text-sm bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
          <button onClick={clearMessages} className="ml-auto hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab('business_type'); setIsAddingNew(false) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'business_type'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Types
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{businessTypes.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('product_category'); setIsAddingNew(false) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'product_category'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          Product Categories
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{productCategories.length}</span>
        </button>
      </div>

      {/* Category List */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* List Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
          <span className="text-sm font-medium text-muted-foreground">
            {activeTab === 'business_type' ? 'Business Types' : 'Product Categories'}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Add New Form (inline) */}
        {isAddingNew && (
          <div className="p-4 bg-muted/20 border-b space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name *</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={activeTab === 'business_type' ? 'e.g., Brewery' : 'e.g., Beer'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-slug">Slug *</Label>
                <Input
                  id="new-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {activeTab === 'business_type' && (
              <div className="space-y-2">
                <Label>Default Product Category</Label>
                <Select value={newDefaultCategoryId} onValueChange={setNewDefaultCategoryId}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select default category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No default</SelectItem>
                    {topLevelProductCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Products added to businesses of this type will use this category by default
                </p>
              </div>
            )}

            {activeTab === 'product_category' && (
              <>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select value={newParentId} onValueChange={setNewParentId}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="No parent (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No parent (top-level)</SelectItem>
                      {topLevelProductCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-schema">Attribute Schema (JSON)</Label>
                  <Textarea
                    id="new-schema"
                    value={newAttributeSchema}
                    onChange={(e) => setNewAttributeSchema(e.target.value)}
                    placeholder='{"abv": {"type": "number", "label": "ABV %", "min": 0, "max": 100, "step": 0.1}}'
                    rows={3}
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={handleCreate} disabled={isLoading || !newName || !newSlug}>
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetNewForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Category Items */}
        <div>
          {topLevelCategories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No {activeTab === 'business_type' ? 'business types' : 'product categories'} yet</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setIsAddingNew(true)}
              >
                Add your first one
              </Button>
            </div>
          ) : (
            topLevelCategories.map(category => renderCategory(category))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {editingCategory?.type === 'business_type' && (
              <div className="space-y-2">
                <Label>Default Product Category</Label>
                <Select value={editDefaultCategoryId} onValueChange={setEditDefaultCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No default</SelectItem>
                    {topLevelProductCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingCategory?.type === 'product_category' && (
              <>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select value={editParentId} onValueChange={setEditParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No parent (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No parent (top-level)</SelectItem>
                      {topLevelProductCategories
                        .filter(c => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-schema">Attribute Schema (JSON)</Label>
                  <Textarea
                    id="edit-schema"
                    value={editAttributeSchema}
                    onChange={(e) => setEditAttributeSchema(e.target.value)}
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
              <Button onClick={handleUpdate} disabled={isLoading || !editName || !editSlug}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
