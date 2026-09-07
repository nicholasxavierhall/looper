import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const { teacherId, emails } = await request.json()

  if (!teacherId || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'Missing teacherId or emails' }, { status: 400 })
  }

  const rows = emails.map((email: string) => ({ teacher_id: teacherId, email }))

  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .upsert(rows, { onConflict: 'teacher_id,email', ignoreDuplicates: true })
    .select()

  if (error) {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }

  const added = data?.length || 0
  return NextResponse.json({ added, skipped: emails.length - added })
}
