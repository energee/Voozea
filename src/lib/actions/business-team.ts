'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type BusinessRole = 'owner' | 'manager' | null

// Helper function to check if user is owner or manager
export async function getBusinessRole(businessId: string, userId: string): Promise<BusinessRole> {
  const supabase = await createClient()

  // Check if user is the owner
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single()

  if (business?.owner_id === userId) {
    return 'owner'
  }

  // Check if user is an active manager
  const { data: member } = await supabase
    .from('business_members')
    .select('role, status')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return member?.role || null
}

export async function inviteManager(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to invite managers')
  }

  const businessId = formData.get('business_id') as string
  const username = formData.get('username') as string

  if (!businessId || !username) {
    return { error: 'Missing required fields' }
  }

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', businessId)
    .single()

  if (!business || business.owner_id !== user.id) {
    return { error: 'Only business owners can invite managers' }
  }

  // Find user by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single()

  if (!profile) {
    return { error: 'User not found. They must have a Voozea account.' }
  }

  if (profile.id === user.id) {
    return { error: 'You cannot invite yourself' }
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('business_members')
    .select('id, status')
    .eq('business_id', businessId)
    .eq('user_id', profile.id)
    .single()

  if (existingMember) {
    if (existingMember.status === 'active') {
      return { error: 'This user is already a team member' }
    }
    if (existingMember.status === 'pending') {
      return { error: 'This user already has a pending invitation' }
    }
    // If removed, update to pending
    const { error } = await supabase
      .from('business_members')
      .update({ status: 'pending', invited_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', existingMember.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new invitation
    const { error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: profile.id,
        role: 'manager',
        invited_by: user.id,
        status: 'pending',
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/business/${business.slug}/edit`)
  return { success: true, message: `Invitation sent to ${profile.username}` }
}

export async function removeManager(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to remove managers')
  }

  const memberId = formData.get('member_id') as string

  if (!memberId) {
    return { error: 'Missing member ID' }
  }

  // Get member and verify ownership
  const { data: member } = await supabase
    .from('business_members')
    .select(`
      id,
      business_id,
      user_id,
      businesses!business_members_business_id_fkey (slug, owner_id)
    `)
    .eq('id', memberId)
    .single()

  if (!member) {
    return { error: 'Member not found' }
  }

  const business = member.businesses as { slug: string; owner_id: string }

  if (business.owner_id !== user.id) {
    return { error: 'Only business owners can remove managers' }
  }

  const { error } = await supabase
    .from('business_members')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

  // Create notification for removed manager
  await supabase
    .from('notifications')
    .insert({
      user_id: member.user_id,
      type: 'manager_removed',
      actor_id: user.id,
      business_id: member.business_id,
    })

  revalidatePath(`/business/${business.slug}/edit`)
  return { success: true }
}

export async function acceptInvitation(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to accept invitations')
  }

  const memberId = formData.get('member_id') as string

  if (!memberId) {
    return { error: 'Missing member ID' }
  }

  const { data: member, error } = await supabase
    .from('business_members')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select('business_id, invited_by')
    .single()

  if (error || !member) {
    return { error: 'Invitation not found or already processed' }
  }

  // Notify the inviter
  if (member.invited_by) {
    await supabase
      .from('notifications')
      .insert({
        user_id: member.invited_by,
        type: 'manager_added',
        actor_id: user.id,
        business_id: member.business_id,
      })
  }

  revalidatePath('/notifications')
  return { success: true }
}

export async function declineInvitation(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to decline invitations')
  }

  const memberId = formData.get('member_id') as string

  if (!memberId) {
    return { error: 'Missing member ID' }
  }

  const { error } = await supabase
    .from('business_members')
    .delete()
    .eq('id', memberId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) {
    return { error: 'Failed to decline invitation' }
  }

  revalidatePath('/notifications')
  return { success: true }
}

export async function transferOwnership(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?error=You must be logged in to transfer ownership')
  }

  const businessId = formData.get('business_id') as string
  const newOwnerId = formData.get('new_owner_id') as string

  if (!businessId || !newOwnerId) {
    return { error: 'Missing required fields' }
  }

  // Verify current ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, owner_id')
    .eq('id', businessId)
    .single()

  if (!business || business.owner_id !== user.id) {
    return { error: 'Only the current owner can transfer ownership' }
  }

  // Verify new owner is an active manager
  const { data: newOwnerMember } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', newOwnerId)
    .eq('status', 'active')
    .single()

  if (!newOwnerMember) {
    return { error: 'New owner must be an active manager' }
  }

  // Transfer ownership
  const { error: updateError } = await supabase
    .from('businesses')
    .update({ owner_id: newOwnerId, updated_at: new Date().toISOString() })
    .eq('id', businessId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Update business_members: remove new owner from managers, add old owner as manager
  await supabase
    .from('business_members')
    .delete()
    .eq('business_id', businessId)
    .eq('user_id', newOwnerId)

  await supabase
    .from('business_members')
    .insert({
      business_id: businessId,
      user_id: user.id,
      role: 'manager',
      invited_by: newOwnerId,
      status: 'active',
    })

  // Notify new owner
  await supabase
    .from('notifications')
    .insert({
      user_id: newOwnerId,
      type: 'ownership_transfer',
      actor_id: user.id,
      business_id: businessId,
    })

  revalidatePath(`/business/${business.slug}`)
  return { success: true, message: 'Ownership transferred successfully' }
}

// Search users for invitation
export async function searchUsers(query: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', users: [] }
  }

  if (query.length < 2) {
    return { users: [] }
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', user.id)
    .limit(10)

  return { users: users || [] }
}
