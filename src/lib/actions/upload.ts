'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadImage(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to upload images' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' }
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large. Maximum size is 5MB.' }
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filename)

  return { url: publicUrl }
}
