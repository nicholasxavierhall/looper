'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Mail, MapPin } from 'lucide-react'
import { getTerminology } from '@/lib/terminology'

type Teacher = {
  id: string
  name: string
  bio?: string
  category?: string
  photo_url?: string
}

type Class = {
  id: string
  name: string
  day_of_week: string
  time: string
  location: string
  address?: string
  class_type: string
  cost?: number
}

export default function TeacherProfile() {
  const params = useParams<{ id: string }>()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    loadTeacherData()
  }, [params.id])

  const loadTeacherData = async () => {
    setLoading(true)

    const res = await fetch(`/api/teacher/${params.id}`)

    if (res.ok) {
      const { teacher, classes } = await res.json()
      setTeacher(teacher)
      setClasses(classes)
    }

    setLoading(false)
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return

    setSubscribing(true)

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: teacher.id, email: subscribeEmail })
    })

    if (res.ok) {
      setSubscribed(true)
      setSubscribeEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }

    setSubscribing(false)
  }

  const addToCalendar = (cls: Class) => {
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    }

    const today = new Date()
    const currentDay = today.getDay()
    const targetDay = dayMap[cls.day_of_week]
    const daysAhead = (targetDay - currentDay + 7) % 7 || 7

    const eventDate = new Date(today)
    eventDate.setDate(eventDate.getDate() + daysAhead)

    const [hours, minutes] = cls.time.split(':').map(Number)
    eventDate.setHours(hours, minutes, 0)

    const endDate = new Date(eventDate)
    endDate.setHours(endDate.getHours() + 1)

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Looper//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${cls.id}@looper.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${cls.name} - ${teacher?.name}
LOCATION:${cls.location}
DESCRIPTION:${cls.class_type} at ${cls.location}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cls.name.replace(/\s/g, '_')}.ics`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
        <p className="text-sky-900">Loading...</p>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
        <p className="text-sky-900">Looper not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-8 mb-8">
          <div className="flex items-center gap-4 mb-2">
            {teacher.photo_url ? (
              <img
                src={teacher.photo_url}
                alt={teacher.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-sky-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xl font-bold">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-4xl font-bold text-slate-900">{teacher.name}</h1>
          </div>
          {teacher.bio && (
            <p className="text-gray-600 text-lg mb-6">{teacher.bio}</p>
          )}

          {/* Follow Section */}
          <form onSubmit={handleSubscribe} className="bg-sky-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={20} className="text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-900">Follow {teacher.name} on Looper</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-white hover:bg-sky-50 disabled:bg-gray-100 disabled:text-gray-400 text-sky-600 px-6 py-2 rounded-full font-semibold shadow-md border border-sky-200 hover:shadow-lg transition"
              >
                {subscribing ? 'Following...' : 'Follow'}
              </button>
            </div>
            {subscribed && (
              <p className="text-sky-700 text-sm mt-2">✓ You&apos;re following {teacher.name}! Check your email.</p>
            )}
          </form>
        </div>

        {/* Classes */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{getTerminology(teacher.category).scheduleLabel}</h2>

          {classes.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-8 text-center">
              <p className="text-gray-600">Nothing scheduled yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {classes.map(cls => (
                <div key={cls.id} className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                      <p className="text-gray-600 text-sm">{cls.class_type}</p>
                    </div>
                    {cls.cost && (
                      <div className="bg-sky-100 text-sky-900 px-3 py-1 rounded-full font-semibold">
                        ${cls.cost}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-sky-600" />
                      <span>{cls.day_of_week} at {cls.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={18} className="text-sky-600" />
                      <span>{cls.location}</span>
                    </div>
                    {cls.address && (
                      <div className="text-gray-600 text-sm ml-6">{cls.address}</div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCalendar(cls)}
                    className="w-full bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 px-4 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    Add to Calendar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <p className="text-sky-900/60 text-xs">Powered by</p>
          <img src="/looper-logo.png" alt="Looper" className="h-5 opacity-60" />
        </div>
      </div>
    </div>
  )
}
