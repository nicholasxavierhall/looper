import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/password'

export async function POST(request: NextRequest) {
  const { email, password, name, category } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('teachers')
    .insert([{ email, name, password_hash: hashPassword(password), category }])
    .select('id, email, name, bio, category, photo_url, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That email is already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
  }

  return NextResponse.json({ teacher: data })
}
