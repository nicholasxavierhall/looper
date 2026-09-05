'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Mail, MapPin } from 'lucide-react'

type Teacher = {
  id: string
  name: string
  bio?: string
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Teacher not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{teacher.name}</h1>
          {teacher.bio && (
            <p className="text-gray-600 text-lg mb-6">{teacher.bio}</p>
          )}

          {/* Subscribe Section */}
          <form onSubmit={handleSubscribe} className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Get Weekly Updates</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            {subscribed && (
              <p className="text-green-600 text-sm mt-2">✓ Subscribed! Check your email.</p>
            )}
          </form>
        </div>

        {/* Classes */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Schedule</h2>
          
          {classes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <p className="text-gray-600">No classes scheduled yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {classes.map(cls => (
                <div key={cls.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                      <p className="text-gray-600 text-sm">{cls.class_type}</p>
                    </div>
                    {cls.cost && (
                      <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-lg font-semibold">
                        ${cls.cost}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-blue-600" />
                      <span>{cls.day_of_week} at {cls.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={18} className="text-blue-600" />
                      <span>{cls.location}</span>
                    </div>
                    {cls.address && (
                      <div className="text-gray-600 text-sm ml-6">{cls.address}</div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCalendar(cls)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
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
        <div className="mt-12 text-center">
          <p className="text-white text-sm">
            Powered by <span className="font-bold">Looper</span>
          </p>
        </div>
      </div>
    </div>
  )
}
