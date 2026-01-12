'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface MobileNavProps {
  user: { id: string } | null
  profile: { username: string; display_name: string | null; avatar_url: string | null; is_admin: boolean | null } | null
}

export function MobileNav({ user, profile }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">V</span>
              </div>
              <span>Voozea</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 mt-6">
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/businesses">Businesses</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/feed">Feed</Link>
          </Button>

          <Separator className="my-4" />

          {user ? (
            <>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/notifications">Notifications</Link>
              </Button>
              {profile && (
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href={`/profile/${profile.username}`}>Profile</Link>
                </Button>
              )}
              {profile?.is_admin && (
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Separator className="my-4" />
              <form action="/api/auth/signout" method="POST">
                <Button variant="ghost" className="justify-start w-full" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
