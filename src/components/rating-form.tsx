'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createRating } from '@/lib/actions/rating'
import { uploadImage } from '@/lib/actions/upload'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface RatingFormProps {
  productId: string
  existingRating?: {
    score: number
    comment: string | null
    photoUrl: string | null
  }
}

export function RatingForm({ productId, existingRating }: RatingFormProps) {
  const [score, setScore] = useState(existingRating?.score ?? 5)
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingRating?.photoUrl ?? null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingRating?.photoUrl ?? null)
  const [isUploading, setIsUploading] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
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
        toast.error(result.error)
        setPhotoPreview(existingRating?.photoUrl ?? null)
        setPhotoUrl(existingRating?.photoUrl ?? null)
      } else if (result.url) {
        setPhotoUrl(result.url)
        setPhotoPreview(result.url)
      }
    } catch {
      toast.error('Failed to upload photo')
      setPhotoPreview(existingRating?.photoUrl ?? null)
      setPhotoUrl(existingRating?.photoUrl ?? null)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  function handleRemovePhoto() {
    setPhotoUrl(null)
    setPhotoPreview(null)
  }

  async function handleSubmit(formData: FormData) {
    formData.set('score', score.toString())
    if (photoUrl) {
      formData.set('photo_url', photoUrl)
    }
    const result = await createRating(formData)
    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(existingRating ? 'Rating updated!' : 'Rating submitted!')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Your Rating</Label>
          <span className="text-2xl font-bold">{score.toFixed(1)}</span>
        </div>
        <Slider
          value={[score]}
          onValueChange={(value) => setScore(value[0])}
          min={1}
          max={10}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="Share your thoughts..."
          rows={3}
          defaultValue={existingRating?.comment ?? ''}
        />
      </div>

      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        {photoPreview ? (
          <div className="relative w-full max-w-xs">
            <Image
              src={photoPreview}
              alt="Rating photo preview"
              width={300}
              height={200}
              className="rounded-lg object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        ) : (
          <Input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoChange}
            disabled={isUploading}
          />
        )}
      </div>

      <Button type="submit" disabled={isUploading}>
        {existingRating ? 'Update Rating' : 'Submit Rating'}
      </Button>
    </form>
  )
}
