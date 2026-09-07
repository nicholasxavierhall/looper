import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get('teacherId')
  const email = request.nextUrl.searchParams.get('email')

  if (!teacherId || !email) {
    return new NextResponse('Missing information', { status: 400 })
  }

  await supabaseAdmin
    .from('subscribers')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('email', email)

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #eff6ff;">
  <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px;">
    <h1 style="margin: 0 0 12px; font-size: 20px;">You've been unsubscribed</h1>
    <p style="color: #555;">${email} will no longer receive these updates.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
