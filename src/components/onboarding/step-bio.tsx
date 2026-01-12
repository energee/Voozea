'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateOnboardingProfile } from '@/lib/actions/onboarding'

interface StepBioProps {
  bio: string
  displayName: string
  onBioChange: (bio: string) => void
  onDisplayNameChange: (name: string) => void
}

export function StepBio({
  bio,
  displayName,
  onBioChange,
  onDisplayNameChange,
}: StepBioProps) {
  const [isSaving, setIsSaving] = useState(false)
  const maxBioLength = 160

  async function handleSave() {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.set('bio', bio)
      formData.set('display_name', displayName)
      const result = await updateOnboardingProfile(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated!')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
      <p className="text-muted-foreground mb-8">
        Add a display name and short bio so others can learn about you
      </p>

      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="How should we call you?"
          />
          <p className="text-xs text-muted-foreground">
            This is how your name appears on your profile and ratings
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">
              {bio.length}/{maxBioLength}
            </span>
          </div>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => onBioChange(e.target.value.slice(0, maxBioLength))}
            placeholder="Share a little about yourself..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="outline"
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You can always update these later in your profile settings
        </p>
      </div>
    </div>
  )
}
