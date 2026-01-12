'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StepAvatar } from './step-avatar'
import { StepBio } from './step-bio'
import { StepFollowUsers } from './step-follow-users'
import { StepFirstRating } from './step-first-rating'
import { completeOnboarding, skipOnboarding } from '@/lib/actions/onboarding'
import type { SuggestedUser } from '@/lib/actions/suggestions'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SampleProduct {
  id: string
  name: string
  photo_url: string | null
  average_rating: number | null
  total_ratings: number | null
  businesses: {
    name: string
    slug: string
  } | null
}

interface OnboardingWizardProps {
  profile: Profile
  suggestedUsers: SuggestedUser[]
  sampleProducts: SampleProduct[]
}

export function OnboardingWizard({
  profile,
  suggestedUsers,
  sampleProducts,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [bio, setBio] = useState(profile.bio || '')
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set())

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const steps = [
    { id: 1, title: 'Profile Photo' },
    { id: 2, title: 'About You' },
    { id: 3, title: 'Find People' },
    { id: 4, title: 'First Rating' },
  ]

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      completeOnboarding()
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  async function handleSkip() {
    await skipOnboarding()
  }

  function handleFollowToggle(userId: string, isFollowing: boolean) {
    setFollowedUserIds((prev) => {
      const next = new Set(prev)
      if (isFollowing) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Welcome to Voozea</h1>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-6">
        <div className="max-w-2xl mx-auto">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {steps.map((s) => (
              <span
                key={s.id}
                className={step >= s.id ? 'text-foreground font-medium' : ''}
              >
                {s.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <StepAvatar
              currentUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
            />
          )}
          {step === 2 && (
            <StepBio
              bio={bio}
              displayName={displayName}
              onBioChange={setBio}
              onDisplayNameChange={setDisplayName}
            />
          )}
          {step === 3 && (
            <StepFollowUsers
              suggestedUsers={suggestedUsers}
              followedUserIds={followedUserIds}
              onFollowToggle={handleFollowToggle}
            />
          )}
          {step === 4 && (
            <StepFirstRating sampleProducts={sampleProducts} />
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button onClick={handleNext}>
            {step === totalSteps ? 'Finish' : 'Continue'}
          </Button>
        </div>
      </footer>
    </div>
  )
}
