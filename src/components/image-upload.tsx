'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadImage } from '@/lib/actions/upload'

interface ImageUploadProps {
  name: string
  label?: string
  currentUrl?: string | null
}

export function ImageUpload({
  name,
  label,
  currentUrl,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set('file', file)

      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
        setPreview(currentUrl || null)
        setUploadedUrl(currentUrl || '')
      } else if (result.url) {
        setPreview(result.url)
        setUploadedUrl(result.url)
      }
    } catch {
      setError('Failed to upload image')
      setPreview(currentUrl || null)
      setUploadedUrl(currentUrl || '')
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      {label && <Label htmlFor={name}>{label}</Label>}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={uploadedUrl}
        readOnly
      />

      {preview && (
        <div className="relative h-24 w-24 overflow-hidden rounded-full border">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-xs text-white">...</div>
            </div>
          )}
        </div>
      )}

      <Input
        id={name}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
