import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { User, Rss, Shield, LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileNav } from '@/components/mobile-nav'
import { GlobalSearch } from '@/components/global-search'

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
    case 'business_follow':
      return `${actorName} followed your business`
    case 'manager_invite':
      return `${actorName} invited you to manage a business`
    case 'manager_added':
      return `${actorName} accepted your invite`
    case 'manager_removed':
      return 'You were removed as a manager'
    case 'ownership_transfer':
      return `${actorName} transferred ownership to you`
    default:
      return 'New notification'
  }
}

export async function SiteHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { username: string; display_name: string | null; avatar_url: string | null; is_admin: boolean | null } | null = null
  let notifications: Array<{
    id: string
    type: string
    read: boolean | null
    created_at: string | null
    actor: { username: string; display_name: string | null } | null
  }> = []
  let unreadCount = 0

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, is_admin')
      .eq('id', user.id)
      .single()
    profile = data

    // Fetch unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0

    // Fetch recent notifications
    const { data: notifData } = await supabase
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

    if (notifData) {
      notifications = notifData.map((n) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        created_at: n.created_at,
        actor: n.actor as { username: string; display_name: string | null } | null,
      }))
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">Voozea</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/businesses">Businesses</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {profile && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <span>{profile.display_name || profile.username}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${profile.username}`} className="gap-2">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/feed" className="gap-2">
                          <Rss className="h-4 w-4" />
                          Feed
                        </Link>
                      </DropdownMenuItem>
                      {profile.is_admin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                        )}
                      </DropdownMenuLabel>
                      {notifications.length > 0 ? (
                        <>
                          {notifications.map((notification) => {
                            const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone'
                            return (
                              <DropdownMenuItem key={notification.id} asChild>
                                <Link
                                  href="/notifications"
                                  className="flex items-center gap-2"
                                >
                                  <span className={`flex-1 truncate text-sm ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
                                    {getNotificationText(notification.type, actorName)}
                                  </span>
                                  {!notification.read && (
                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                  )}
                                </Link>
                              </DropdownMenuItem>
                            )
                          })}
                        </>
                      ) : (
                        <DropdownMenuItem disabled>
                          <span className="text-sm text-muted-foreground">No notifications</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/notifications" className="gap-2">
                          <Bell className="h-4 w-4" />
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <form action={signOut} className="w-full">
                          <button type="submit" className="w-full text-left flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <MobileNav user={user} profile={profile} />
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
              <MobileNav user={null} profile={null} />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
