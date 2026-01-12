'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadImage } from '@/lib/actions/upload'
import { updateOnboardingProfile } from '@/lib/actions/onboarding'

interface StepAvatarProps {
  currentUrl: string | null
  onAvatarChange: (url: string | null) => void
}

export function StepAvatar({ currentUrl, onAvatarChange }: StepAvatarProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadImage(formData)

      if (result.error) {
        toast.error(result.error)
        setPreview(currentUrl)
        return
      }

      if (result.url) {
        setPreview(result.url)
        onAvatarChange(result.url)

        // Save to profile
        const profileFormData = new FormData()
        profileFormData.set('avatar_url', result.url)
        await updateOnboardingProfile(profileFormData)
        toast.success('Photo uploaded!')
      }
    } catch {
      toast.error('Failed to upload photo')
      setPreview(currentUrl)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">Add a profile photo</h2>
      <p className="text-muted-foreground mb-8">
        Help others recognize you with a profile picture
      </p>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-muted bg-muted">
            {preview ? (
              <Image
                src={preview}
                alt="Profile preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-xs">
          <Label htmlFor="avatar" className="sr-only">
            Choose photo
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          You can skip this step and add a photo later
        </p>
      </div>
    </div>
  )
}
