import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  const { teacherId, bio, photo_url } = await request.json()

  if (!teacherId) {
    return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (bio !== undefined) updates.bio = bio
  if (photo_url !== undefined) updates.photo_url = photo_url

  const { error } = await supabaseAdmin
    .from('teachers')
    .update(updates)
    .eq('id', teacherId)

  if (error) {
    return NextResponse.json({ error: 'Could not update profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
