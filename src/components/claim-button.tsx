'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { claimBusiness, cancelClaim } from '@/lib/actions/business'

interface ClaimButtonProps {
  businessId: string
  existingClaim?: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    review_notes?: string | null
  } | null
}

export function ClaimButton({ businessId, existingClaim }: ClaimButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('business_id', businessId)
    formData.set('reason', reason)

    const result = await claimBusiness(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Claim submitted successfully')
      setShowForm(false)
    }

    setIsPending(false)
  }

  async function handleCancel() {
    if (!existingClaim) return

    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('claim_id', existingClaim.id)

    const result = await cancelClaim(formData)

    if (result?.error) {
      setError(result.error)
    }

    setIsPending(false)
  }

  // Show success message after submitting
  if (success) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">{success}</p>
      </div>
    )
  }

  // Show pending state if user has a pending claim
  if (existingClaim?.status === 'pending') {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 font-medium">Claim pending review</p>
          <p className="text-xs text-yellow-600 mt-1">
            Your claim is being reviewed. You&apos;ll be notified when it&apos;s approved or rejected.
          </p>
        </div>
        <Button
          onClick={handleCancel}
          disabled={isPending}
          variant="outline"
          size="sm"
        >
          {isPending ? 'Cancelling...' : 'Cancel Claim'}
        </Button>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  // Show rejected state with option to try again
  if (existingClaim?.status === 'rejected') {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Claim rejected</p>
          {existingClaim.review_notes && (
            <p className="text-xs text-red-600 mt-1">
              Reason: {existingClaim.review_notes}
            </p>
          )}
        </div>
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          size="sm"
        >
          Submit New Claim
        </Button>
      </div>
    )
  }

  // Show claim form
  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="claim-reason">Why are you claiming this business?</Label>
          <Textarea
            id="claim-reason"
            placeholder="Please explain why you own or manage this business. Include any details that help verify your ownership (e.g., your role, how long you've owned it)."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 10 characters required
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isPending || reason.trim().length < 10}
            size="sm"
          >
            {isPending ? 'Submitting...' : 'Submit Claim'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowForm(false)
              setError(null)
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  // Default: show claim button
  return (
    <div className="space-y-2">
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        size="sm"
      >
        Claim this business
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
