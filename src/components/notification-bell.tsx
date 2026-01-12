import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export async function NotificationBell() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  // Get recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      read,
      created_at,
      actor:profiles!notifications_actor_id_fkey (
        username,
        display_name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  function getNotificationText(type: string, actorName: string) {
    switch (type) {
      case 'follow':
        return `${actorName} followed you`
      case 'like':
        return `${actorName} liked your rating`
      case 'comment':
        return `${actorName} commented`
      case 'claim_approved':
        return 'Your business claim was approved!'
      case 'claim_rejected':
        return 'Your business claim was rejected'
      default:
        return 'New notification'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <span>Notifications</span>
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {notifications && notifications.length > 0 ? (
          <>
            {notifications.map((notification) => {
              const actor = notification.actor as { username: string; display_name: string | null } | null
              if (!actor) return null

              const actorName = actor.display_name || actor.username

              return (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link
                    href="/notifications"
                    className={`flex items-center gap-2 ${!notification.read ? 'font-medium' : ''}`}
                  >
                    <span className="flex-1 truncate text-sm">
                      {getNotificationText(notification.type, actorName)}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Link>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-sm text-center text-primary">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>
            <span className="text-sm text-muted-foreground">No notifications</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
