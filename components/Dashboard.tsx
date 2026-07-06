'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus, Send } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

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

type WeeklyClass = {
  class_id: string
  is_active: boolean
}

export default function Dashboard() {
  const { teacher, logout } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [weeklyClasses, setWeeklyClasses] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [newClass, setNewClass] = useState({
    name: '',
    day_of_week: 'Monday',
    time: '10:00',
    location: '',
    address: '',
    class_type: 'Class',
    cost: 0
  })

  const teacherUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/teacher/${teacher?.id}`
  const qrValue = teacherUrl

  useEffect(() => {
    if (!teacher) return
    loadClasses()
  }, [teacher])

  const loadClasses = async () => {
    setLoading(true)
    const { data: classesData } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacher!.id)

    const { data: weeklyData } = await supabase
      .from('weekly_classes')
      .select('*')
      .eq('teacher_id', teacher!.id)
      .eq('week_of', getWeekStart())

    setClasses(classesData || [])
    
    const weeklyMap: Record<string, boolean> = {}
    weeklyData?.forEach(w => {
      weeklyMap[w.class_id] = w.is_active
    })
    setWeeklyClasses(weeklyMap)
    setLoading(false)
  }

  const getWeekStart = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    return new Date(today.setDate(diff)).toISOString().split('T')[0]
  }

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('classes')
      .insert([{
        teacher_id: teacher!.id,
        ...newClass,
        cost: newClass.cost || null
      }])
      .select()

    if (!error && data) {
      setClasses([...classes, data[0]])
      setNewClass({
        name: '',
        day_of_week: 'Monday',
        time: '10:00',
        location: '',
        address: '',
        class_type: 'Class',
        cost: 0
      })
      setShowNewClass(false)
    }
  }

  const handleToggleClass = async (classId: string, isActive: boolean) => {
    const newValue = !isActive
    setWeeklyClasses(prev => ({ ...prev, [classId]: newValue }))

    await supabase
      .from('weekly_classes')
      .upsert({
        teacher_id: teacher!.id,
        class_id: classId,
        week_of: getWeekStart(),
        is_active: newValue
      })
  }

  const handleSendNewsletter = async () => {
    setSending(true)
    
    // Save weekly update message
    await supabase
      .from('weekly_updates')
      .upsert({
        teacher_id: teacher!.id,
        week_of: getWeekStart(),
        message: message || null
      })

    // Send email
    const response = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId: teacher!.id,
        weekOf: getWeekStart(),
        message
      })
    })

    const result = await response.json()
    setSending(false)
    
    if (result.sent) {
      alert(`Newsletter sent to ${result.sent} subscribers!`)
      setMessage('')
    } else {
      alert('No subscribers yet. Share your QR code to get subscribers!')
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Looper</h1>
            <p className="text-sm text-gray-600">Welcome, {teacher?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Classes section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Your Classes</h2>
                <button
                  onClick={() => setShowNewClass(!showNewClass)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  <Plus size={20} />
                  Add Class
                </button>
              </div>

              {showNewClass && (
                <form onSubmit={handleAddClass} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4 border-2 border-blue-200">
                  <input
                    type="text"
                    placeholder="Class name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newClass.day_of_week}
                      onChange={(e) => setNewClass({ ...newClass, day_of_week: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newClass.time}
                      onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location/Studio"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newClass.address}
                    onChange={(e) => setNewClass({ ...newClass, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Class type"
                      value={newClass.class_type}
                      onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Cost (optional)"
                      value={newClass.cost || ''}
                      onChange={(e) => setNewClass({ ...newClass, cost: e.target.value ? parseFloat(e.target.value) : 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Add Class
                  </button>
                </form>
              )}

              {classes.length === 0 ? (
                <p className="text-gray-600 py-8 text-center">No classes yet. Add your first class!</p>
              ) : (
                <div className="space-y-3">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                          <p className="text-sm text-gray-600">{cls.day_of_week} at {cls.time}</p>
                          <p className="text-sm text-gray-600">{cls.location}</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 mt-3">
                        <input
                          type="checkbox"
                          checked={weeklyClasses[cls.id] ?? true}
                          onChange={() => handleToggleClass(cls.id, weeklyClasses[cls.id] ?? true)}
                          className="w-5 h-5 accent-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Teaching this week</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">This Week's Message</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note to your subscribers (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
              <button
                onClick={handleSendNewsletter}
                disabled={sending}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                <Send size={20} />
                {sending ? 'Sending...' : 'Send Newsletter'}
              </button>
            </div>
          </div>

          {/* Sidebar - QR Code */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Share Your QR</h2>
              <div className="bg-gray-100 p-6 rounded-lg flex justify-center mb-4">
                <QRCodeCanvas value={qrValue} size={256} level="H" includeMargin={true} />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Share this QR code so followers can discover your schedule
              </p>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  const qrElement = document.querySelector('canvas')
                  if (qrElement) {
                    link.href = qrElement.toDataURL()
                    link.download = 'looper-qr.png'
                    link.click()
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Download QR
              </button>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 font-semibold mb-2">Your Link:</p>
                <p className="text-xs text-blue-600 break-all font-mono">{teacherUrl}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(teacherUrl)
                    alert('Link copied!')
                  }}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
