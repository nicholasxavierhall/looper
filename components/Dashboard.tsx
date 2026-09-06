'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus, Send, Camera, Pencil } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { getTerminology } from '@/lib/terminology'

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
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [bioSaved, setBioSaved] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const teacherUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/teacher/${teacher?.id}`
  const qrValue = teacherUrl
  const terms = getTerminology(teacher?.category)

  useEffect(() => {
    if (!teacher) return
    setPhotoUrl(teacher.photo_url)
    setBio(teacher.bio || '')
  }, [teacher])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !teacher) return

    setUploadingPhoto(true)

    const ext = file.name.split('.').pop()
    const path = `${teacher.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`

      await supabase
        .from('teachers')
        .update({ photo_url: newUrl })
        .eq('id', teacher.id)

      setPhotoUrl(newUrl)
    }

    setUploadingPhoto(false)
  }

  const handleSaveBio = async () => {
    if (!teacher) return
    setSavingBio(true)

    await supabase
      .from('teachers')
      .update({ bio })
      .eq('id', teacher.id)

    setSavingBio(false)
    setEditingBio(false)
    setBioSaved(true)
    setTimeout(() => setBioSaved(false), 2000)
  }

  const handleCancelBio = () => {
    setBio(teacher?.bio || '')
    setEditingBio(false)
  }

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      <header className="bg-white border-b border-sky-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-sky-600">Looper</h1>
            <p className="text-sm text-gray-600">Welcome, {teacher?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-sky-50 rounded-full"
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
            {/* Profile section */}
            <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-6">
              <div className="flex items-start gap-5 mb-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="group relative w-32 h-32 rounded-2xl shrink-0"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={teacher?.name}
                      className="w-32 h-32 rounded-2xl object-cover border-2 border-sky-100"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 text-4xl font-bold">
                      {teacher?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={26} className="text-white" />
                  </div>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">Uploading...</span>
                    </div>
                  )}
                </button>

                <div className="flex-1 pt-1">
              {editingBio ? (
                <>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your followers a bit about you"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="bg-white hover:bg-sky-50 disabled:bg-gray-100 disabled:text-gray-400 text-sky-600 border border-sky-200 px-4 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition text-sm"
                    >
                      {savingBio ? 'Saving...' : 'Save Bio'}
                    </button>
                    <button
                      onClick={handleCancelBio}
                      className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setEditingBio(true)}
                  className="group w-full text-left px-4 py-3 border border-transparent hover:border-sky-200 rounded-2xl transition flex items-start justify-between gap-2"
                >
                  <span className={bio ? 'text-gray-700' : 'text-gray-400 italic'}>
                    {bio || 'Tell your followers a bit about you'}
                  </span>
                  <Pencil size={16} className="text-sky-600 opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
                </button>
              )}
              {bioSaved && <p className="text-sky-700 text-sm mt-2">Saved ✓</p>}
                </div>
              </div>
            </div>

            {/* Classes section */}
            <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Your {terms.items}</h2>
                <button
                  onClick={() => setShowNewClass(!showNewClass)}
                  className="flex items-center gap-2 bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 px-4 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition"
                >
                  <Plus size={20} />
                  {terms.addLabel}
                </button>
              </div>

              {showNewClass && (
                <form onSubmit={handleAddClass} className="mb-6 p-4 bg-sky-50 rounded-2xl space-y-4 border-2 border-sky-200">
                  <input
                    type="text"
                    placeholder={`${terms.item} name`}
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newClass.day_of_week}
                      onChange={(e) => setNewClass({ ...newClass, day_of_week: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-full"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newClass.time}
                      onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-full"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location/Studio"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newClass.address}
                    onChange={(e) => setNewClass({ ...newClass, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Class type"
                      value={newClass.class_type}
                      onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-full"
                    />
                    <input
                      type="number"
                      placeholder="Cost (optional)"
                      value={newClass.cost || ''}
                      onChange={(e) => setNewClass({ ...newClass, cost: e.target.value ? parseFloat(e.target.value) : 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 px-4 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition"
                  >
                    {terms.addLabel}
                  </button>
                </form>
              )}

              {classes.length === 0 ? (
                <p className="text-gray-600 py-8 text-center">No {terms.items.toLowerCase()} yet. Add your first {terms.item.toLowerCase()}!</p>
              ) : (
                <div className="space-y-3">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-4 border border-sky-100 rounded-2xl hover:border-sky-300 transition">
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
                          className="w-5 h-5 accent-sky-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{terms.activeLabel}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter section */}
            <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">This Week's Message</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note to your followers (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                rows={4}
              />
              <button
                onClick={handleSendNewsletter}
                disabled={sending}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-sky-50 disabled:bg-gray-100 disabled:text-gray-400 text-sky-600 border border-sky-200 px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition"
              >
                <Send size={20} />
                {sending ? 'Sending...' : 'Send Newsletter'}
              </button>
            </div>
          </div>

          {/* Sidebar - QR Code */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Share Your QR</h2>
              <div className="bg-sky-50 p-6 rounded-2xl flex justify-center mb-4">
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
                className="w-full bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition"
              >
                Download QR
              </button>

              <div className="mt-6 p-4 bg-sky-50 rounded-2xl">
                <p className="text-xs text-gray-600 font-semibold mb-2">Your Link:</p>
                <p className="text-xs text-sky-600 break-all font-mono">{teacherUrl}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(teacherUrl)
                    alert('Link copied!')
                  }}
                  className="mt-2 w-full bg-white hover:bg-sky-100 text-sky-600 border border-sky-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition"
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
