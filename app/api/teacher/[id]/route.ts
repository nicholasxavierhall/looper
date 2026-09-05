import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, name, bio')
    .eq('id', id)
    .single()

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', id)
    .order('day_of_week')

  return NextResponse.json({ teacher, classes: classes || [] })
}
