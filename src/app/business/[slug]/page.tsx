import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Plus,
  Pencil,
  ListOrdered,
  Store,
  BadgeCheck,
  ShieldCheck,
  Star,
  Users,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClaimButton } from '@/components/claim-button'
import { SiteHeader } from '@/components/site-header'
import { RatingDisplay, RatingBadge } from '@/components/rating-display'
import { FollowAsSelector } from '@/components/follow-as-selector'
import { getBusinessRole } from '@/lib/actions/business-team'
import { getActableEntities, isFollowing as checkIsFollowing } from '@/lib/actions/entity-follow'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BusinessHours {
  [day: string]: { open: string; close: string } | null
}

function formatHours(hours: BusinessHours | null) {
  if (!hours) return null
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  }
  return days.map((day) => {
    const dayHours = hours[day]
    return {
      day: dayLabels[day],
      hours: dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Closed',
    }
  })
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('slug', slug)
    .single()

  if (!business) {
    notFound()
  }

  // Get current user for claim functionality
  const { data: { user } } = await supabase.auth.getUser()

  // Check if current user is the owner or manager
  const isOwner = user && business.owner_id === user.id
  let userRole: 'owner' | 'manager' | null = null
  if (user) {
    userRole = await getBusinessRole(business.id, user.id)
  }
  const canManage = userRole !== null

  // Get entities the user can act as (themselves + businesses they manage)
  let actableEntities: Awaited<ReturnType<typeof getActableEntities>> = []
  let followingEntityIds: string[] = []

  if (user) {
    const allEntities = await getActableEntities(user.id)
    // Filter out the current business (can't follow yourself)
    actableEntities = allEntities.filter((e) => e.id !== business.id)

    // Check which entities are following this business
    for (const entity of actableEntities) {
      const following = await checkIsFollowing(entity.id, business.id)
      if (following) {
        followingEntityIds.push(entity.id)
      }
    }
  }

  // Get user's existing claim if they're not already the owner and business isn't claimed
  let userClaim: { id: string; status: 'pending' | 'approved' | 'rejected'; review_notes: string | null } | null = null
  if (user && !isOwner && !business.is_claimed) {
    const { data: claim } = await supabase
      .from('business_claims')
      .select('id, status, review_notes')
      .eq('business_id', business.id)
      .eq('user_id', user.id)
      .single()
    if (claim) {
      userClaim = claim as { id: string; status: 'pending' | 'approved' | 'rejected'; review_notes: string | null }
    }
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const formattedHours = formatHours(business.hours as BusinessHours | null)

  const fullAddress = [
    business.address,
    business.city,
    business.state,
    business.postal_code,
    business.country,
  ].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/businesses">Businesses</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{business.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Cover Image */}
      {business.cover_url && (
        <div className="relative h-48 md:h-64 w-full bg-muted">
          <Image
            src={business.cover_url}
            alt={`${business.name} cover`}
            fill
            className="object-cover"
          />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4 items-start">
              {/* Logo */}
              {business.logo_url && (
                <div className={`relative h-20 w-20 rounded-lg overflow-hidden border-2 bg-background shrink-0 ${business.cover_url ? '-mt-10' : ''}`}>
                  <Image
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold">{business.name}</h1>
                  {business.is_verified && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  {business.is_claimed && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Claimed
                    </Badge>
                  )}
                </div>
                {business.category && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {(business.category as { name: string }).name}
                  </p>
                )}
              </div>
            </div>
            {business.average_rating != null && business.average_rating > 0 ? (
              <RatingDisplay
                score={business.average_rating}
                size="lg"
                showLabel
              />
            ) : (
              <Badge variant="outline" className="gap-1 h-fit">
                <Star className="h-3 w-3" />
                No ratings
              </Badge>
            )}
          </div>

          {business.description && (
            <p className="mt-3 text-muted-foreground">{business.description}</p>
          )}

          {/* Follow Button and Follower Count */}
          <div className="mt-3 flex items-center gap-4">
            {user && actableEntities.length > 0 && (
              <FollowAsSelector
                targetEntityId={business.id}
                targetName={business.name}
                actableEntities={actableEntities}
                followingEntityIds={followingEntityIds}
              />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{business.follower_count || 0} {(business.follower_count || 0) === 1 ? 'follower' : 'followers'}</span>
              {(business.following_count || 0) > 0 && (
                <span className="text-muted-foreground/60">
                  &bull; Following {business.following_count}
                </span>
              )}
            </div>
          </div>

          {/* Owner/Manager Actions */}
          {canManage && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {isOwner ? 'You own this business' : 'You manage this business'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button asChild size="sm" className="gap-2">
                  <Link href={`/business/${slug}/edit${isOwner ? '' : '?tab=products'}`}>
                    <Pencil className="h-3.5 w-3.5" />
                    {isOwner ? 'Edit Business' : 'Manage Products'}
                  </Link>
                </Button>
                {isOwner && (
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={`/business/${slug}/menus`}>
                      <ListOrdered className="h-3.5 w-3.5" />
                      Manage Menus
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Claim Business */}
          {user && !business.is_claimed && !isOwner && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1.5">
                Is this your business? Claim it to manage your listing.
              </p>
              <ClaimButton businessId={business.id} existingClaim={userClaim} />
            </div>
          )}

          {/* Contact & Location Info */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Address & Contact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Contact & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {fullAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{fullAddress}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {(business.instagram_url || business.facebook_url || business.twitter_url) && (
                  <div className="flex items-center gap-2.5 pt-2 border-t">
                    {business.instagram_url && (
                      <a
                        href={business.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {business.facebook_url && (
                      <a
                        href={business.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {business.twitter_url && (
                      <a
                        href={business.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="X (Twitter)"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Hours */}
            {formattedHours && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {formattedHours.map(({ day, hours }) => (
                      <div key={day} className="contents">
                        <span className="text-muted-foreground">{day}</span>
                        <span className={hours === 'Closed' ? 'text-muted-foreground' : ''}>{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Products</h2>
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/business/${slug}/add-product`}>
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {products && products.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {product.photo_url && (
                        <div className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={product.photo_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          {product.average_rating != null && product.average_rating > 0 ? (
                            <RatingBadge score={product.average_rating} />
                          ) : (
                            <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <Star className="h-3 w-3" />
                              No ratings
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-card">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-3">No products yet</p>
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/business/${slug}/add-product`}>
                <Plus className="h-4 w-4" />
                Add the first product
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
