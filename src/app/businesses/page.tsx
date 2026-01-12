import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Plus, Store, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SiteHeader } from '@/components/site-header'
import { RatingBadge } from '@/components/rating-display'

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: businesses } = await query

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Businesses</h1>
          <Button asChild className="gap-2">
            <Link href="/businesses/new">
              <Plus className="h-4 w-4" />
              Add Business
            </Link>
          </Button>
        </div>

        <form className="mb-8">
          <div className="flex gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search businesses..."
                defaultValue={q}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>

        {businesses && businesses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <Link key={business.id} href={`/business/${business.slug}`}>
                <Card className="h-full hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-6 h-full flex flex-col">
                    <div className="flex gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {business.logo_url ? (
                          <Image
                            src={business.logo_url}
                            alt={business.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{business.name}</h3>
                        <p className="text-sm text-muted-foreground h-5">
                          {business.city ? (
                            <>{business.city}{business.state && `, ${business.state}`}</>
                          ) : (
                            <span className="text-muted-foreground/50">No location</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-3 h-10">
                      {business.description || <span className="text-muted-foreground/50">No description</span>}
                    </p>
                    <div className="mt-auto pt-3">
                      {business.average_rating != null && business.average_rating > 0 ? (
                        <RatingBadge
                          score={business.average_rating}
                          totalRatings={business.total_ratings ?? undefined}
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                              <Star className="h-3 w-3" />
                              No ratings yet
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Be the first to rate</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {q ? `No businesses found for "${q}"` : 'No businesses yet'}
            </p>
            <Button asChild className="gap-2">
              <Link href="/businesses/new">
                <Plus className="h-4 w-4" />
                Add the first one
              </Link>
            </Button>
          </div>
        )}
      </main>
      </div>
    </TooltipProvider>
  )
}
