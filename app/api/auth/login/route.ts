import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const { data } = await supabaseAdmin
    .from('teachers')
    .select('*')
    .eq('email', email)
    .single()

  if (!data || !verifyPassword(password, data.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const { password_hash: _password_hash, ...teacher } = data
  return NextResponse.json({ teacher })
}
