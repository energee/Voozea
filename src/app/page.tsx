import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SiteHeader } from '@/components/site-header'
import { RatingDisplay } from '@/components/rating-display'
import { Beer, Store, Users, Star, ArrowRight, Sparkles } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch platform stats
  const [
    { count: businessCount },
    { count: productCount },
    { count: ratingCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  // Fetch recent ratings with user and product info
  const { data: recentRatings } = await supabase
    .from('ratings')
    .select(`
      id,
      score,
      comment,
      created_at,
      profiles!ratings_user_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      products!inner (
        id,
        name,
        photo_url,
        businesses!inner (
          name,
          slug
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch featured/top-rated businesses
  const { data: featuredBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, description, average_rating, total_ratings')
    .gt('total_ratings', 0)
    .order('average_rating', { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-chart-4/10 rounded-full blur-2xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Discover what others are loving
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Rate your{' '}
              <span className="text-primary">favorites</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Share your experiences with beers, food, and more from local spots.
              See what your friends are rating.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <>
                  <Button size="lg" className="text-lg px-8 py-6 gap-2" asChild>
                    <Link href="/feed">
                      View Your Feed
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                    <Link href="/businesses">Browse Businesses</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" className="text-lg px-8 py-6 gap-2" asChild>
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                <Store className="h-6 w-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold">{businessCount || 0}</div>
              <div className="text-muted-foreground">Businesses</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-3/10 text-chart-3 mb-3">
                <Beer className="h-6 w-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold">{productCount || 0}</div>
              <div className="text-muted-foreground">Products</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-4/10 text-chart-4 mb-3">
                <Star className="h-6 w-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold">{ratingCount || 0}</div>
              <div className="text-muted-foreground">Ratings</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-2/10 text-chart-2 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold">{userCount || 0}</div>
              <div className="text-muted-foreground">Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      {recentRatings && recentRatings.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">Recent Activity</h2>
                <p className="text-muted-foreground mt-1">See what the community is rating</p>
              </div>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/feed">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentRatings.map((rating) => {
                const profile = rating.profiles as { username: string; display_name: string | null; avatar_url: string | null } | null
                const product = rating.products as { id: string; name: string; photo_url: string | null; businesses: { name: string; slug: string } } | null
                if (!profile || !product) return null

                const displayName = profile.display_name || profile.username

                return (
                  <Card key={rating.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${profile.username}`}>
                          <Avatar className="h-10 w-10 ring-2 ring-background">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${profile.username}`}
                              className="font-medium hover:text-primary transition-colors truncate"
                            >
                              {displayName}
                            </Link>
                            <RatingDisplay score={rating.score} size="sm" />
                          </div>
                          <Link
                            href={`/product/${product.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors block truncate"
                          >
                            {product.name}
                          </Link>
                          <Link
                            href={`/business/${product.businesses.slug}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            at {product.businesses.name}
                          </Link>
                          {rating.comment && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              &ldquo;{rating.comment}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {formatRelativeTime(rating.created_at)}
                          </p>
                        </div>
                        {product.photo_url && (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={product.photo_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Businesses Section */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">Top Rated</h2>
                <p className="text-muted-foreground mt-1">Businesses loved by the community</p>
              </div>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/businesses">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredBusinesses.map((business) => (
                <Link key={business.id} href={`/business/${business.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {business.logo_url ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={business.logo_url}
                              alt={business.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{business.name}</h3>
                          {business.average_rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                              <span className="font-medium">{business.average_rating.toFixed(1)}</span>
                              <span className="text-muted-foreground">
                                ({business.total_ratings} {business.total_ratings === 1 ? 'rating' : 'ratings'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {business.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start rating?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join the community and share your favorite beers, dishes, and discoveries with friends.
              </p>
              <Button size="lg" className="text-lg px-8 py-6 gap-2" asChild>
                <Link href="/register">
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Voozea - Social Rating Platform
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/businesses" className="hover:text-foreground transition-colors">
              Businesses
            </Link>
            <Link href="/feed" className="hover:text-foreground transition-colors">
              Feed
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
