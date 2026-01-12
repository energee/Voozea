import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateBusiness } from '@/lib/actions/business'
import { getBusinessRole } from '@/lib/actions/business-team'
import { getEntityFollowing } from '@/lib/actions/entity-follow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/image-upload'
import { BusinessTeamManager } from '@/components/business-team-manager'
import { BusinessFollowingManager } from '@/components/business-following-manager'

interface BusinessHours {
  [day: string]: { open: string; close: string } | null
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

export default async function EditBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string; tab?: string }>
}) {
  const { slug } = await params
  const { error, tab = 'details' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to edit a business')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!business) {
    notFound()
  }

  // Check role - owners can access all tabs, managers only products
  const role = await getBusinessRole(business.id, user.id)

  if (!role) {
    redirect(`/business/${slug}?error=You do not have permission to edit this business`)
  }

  const isOwner = role === 'owner'

  // Managers can only access products tab
  if (!isOwner && tab !== 'products') {
    redirect(`/business/${slug}/edit?tab=products`)
  }

  // Get team members for owners
  let teamMembers: Array<{
    id: string
    user_id: string
    role: 'owner' | 'manager'
    status: 'pending' | 'active' | 'removed'
    profile: {
      username: string
      display_name: string | null
      avatar_url: string | null
    }
  }> = []
  let ownerProfile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null = null

  if (isOwner && business.owner_id) {
    const { data: members } = await supabase
      .from('business_members')
      .select(`
        id,
        user_id,
        role,
        status,
        profiles!business_members_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('business_id', business.id)
      .in('status', ['active', 'pending'])

    if (members) {
      teamMembers = members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role as 'owner' | 'manager',
        status: m.status as 'pending' | 'active' | 'removed',
        profile: m.profiles as unknown as {
          username: string
          display_name: string | null
          avatar_url: string | null
        },
      }))
    }

    const { data: owner } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', business.owner_id)
      .single()

    ownerProfile = owner
  }

  // Get products for products tab
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, photo_url, average_rating, total_ratings')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  // Get who the business follows for following tab
  const businessFollowing = await getEntityFollowing(business.id)

  const hours = business.hours as BusinessHours | null

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Voozea
          </Link>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/business/${slug}`}>Back to Business</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage {business.name}</h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
            {error}
          </p>
        )}

        <Tabs defaultValue={tab} className="space-y-6">
          <TabsList>
            {isOwner && (
              <>
                <TabsTrigger value="details" asChild>
                  <Link href={`/business/${slug}/edit?tab=details`}>Details</Link>
                </TabsTrigger>
                <TabsTrigger value="team" asChild>
                  <Link href={`/business/${slug}/edit?tab=team`}>Team</Link>
                </TabsTrigger>
                <TabsTrigger value="following" asChild>
                  <Link href={`/business/${slug}/edit?tab=following`}>Following</Link>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="products" asChild>
              <Link href={`/business/${slug}/edit?tab=products`}>Products</Link>
            </TabsTrigger>
          </TabsList>

          {isOwner && (
            <>
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>
                      Update your business information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={updateBusiness} className="space-y-6">
                      <input type="hidden" name="business_id" value={business.id} />

                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Basic Information</h3>

                        <div className="space-y-2">
                          <Label htmlFor="name">Business Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            defaultValue={business.name}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="slug">Business Username</Label>
                          <Input
                            id="slug"
                            name="slug"
                            defaultValue={business.slug}
                            required
                            minLength={3}
                            maxLength={60}
                            pattern="[a-z0-9-]+"
                            placeholder="my-business-name"
                          />
                          <p className="text-xs text-muted-foreground">
                            Lowercase letters, numbers, and hyphens only. This is your business URL: /business/{business.slug}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Tell us about this business..."
                            rows={3}
                            defaultValue={business.description || ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            defaultValue={business.phone || ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            type="url"
                            placeholder="https://"
                            defaultValue={business.website || ''}
                          />
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Social Links</h3>

                        <div className="space-y-2">
                          <Label htmlFor="instagram_url">Instagram</Label>
                          <Input
                            id="instagram_url"
                            name="instagram_url"
                            type="url"
                            placeholder="https://instagram.com/yourbusiness"
                            defaultValue={business.instagram_url || ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="facebook_url">Facebook</Label>
                          <Input
                            id="facebook_url"
                            name="facebook_url"
                            type="url"
                            placeholder="https://facebook.com/yourbusiness"
                            defaultValue={business.facebook_url || ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter_url">X (Twitter)</Label>
                          <Input
                            id="twitter_url"
                            name="twitter_url"
                            type="url"
                            placeholder="https://x.com/yourbusiness"
                            defaultValue={business.twitter_url || ''}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Address</h3>

                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            name="address"
                            placeholder="123 Main St"
                            defaultValue={business.address || ''}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={business.city || ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              name="state"
                              defaultValue={business.state || ''}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="postal_code">Postal Code</Label>
                            <Input
                              id="postal_code"
                              name="postal_code"
                              defaultValue={business.postal_code || ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              name="country"
                              defaultValue={business.country || ''}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Images */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Images</h3>

                        <ImageUpload
                          name="logo_url"
                          label="Logo"
                          currentUrl={business.logo_url}
                        />

                        <ImageUpload
                          name="cover_url"
                          label="Cover Image"
                          currentUrl={business.cover_url}
                        />
                      </div>

                      {/* Business Hours */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Business Hours</h3>
                        <p className="text-sm text-muted-foreground">Leave blank if closed on that day</p>

                        <div className="space-y-3">
                          {DAYS.map(({ key, label }) => (
                            <div key={key} className="grid grid-cols-[100px_1fr_1fr] gap-2 items-center">
                              <Label className="text-sm">{label}</Label>
                              <Input
                                name={`hours_${key}_open`}
                                type="time"
                                className="text-sm"
                                defaultValue={hours?.[key]?.open || ''}
                              />
                              <Input
                                name={`hours_${key}_close`}
                                type="time"
                                className="text-sm"
                                defaultValue={hours?.[key]?.close || ''}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button type="submit">Save Changes</Button>
                        <Button variant="outline" asChild>
                          <Link href={`/business/${slug}`}>Cancel</Link>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team">
                {ownerProfile && (
                  <BusinessTeamManager
                    businessId={business.id}
                    businessSlug={business.slug}
                    owner={ownerProfile}
                    members={teamMembers}
                    isOwner={isOwner}
                  />
                )}
              </TabsContent>

              <TabsContent value="following">
                <BusinessFollowingManager
                  businessId={business.id}
                  businessName={business.name}
                  following={businessFollowing}
                />
              </TabsContent>
            </>
          )}

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage products for this business
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/business/${slug}/add-product`}>Add Product</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          {product.photo_url ? (
                            <img
                              src={product.photo_url}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.average_rating
                                ? `${product.average_rating.toFixed(1)} avg (${product.total_ratings} ratings)`
                                : 'No ratings yet'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/product/${product.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No products yet. Add your first product to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
