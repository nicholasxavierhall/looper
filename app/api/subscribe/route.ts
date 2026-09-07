import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { teacherId, email } = await request.json()

    if (!teacherId || !email) {
      return NextResponse.json({ error: 'Missing teacherId or email' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('subscribers')
      .upsert({ teacher_id: teacherId, email }, { onConflict: 'teacher_id,email' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subscribed' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
