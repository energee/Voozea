'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveClaim, rejectClaim } from '@/lib/actions/admin'

interface ClaimActionsProps {
  claimId: string
  businessSlug: string
}

export function ClaimActions({ claimId, businessSlug }: ClaimActionsProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleApprove = async () => {
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.set('claim_id', claimId)

    const result = await approveClaim(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Claim approved!' })
    }

    setIsLoading(false)
  }

  const handleReject = async () => {
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.set('claim_id', claimId)
    formData.set('reason', rejectReason)

    const result = await rejectClaim(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Claim rejected' })
      setIsRejecting(false)
    }

    setIsLoading(false)
  }

  if (message?.type === 'success') {
    return (
      <p className="text-sm text-green-600">{message.text}</p>
    )
  }

  return (
    <div className="space-y-3">
      {message?.type === 'error' && (
        <p className="text-sm text-red-600">{message.text}</p>
      )}

      {isRejecting ? (
        <div className="space-y-3">
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejecting(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRejecting(true)}
            disabled={isLoading}
          >
            Reject
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/business/${businessSlug}`} target="_blank">
              View Business
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
