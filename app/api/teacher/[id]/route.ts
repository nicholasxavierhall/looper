import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: teacher } = await supabaseAdmin
    .from('teachers')
    .select('id, name, bio, category, photo_url')
    .eq('id', id)
    .single()

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('teacher_id', id)
    .order('day_of_week')

  const { count: followerCount } = await supabaseAdmin
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', id)

  return NextResponse.json({ teacher, classes: classes || [], followerCount: followerCount || 0 })
}
