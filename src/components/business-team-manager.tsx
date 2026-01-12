'use client'

import { useState, useTransition } from 'react'
import { Loader2, UserPlus, Crown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { inviteManager, removeManager, transferOwnership, searchUsers } from '@/lib/actions/business-team'

interface TeamMember {
  id: string
  user_id: string
  role: 'owner' | 'manager'
  status: 'pending' | 'active' | 'removed'
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface BusinessTeamManagerProps {
  businessId: string
  businessSlug: string
  owner: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  members: TeamMember[]
  isOwner: boolean
}

export function BusinessTeamManager({
  businessId,
  businessSlug,
  owner,
  members,
  isOwner,
}: BusinessTeamManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)

  const activeMembers = members.filter((m) => m.status === 'active')
  const pendingMembers = members.filter((m) => m.status === 'pending')

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const result = await searchUsers(query)
    setSearchResults(result.users || [])
    setIsSearching(false)
  }

  async function handleInvite(userId: string, username: string) {
    const formData = new FormData()
    formData.set('business_id', businessId)
    formData.set('username', username)

    startTransition(async () => {
      const result = await inviteManager(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
        setDialogOpen(false)
        setSearchQuery('')
        setSearchResults([])
      }
    })
  }

  async function handleRemove(memberId: string) {
    const formData = new FormData()
    formData.set('member_id', memberId)

    startTransition(async () => {
      const result = await removeManager(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Manager removed')
      }
    })
  }

  async function handleTransferOwnership(newOwnerId: string) {
    const formData = new FormData()
    formData.set('business_id', businessId)
    formData.set('new_owner_id', newOwnerId)

    startTransition(async () => {
      const result = await transferOwnership(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Owner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Owner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={owner.avatar_url || undefined} />
              <AvatarFallback>
                {(owner.display_name || owner.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{owner.display_name || owner.username}</p>
              <p className="text-sm text-muted-foreground">@{owner.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Managers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Managers</CardTitle>
            <CardDescription>
              Managers can add and edit products and menus
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Manager
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Manager</DialogTitle>
                  <DialogDescription>
                    Search for a user by username to invite them as a manager
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search users</Label>
                    <Input
                      id="search"
                      placeholder="Enter username..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  {isSearching && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {(user.display_name || user.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {user.display_name || user.username}
                              </p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInvite(user.id, user.username)}
                            disabled={isPending}
                          >
                            Invite
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users found
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {pendingMembers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Pending Invitations</h4>
              <div className="space-y-2">
                {pendingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {(member.profile.display_name || member.profile.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.profile.display_name || member.profile.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMembers.length > 0 ? (
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {(member.profile.display_name || member.profile.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile.display_name || member.profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Crown className="h-4 w-4 mr-1" />
                            Transfer Ownership
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Transfer Ownership?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will make {member.profile.display_name || member.profile.username} the
                              new owner. You will become a manager. This action cannot be easily undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleTransferOwnership(member.user_id)}
                            >
                              Transfer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            pendingMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No managers yet. Invite team members to help manage this business.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
