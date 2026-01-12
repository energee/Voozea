'use client'

import { useState, useTransition } from 'react'
import { Beer, Pencil, X, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateProductAttributes } from '@/lib/actions/product'
import type { CategoryAttributeSchema, ProductAttributes } from '@/types/attributes'

const ATTRIBUTE_ICONS: Record<string, React.ReactNode> = {
  abv: <Beer className="h-3.5 w-3.5" />,
}

const ATTRIBUTE_SUFFIXES: Record<string, string> = {
  abv: '% ABV',
}

interface AttributeEditorProps {
  productId: string
  attributes: ProductAttributes | null
  schema: CategoryAttributeSchema | null
  isOwner: boolean
}

export function AttributeEditor({
  productId,
  attributes,
  schema,
  isOwner,
}: AttributeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAttributes, setEditedAttributes] = useState<ProductAttributes>(
    attributes || {}
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateProductAttributes(productId, editedAttributes)
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  const handleCancel = () => {
    setEditedAttributes(attributes || {})
    setError(null)
    setIsEditing(false)
  }

  const handleFieldChange = (key: string, value: string) => {
    setEditedAttributes((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // If no schema, use fallback display for existing attributes
  const displaySchema = schema && Object.keys(schema).length > 0 ? schema : null
  const hasAttributes = attributes && Object.keys(attributes).length > 0

  // Display mode
  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {hasAttributes &&
          Object.entries(attributes).map(([key, value]) => {
            if (value === null || value === undefined) return null
            const icon = ATTRIBUTE_ICONS[key]
            const suffix = ATTRIBUTE_SUFFIXES[key] || ''
            const label = displaySchema?.[key]?.label || key

            return (
              <Badge key={key} variant="secondary" className="gap-1.5 py-1 px-2.5">
                {icon}
                <span>
                  {value}
                  {suffix}
                </span>
              </Badge>
            )
          })}

        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
            {hasAttributes ? 'Edit' : 'Add attributes'}
          </Button>
        )}
      </div>
    )
  }

  // Edit mode
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Edit Attributes</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {displaySchema ? (
          // Render fields based on schema
          Object.entries(displaySchema).map(([key, fieldSchema]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`attr-${key}`}>
                {fieldSchema.label}
                {!fieldSchema.optional && <span className="text-destructive"> *</span>}
              </Label>

              {fieldSchema.type === 'select' && fieldSchema.options ? (
                <Select
                  value={String(editedAttributes[key] || '')}
                  onValueChange={(value) => handleFieldChange(key, value)}
                >
                  <SelectTrigger id={`attr-${key}`}>
                    <SelectValue placeholder={`Select ${fieldSchema.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldSchema.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`attr-${key}`}
                  type={fieldSchema.type === 'number' ? 'number' : 'text'}
                  value={editedAttributes[key] ?? ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  min={fieldSchema.min}
                  max={fieldSchema.max}
                  step={fieldSchema.step}
                  placeholder={fieldSchema.label}
                />
              )}
            </div>
          ))
        ) : (
          // Fallback: render inputs for existing attributes or default fields
          <div className="space-y-2">
            <Label htmlFor="attr-abv">ABV %</Label>
            <Input
              id="attr-abv"
              type="number"
              value={editedAttributes.abv ?? ''}
              onChange={(e) => handleFieldChange('abv', e.target.value)}
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g., 5.5"
            />
          </div>
        )}
      </div>
    </div>
  )
}
