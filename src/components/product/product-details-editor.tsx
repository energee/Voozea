'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateProduct } from '@/lib/actions/product'
import { uploadImage } from '@/lib/actions/upload'

interface ProductDetailsEditorProps {
  productId: string
  name: string
  description: string | null
  photoUrl: string | null
  isOwner: boolean
}

export function ProductDetailsEditor({
  productId,
  name,
  description,
  photoUrl,
  isOwner,
}: ProductDetailsEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(name)
  const [editedDescription, setEditedDescription] = useState(description || '')
  const [editedPhotoUrl, setEditedPhotoUrl] = useState(photoUrl || '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(photoUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
        setPhotoPreview(photoUrl)
        setEditedPhotoUrl(photoUrl || '')
      } else if (result.url) {
        setPhotoPreview(result.url)
        setEditedPhotoUrl(result.url)
      }
    } catch {
      setError('Failed to upload image')
      setPhotoPreview(photoUrl)
      setEditedPhotoUrl(photoUrl || '')
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateProduct(productId, {
        name: editedName,
        description: editedDescription || null,
        photo_url: editedPhotoUrl || null,
      })
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  const handleCancel = () => {
    setEditedName(name)
    setEditedDescription(description || '')
    setEditedPhotoUrl(photoUrl || '')
    setPhotoPreview(photoUrl)
    setError(null)
    setIsEditing(false)
  }

  // Display mode - use edited values so updates show immediately
  const displayName = editedName
  const displayDescription = editedDescription
  const displayPhotoUrl = editedPhotoUrl || null

  if (!isEditing) {
    return (
      <div className="group">
        <div className="flex items-start gap-4">
          {displayPhotoUrl && (
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={displayPhotoUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {displayDescription && (
              <p className="mt-2 text-muted-foreground">{displayDescription}</p>
            )}
            {isOwner && !displayDescription && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-sm text-muted-foreground hover:text-foreground"
              >
                + Add description
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Edit Product Details</h3>
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product-name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Product name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Textarea
            id="product-description"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Product description (optional)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-photo">Photo</Label>
          {photoPreview && (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
              <Image
                src={photoPreview}
                alt="Product photo"
                fill
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
          )}
          <Input
            id="product-photo"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoChange}
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  )
}
