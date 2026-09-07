import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { teacherId, weekOf, message } = await request.json()

    // Get teacher info
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get active classes for this week
    const { data: weeklyClasses } = await supabaseAdmin
      .from('weekly_classes')
      .select(`
        *,
        class:classes(*)
      `)
      .eq('teacher_id', teacherId)
      .eq('week_of', weekOf)
      .eq('is_active', true)

    // Get subscribers
    const { data: subscribers } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .eq('teacher_id', teacherId)

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        message: 'No subscribers to send to',
        sent: 0
      })
    }

    // Build email HTML
    const classesHtml = weeklyClasses?.map(wc => `
      <div style="border: 1px solid #ddd; padding: 12px; margin: 10px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0;">${wc.class?.name}</h3>
        <p style="margin: 4px 0;"><strong>${wc.class?.day_of_week}</strong> at ${wc.class?.time}</p>
        <p style="margin: 4px 0;">${wc.class?.location}</p>
        ${wc.class?.cost ? `<p style="margin: 4px 0;">Cost: $${wc.class.cost}</p>` : ''}
      </div>
    `).join('')

    const origin = request.nextUrl.origin

    // Send emails
    const results = await Promise.all(
      subscribers.map(sub => {
        const unsubscribeUrl = `${origin}/api/unsubscribe?teacherId=${teacherId}&email=${encodeURIComponent(sub.email)}`
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>${teacher.name}'s Weekly Classes</h1>
            ${message ? `<p style="font-style: italic; color: #666;">${message}</p>` : ''}
            <h2>This Week's Classes</h2>
            ${classesHtml}
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              You're receiving this because you subscribed to ${teacher.name}'s newsletter.
              <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
            </p>
          </div>
        `
        return resend.emails.send({
          from: 'Looper <onboarding@resend.dev>',
          to: sub.email,
          subject: `${teacher.name}'s Classes - Week of ${weekOf}`,
          html: emailHtml,
        })
      })
    )

    // Update weekly_updates with sent_at
    await supabaseAdmin
      .from('weekly_updates')
      .update({ sent_at: new Date().toISOString() })
      .eq('teacher_id', teacherId)
      .eq('week_of', weekOf)

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      sent: results.filter(r => !r.error).length,
      total: subscribers.length
    })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
