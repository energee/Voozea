import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Star, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RatingForm } from '@/components/rating-form'
import { LikeButton } from '@/components/like-button'
import { CommentSection } from '@/components/comment-section'
import { SiteHeader } from '@/components/site-header'
import { RatingDisplay } from '@/components/rating-display'
import { AttributeEditor } from '@/components/product/attribute-editor'
import { ProductDetailsEditor } from '@/components/product/product-details-editor'
import type { CategoryAttributeSchema, ProductAttributes } from '@/types/attributes'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { formatRelativeTime } from '@/lib/utils'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      business:businesses(id, name, slug, owner_id),
      category:categories(id, name, slug, attribute_schema)
    `)
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  // Check if current user owns the business
  const isOwner = user?.id === product.business?.owner_id

  // Get user's existing rating if logged in
  let userRating: { score: number; comment: string | null; photoUrl: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('ratings')
      .select(`
        score,
        comment,
        rating_photos (url)
      `)
      .eq('product_id', id)
      .eq('user_id', user.id)
      .single()
    if (data) {
      const photos = data.rating_photos as { url: string }[] | null
      userRating = {
        score: data.score,
        comment: data.comment,
        photoUrl: photos && photos.length > 0 ? photos[0].url : null,
      }
    }
  }

  // Get recent ratings with profile info
  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      id,
      score,
      comment,
      like_count,
      comment_count,
      created_at,
      user_id,
      profiles!ratings_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      rating_photos (
        url
      )
    `)
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get user's likes on these ratings
  let userLikes: Set<string> = new Set()
  if (user && ratings && ratings.length > 0) {
    const ratingIds = ratings.map((r) => r.id)
    const { data: likes } = await supabase
      .from('rating_likes')
      .select('rating_id')
      .eq('user_id', user.id)
      .in('rating_id', ratingIds)

    userLikes = new Set(likes?.map((l) => l.rating_id) || [])
  }

  // Get comments for each rating
  const ratingComments: Record<string, Array<{
    id: string
    content: string
    created_at: string | null
    user: { id: string; username: string; display_name: string | null; avatar_url: string | null }
  }>> = {}

  if (ratings && ratings.length > 0) {
    const ratingIds = ratings.map((r) => r.id)
    const { data: comments } = await supabase
      .from('rating_comments')
      .select(`
        id,
        content,
        created_at,
        rating_id,
        profiles!rating_comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .in('rating_id', ratingIds)
      .order('created_at', { ascending: true })

    comments?.forEach((comment) => {
      const profile = comment.profiles as unknown as { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
      if (!profile) return

      if (!ratingComments[comment.rating_id]) {
        ratingComments[comment.rating_id] = []
      }
      ratingComments[comment.rating_id].push({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      })
    })
  }

  const attributes = product.attributes as ProductAttributes | null
  const categorySchema = product.category?.attribute_schema as CategoryAttributeSchema | null

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-3">
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
              <BreadcrumbLink asChild>
                <Link href={`/business/${product.business.slug}`}>{product.business.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-start mb-6">
              <ProductDetailsEditor
                productId={id}
                name={product.name}
                description={product.description}
                photoUrl={product.photo_url}
                isOwner={isOwner}
              />
              {product.average_rating != null && product.average_rating > 0 ? (
                <RatingDisplay
                  score={product.average_rating}
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

            <div className="mb-6">
              <AttributeEditor
                productId={id}
                attributes={attributes}
                schema={categorySchema}
                isOwner={isOwner}
              />
            </div>

            <h2 className="text-xl font-semibold mb-4">Ratings & Reviews</h2>
            {ratings && ratings.length > 0 ? (
              <div className="space-y-6">
                {ratings.map((rating) => {
                  const profile = rating.profiles as unknown as { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
                  const displayName = profile?.display_name || profile?.username || 'Anonymous'
                  const comments = ratingComments[rating.id] || []
                  const photos = rating.rating_photos as { url: string }[] | null
                  const photoUrl = photos && photos.length > 0 ? photos[0].url : null

                  return (
                    <Card key={rating.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {profile ? (
                              <Link href={`/profile/${profile.username}`}>
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={profile.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {displayName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>?</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              {profile ? (
                                <Link
                                  href={`/profile/${profile.username}`}
                                  className="font-medium hover:underline"
                                >
                                  {displayName}
                                </Link>
                              ) : (
                                <span className="font-medium">{displayName}</span>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(rating.created_at)}
                              </p>
                            </div>
                          </div>
                          <RatingDisplay score={rating.score} size="sm" />
                        </div>

                        {rating.comment && (
                          <p className="mb-3">{rating.comment}</p>
                        )}

                        {photoUrl && (
                          <div className="mb-3">
                            <Image
                              src={photoUrl}
                              alt="Rating photo"
                              width={400}
                              height={300}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {user ? (
                            <LikeButton
                              ratingId={rating.id}
                              likeCount={rating.like_count ?? 0}
                              isLiked={userLikes.has(rating.id)}
                            />
                          ) : (
                            <span>{rating.like_count ?? 0} likes</span>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <CommentSection
                            ratingId={rating.id}
                            comments={comments}
                            currentUserId={user?.id}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-card">
                <Star className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No ratings yet. Be the first!</p>
              </div>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {userRating ? 'Your Rating' : 'Rate this Product'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <RatingForm
                    productId={id}
                    existingRating={userRating ?? undefined}
                  />
                ) : (
                  <div className="text-center py-6">
                    <LogIn className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Sign in to rate this product
                    </p>
                    <Button asChild className="gap-2">
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
