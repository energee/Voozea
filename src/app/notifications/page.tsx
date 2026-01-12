import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Store } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { markAllNotificationsRead } from '@/lib/actions/social'
import { SiteHeader } from '@/components/site-header'
import { formatRelativeTime } from '@/lib/utils'
import { getEntityInfo } from '@/lib/actions/entity-follow'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to view notifications')
  }

  // Get notifications with actor info (supports both old actor_id and new actor_entity_id)
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      rating_id,
      business_id,
      actor_id,
      actor_entity_id,
      read,
      created_at,
      actor:profiles!notifications_actor_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch entity info for notifications with actor_entity_id
  const entityActorInfo: Record<string, Awaited<ReturnType<typeof getEntityInfo>>> = {}
  if (notifications) {
    for (const notification of notifications) {
      if (notification.actor_entity_id && !notification.actor_id) {
        const info = await getEntityInfo(notification.actor_entity_id)
        if (info) {
          entityActorInfo[notification.actor_entity_id] = info
        }
      }
    }
  }

  // Get product info for rating-related notifications
  const ratingIds = notifications
    ?.map((n) => n.rating_id)
    .filter((id): id is string => id !== null) || []

  const ratingProducts: Record<string, { id: string; name: string }> = {}

  if (ratingIds.length > 0) {
    const { data: ratings } = await supabase
      .from('ratings')
      .select(`
        id,
        products!ratings_product_id_fkey (
          id,
          name
        )
      `)
      .in('id', ratingIds)

    ratings?.forEach((rating) => {
      const product = rating.products as unknown as { id: string; name: string } | null
      if (product && !Array.isArray(product)) {
        ratingProducts[rating.id] = product
      }
    })
  }

  // Get business info for claim-related notifications
  const businessIds = notifications
    ?.map((n) => n.business_id)
    .filter((id): id is string => id !== null) || []

  const businessInfo: Record<string, { name: string; slug: string }> = {}

  if (businessIds.length > 0) {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .in('id', businessIds)

    businesses?.forEach((business) => {
      businessInfo[business.id] = { name: business.name, slug: business.slug }
    })
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  function getNotificationText(type: string, actorName: string, productName?: string, businessName?: string) {
    switch (type) {
      case 'follow':
        return `${actorName} started following you`
      case 'like':
        return `${actorName} liked your rating${productName ? ` of ${productName}` : ''}`
      case 'comment':
        return `${actorName} commented on your rating${productName ? ` of ${productName}` : ''}`
      case 'claim_approved':
        return `Your claim for ${businessName || 'a business'} was approved!`
      case 'claim_rejected':
        return `Your claim for ${businessName || 'a business'} was rejected`
      case 'business_follow':
        return `${actorName} started following ${businessName || 'your business'}`
      case 'manager_invite':
        return `${actorName} invited you to manage ${businessName || 'a business'}`
      case 'manager_added':
        return `${actorName} accepted your invitation to manage ${businessName || 'your business'}`
      case 'manager_removed':
        return `You were removed as a manager of ${businessName || 'a business'}`
      case 'ownership_transfer':
        return `${actorName} transferred ownership of ${businessName || 'a business'} to you`
      default:
        return 'New notification'
    }
  }

  function getNotificationLink(
    type: string,
    actorUsername: string | undefined,
    actorEntityType: 'user' | 'business' | undefined,
    actorEntitySlug: string | undefined,
    productId?: string,
    businessSlug?: string
  ) {
    switch (type) {
      case 'follow':
        // For follow notifications, link to the follower (actor)
        if (actorEntityType === 'business' && actorEntitySlug) {
          return `/business/${actorEntitySlug}`
        }
        return actorUsername ? `/profile/${actorUsername}` : '#'
      case 'like':
      case 'comment':
        return productId ? `/product/${productId}` : '#'
      case 'claim_approved':
      case 'claim_rejected':
      case 'business_follow':
      case 'manager_added':
      case 'manager_removed':
      case 'ownership_transfer':
        return businessSlug ? `/business/${businessSlug}` : '#'
      case 'manager_invite':
        return businessSlug ? `/business/${businessSlug}/edit?tab=team` : '/notifications'
      default:
        return '#'
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>

          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <Button variant="outline" size="sm">
                Mark all as read
              </Button>
            </form>
          )}
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="border rounded-lg bg-card divide-y">
            {notifications.map((notification) => {
              // Get actor info - either from old actor_id or new actor_entity_id
              const oldActor = notification.actor as unknown as { username: string; display_name: string | null; avatar_url: string | null } | null
              const entityActor = notification.actor_entity_id ? entityActorInfo[notification.actor_entity_id] : null

              // Determine actor details
              let actorName: string
              let actorAvatarUrl: string | null
              let actorUsername: string | undefined
              let actorEntityType: 'user' | 'business' | undefined
              let actorEntitySlug: string | undefined

              if (entityActor) {
                // New entity-based actor
                actorName = entityActor.name
                actorAvatarUrl = entityActor.avatarUrl
                actorUsername = entityActor.username
                actorEntityType = entityActor.type
                actorEntitySlug = entityActor.slug
              } else if (oldActor) {
                // Old user-based actor
                actorName = oldActor.display_name || oldActor.username
                actorAvatarUrl = oldActor.avatar_url
                actorUsername = oldActor.username
                actorEntityType = 'user'
              } else {
                // No actor info available
                return null
              }

              const product = notification.rating_id ? ratingProducts[notification.rating_id] : null
              const business = notification.business_id ? businessInfo[notification.business_id] : null
              const link = getNotificationLink(
                notification.type,
                actorUsername,
                actorEntityType,
                actorEntitySlug,
                product?.id,
                business?.slug
              )

              return (
                <Link
                  key={notification.id}
                  href={link}
                  className={`flex items-center gap-3 py-3 px-4 hover:bg-accent/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={actorAvatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {actorEntityType === 'business' ? (
                        <Store className="h-3 w-3" />
                      ) : (
                        actorName.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <p className="flex-1 min-w-0 text-sm truncate">
                    {getNotificationText(notification.type, actorName, product?.name, business?.name)}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </main>
    </div>
  )
}
