import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get('teacherId')
  if (!teacherId) {
    return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('subscribers')
    .select('email, subscribed_at')
    .eq('teacher_id', teacherId)
    .order('subscribed_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ followers: data || [] })
}
