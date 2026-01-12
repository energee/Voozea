'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RatingDisplay } from '@/components/rating-display'

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

interface StepFirstRatingProps {
  sampleProducts: SampleProduct[]
}

export function StepFirstRating({ sampleProducts }: StepFirstRatingProps) {
  if (sampleProducts.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Make your first rating</h2>
        <p className="text-muted-foreground mb-8">
          No products available to rate right now. Browse businesses to find something to rate!
        </p>
        <Button asChild>
          <Link href="/businesses">
            Browse Businesses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">Make your first rating</h2>
      <p className="text-muted-foreground mb-8">
        Pick a product you know and share your rating
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        {sampleProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {product.photo_url ? (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={product.photo_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Star className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    {product.businesses && (
                      <p className="text-sm text-muted-foreground truncate">
                        {product.businesses.name}
                      </p>
                    )}
                    <div className="mt-1">
                      {product.average_rating && product.average_rating > 0 ? (
                        <RatingDisplay score={product.average_rating} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No ratings yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          Don&apos;t see what you&apos;re looking for?
        </p>
        <Button variant="outline" asChild>
          <Link href="/businesses">
            Browse all businesses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
