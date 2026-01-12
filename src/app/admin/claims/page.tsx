import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClaimActions } from './claim-actions'

export default async function AdminClaimsPage() {
  const supabase = await createClient()

  const { data: claims } = await supabase
    .from('business_claims')
    .select(`
      id,
      reason,
      status,
      review_notes,
      created_at,
      user:profiles!business_claims_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      business:businesses!business_claims_business_id_fkey (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  const pendingClaims = claims?.filter(c => c.status === 'pending') || []
  const resolvedClaims = claims?.filter(c => c.status !== 'pending') || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Business Claims</h1>
        <p className="text-muted-foreground">Review and manage ownership claims</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Pending Claims ({pendingClaims.length})</h2>

        {pendingClaims.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending claims to review
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingClaims.map((claim) => {
              const user = claim.user as { id: string; username: string; display_name: string | null; avatar_url: string | null }
              const business = claim.business as { id: string; name: string; slug: string }

              return (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {business.name}
                        </CardTitle>
                        <CardDescription>
                          Claimed by @{user.username}
                          {user.display_name && ` (${user.display_name})`}
                        </CardDescription>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Reason for claim:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {claim.reason}
                      </p>
                    </div>

                    <ClaimActions claimId={claim.id} businessSlug={business.slug} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {resolvedClaims.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Resolved Claims ({resolvedClaims.length})</h2>

          <div className="space-y-4">
            {resolvedClaims.map((claim) => {
              const user = claim.user as { id: string; username: string; display_name: string | null }
              const business = claim.business as { id: string; name: string; slug: string }

              return (
                <Card key={claim.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {business.name}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            claim.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {claim.status}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          Claimed by @{user.username}
                        </CardDescription>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </CardHeader>
                  {claim.review_notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Note:</span> {claim.review_notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
