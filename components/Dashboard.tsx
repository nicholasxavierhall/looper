'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Camera, Pencil, Upload } from 'lucide-react'
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

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
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
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [history, setHistory] = useState<{ date: string; preview: string }[]>([])
  const [showShare, setShowShare] = useState(false)

  const teacherUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/teacher/${teacher?.id}`
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
    loadFollowerCount()
    loadHistory()
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

  const loadFollowerCount = async () => {
    const { count } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacher!.id)
    setFollowerCount(count || 0)
  }

  const loadHistory = async () => {
    const { data } = await supabase
      .from('weekly_updates')
      .select('week_of, message')
      .eq('teacher_id', teacher!.id)
      .not('message', 'is', null)
      .lt('week_of', getWeekStart())
      .order('week_of', { ascending: false })
      .limit(5)

    setHistory(
      (data || []).map(h => ({
        date: new Date(`${h.week_of}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        preview: h.message
      }))
    )
  }

  const getWeekStart = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return toDateKey(new Date(today.getFullYear(), today.getMonth(), diff))
  }

  const weekStart = getWeekStart()
  const todayStr = toDateKey(new Date())
  const weekDays = DAY_NAMES.map((name, i) => {
    const [y, m, day] = weekStart.split('-').map(Number)
    const d = new Date(y, m - 1, day + i)
    const dateStr = toDateKey(d)
    const activeClass = classes.find(c => c.day_of_week === name && (weeklyClasses[c.id] ?? true))
    return {
      day: name.slice(0, 3),
      date: d.getDate(),
      isToday: dateStr === todayStr,
      hasEvent: !!activeClass,
      title: activeClass?.name,
      time: activeClass ? formatTime(activeClass.time) : undefined
    }
  })
  const weekRangeLabel = (() => {
    const start = new Date(`${weekStart}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  })()

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

    await supabase
      .from('weekly_updates')
      .upsert({
        teacher_id: teacher!.id,
        week_of: getWeekStart(),
        message: message || null
      })

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
      loadHistory()
    } else {
      alert('No subscribers yet. Share your QR code to get subscribers!')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setImportText((prev) => (prev ? `${prev}\n${text}` : text))
  }

  const handleImportContacts = async () => {
    if (!teacher) return

    const found = importText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
    const unique = Array.from(new Set(found.map((e) => e.toLowerCase())))

    if (unique.length === 0) {
      setImportResult({ added: 0, skipped: 0 })
      return
    }

    setImporting(true)

    const rows = unique.map((email) => ({ teacher_id: teacher.id, email }))
    const { data } = await supabase
      .from('subscribers')
      .upsert(rows, { onConflict: 'teacher_id,email', ignoreDuplicates: true })
      .select()

    const added = data?.length || 0
    setImportResult({ added, skipped: unique.length - added })
    setImportText('')
    setImporting(false)
    loadFollowerCount()
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const handleDownloadQR = () => {
    const qrElement = document.querySelector('canvas')
    if (qrElement) {
      const link = document.createElement('a')
      link.href = qrElement.toDataURL()
      link.download = 'looper-qr.png'
      link.click()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(teacherUrl)
    alert('Link copied!')
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[var(--looper-page-bg)]">
      <header className="bg-white border-b border-[var(--looper-border)]">
        <div className="max-w-[1080px] mx-auto px-10 py-[18px] flex justify-between items-center">
          <img src="/looper-logo.png" alt="Looper" className="h-6 block" />

          <div className="flex items-center gap-2.5 relative">
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-1.5 bg-[var(--looper-chip-bg)] border border-[var(--looper-border-2)] text-[var(--looper-blue)] rounded-[9px] px-3.5 py-2 text-sm font-semibold"
            >
              <span className="w-3.5 h-3.5 border-2 border-current rounded-[3px] inline-block" />
              Share schedule
            </button>

            {showShare && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowShare(false)}
                  aria-label="Close"
                />
                <div className="absolute top-12 right-0 w-[260px] bg-white border border-[var(--looper-border-2)] rounded-[14px] shadow-xl p-5 z-20 text-center">
                  <div className="bg-[var(--looper-chip-bg)] rounded-[10px] flex justify-center p-2 mb-3.5">
                    <QRCodeCanvas value={teacherUrl} size={130} level="H" includeMargin={false} />
                  </div>
                  <div className="text-xs font-mono text-[var(--looper-body)] break-all mb-3">{teacherUrl}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="flex-1 bg-[var(--looper-chip-bg)] border border-[var(--looper-border-2)] rounded-[8px] py-2 text-xs font-semibold text-[var(--looper-ink)]"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 bg-[var(--looper-blue)] rounded-[8px] py-2 text-xs font-semibold text-white"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="w-8 h-8 rounded-full bg-[var(--looper-blue)] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
              {teacher?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-[var(--looper-body)] border border-[var(--looper-border-2)] rounded-[8px] px-3.5 py-1.5"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-10 py-12 pb-[90px] flex flex-col gap-10">
        {/* Editorial profile hero */}
        <section className="flex gap-8 items-end flex-wrap">
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
            className="group relative w-[168px] h-[168px] rounded-[18px] shrink-0"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={teacher?.name}
                className="w-[168px] h-[168px] rounded-[18px] object-cover"
              />
            ) : (
              <div className="w-[168px] h-[168px] rounded-[18px] bg-[var(--looper-chip-bg)] flex items-center justify-center text-[var(--looper-blue)] text-5xl font-bold">
                {teacher?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-[18px] bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={26} className="text-white" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--looper-link)]" />
              <span className="text-xs font-bold text-[var(--looper-blue)] uppercase tracking-wider">
                {terms.roleLabel}
              </span>
            </div>
            <h1 className="m-0 text-[44px] font-black tracking-tight leading-none text-[var(--looper-ink)]">
              {teacher?.name}
            </h1>

            {editingBio ? (
              <div className="mt-3.5">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your followers a bit about you"
                  className="w-full px-4 py-3 border border-[var(--looper-border-2)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--looper-link)] resize-none text-[15.5px]"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="bg-[var(--looper-blue)] text-white rounded-[9px] px-4 py-2 text-sm font-semibold"
                  >
                    {savingBio ? 'Saving...' : 'Save Bio'}
                  </button>
                  <button
                    onClick={handleCancelBio}
                    className="text-[var(--looper-body)] px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingBio(true)}
                className="group text-left mt-3.5 flex items-start gap-2"
              >
                <p className={`m-0 text-[15.5px] leading-relaxed max-w-[56ch] ${bio ? 'text-[var(--looper-body)]' : 'text-gray-400 italic'}`}>
                  {bio || 'Tell your followers a bit about you'}
                </p>
                <Pencil size={14} className="text-[var(--looper-blue)] opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
              </button>
            )}
            {bioSaved && <p className="text-[var(--looper-blue)] text-sm mt-1">Saved ✓</p>}

            <div className="flex gap-5 mt-4">
              <div>
                <span className="text-lg font-extrabold text-[var(--looper-ink)]">{followerCount}</span>{' '}
                <span className="text-[13px] text-[var(--looper-muted)]">followers</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-[var(--looper-ink)]">{classes.length}</span>{' '}
                <span className="text-[13px] text-[var(--looper-muted)]">{terms.items.toLowerCase()}/wk</span>
              </div>
            </div>
          </div>
        </section>

        {/* This week strip */}
        <section>
          <div className="flex items-baseline justify-between mb-3.5">
            <h2 className="m-0 text-[19px] font-extrabold text-[var(--looper-ink)] tracking-tight">This week</h2>
            <span className="text-[13px] text-[var(--looper-muted)]">{weekRangeLabel}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
            {weekDays.map((d) => (
              <div
                key={d.day}
                className="rounded-[12px] p-3 box-border"
                style={{
                  background: d.isToday ? 'var(--looper-today-bg)' : '#fff',
                  border: `1px solid ${d.isToday ? 'var(--looper-today-border)' : 'var(--looper-border)'}`,
                  minHeight: 78
                }}
              >
                <div className={`flex items-baseline gap-1.5 ${d.hasEvent ? 'mb-2.5' : ''}`}>
                  <span className="text-[11px] font-bold text-[var(--looper-body-2)] uppercase tracking-wide">{d.day}</span>
                  <span className="text-sm font-extrabold text-[var(--looper-ink-2)]">{d.date}</span>
                  {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-[var(--looper-link)]" />}
                </div>
                {d.hasEvent && (
                  <div>
                    <div className="text-[13.5px] font-bold text-[var(--looper-ink-2)] leading-tight">{d.title}</div>
                    <div className="text-xs text-[var(--looper-body-2)] mt-0.5">{d.time}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recurring schedule */}
        <section className="bg-white rounded-[16px] border border-[var(--looper-border)] p-7">
          <div className="flex items-center justify-between mb-4.5 flex-wrap gap-3">
            <div>
              <h2 className="m-0 text-lg font-extrabold text-[var(--looper-ink)]">Recurring schedule</h2>
              <p className="m-0 mt-1 text-[13px] text-[var(--looper-muted)]">These repeat automatically every week</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => alert('One-off (single-date) events are coming soon!')}
                className="bg-white border border-[var(--looper-border-2)] rounded-[9px] px-3.5 py-2 text-sm font-semibold text-[var(--looper-ink)]"
              >
                One-off event
              </button>
              <button
                onClick={() => setShowNewClass(!showNewClass)}
                className="flex items-center gap-1.5 bg-[var(--looper-link)] text-white rounded-[9px] px-4 py-2 text-sm font-bold"
              >
                <span className="text-base leading-none">+</span> {terms.addLabel}
              </button>
            </div>
          </div>

          {showNewClass && (
            <form onSubmit={handleAddClass} className="mb-5 p-4 bg-[var(--looper-chip-bg)] rounded-[12px] space-y-3 border border-[var(--looper-border-2)]">
              <input
                type="text"
                placeholder={`${terms.item} name`}
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[9px]"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newClass.day_of_week}
                  onChange={(e) => setNewClass({ ...newClass, day_of_week: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-[9px]"
                >
                  {DAY_NAMES.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-[9px]"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Location/Studio"
                value={newClass.location}
                onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[9px]"
                required
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newClass.address}
                onChange={(e) => setNewClass({ ...newClass, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[9px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Class type"
                  value={newClass.class_type}
                  onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-[9px]"
                />
                <input
                  type="number"
                  placeholder="Cost (optional)"
                  value={newClass.cost || ''}
                  onChange={(e) => setNewClass({ ...newClass, cost: e.target.value ? parseFloat(e.target.value) : 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-[9px]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--looper-blue)] text-white rounded-[9px] px-4 py-2 font-semibold"
              >
                {terms.addLabel}
              </button>
            </form>
          )}

          {classes.length === 0 ? (
            <p className="text-[var(--looper-muted)] py-8 text-center">No {terms.items.toLowerCase()} yet. Add your first {terms.item.toLowerCase()}!</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {classes.map(cls => {
                const active = weeklyClasses[cls.id] ?? true
                return (
                  <div key={cls.id} className="flex items-center gap-4 px-4 py-3.5 border border-[var(--looper-border)] rounded-[12px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: active ? 'oklch(58% 0.15 155)' : 'oklch(70% 0.01 60)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-bold text-[var(--looper-ink-2)]">{cls.name}</div>
                      <div className="text-xs text-[var(--looper-body-2)] mt-0.5">
                        {cls.day_of_week} · {formatTime(cls.time)} · {cls.location}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleClass(cls.id, active)}
                      className="text-[11.5px] font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        color: active ? 'var(--looper-active-text)' : 'var(--looper-paused-text)',
                        background: active ? 'var(--looper-active-bg)' : 'var(--looper-paused-bg)'
                      }}
                    >
                      {active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Import contacts */}
        <section className="bg-white rounded-[16px] border border-[var(--looper-border)] p-7">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div>
              <h2 className="m-0 text-lg font-extrabold text-[var(--looper-ink)]">Import Followers</h2>
              <p className="m-0 mt-1 text-[13px] text-[var(--looper-muted)]">Already have a list from somewhere else?</p>
            </div>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 bg-white border border-[var(--looper-border-2)] rounded-[9px] px-3.5 py-2 text-sm font-semibold text-[var(--looper-ink)]"
            >
              <Upload size={16} />
              Import
            </button>
          </div>
          {showImport && (
            <div className="mt-4 space-y-3">
              <p className="text-[13px] text-[var(--looper-muted)]">
                Paste a list below, or upload a file (CSV, text export, anything with email addresses in it) — Looper pulls out the email addresses automatically.
              </p>
              <input
                ref={importFileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleImportFile}
                className="hidden"
              />
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste emails here, or upload a file below"
                className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--looper-link)] resize-none"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="bg-white border border-[var(--looper-border-2)] rounded-[9px] px-3.5 py-2 text-sm font-semibold text-[var(--looper-ink)]"
                >
                  Upload File
                </button>
                <button
                  onClick={handleImportContacts}
                  disabled={importing || !importText.trim()}
                  className="bg-[var(--looper-blue)] disabled:opacity-40 text-white rounded-[9px] px-3.5 py-2 text-sm font-semibold"
                >
                  {importing ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>
              {importResult && (
                <p className="text-sm text-[var(--looper-blue)]">
                  Added {importResult.added} new follower{importResult.added === 1 ? '' : 's'}
                  {importResult.skipped > 0 ? ` (${importResult.skipped} already followed you)` : ''}.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Weekly note + history */}
        <section className="bg-white rounded-[16px] border border-[var(--looper-border)] p-7">
          <h2 className="m-0 mb-1 text-lg font-extrabold text-[var(--looper-ink)]">Weekly note to followers</h2>
          <p className="m-0 mb-4 text-[13px] text-[var(--looper-muted)]">Sent alongside your schedule every week</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Class moved to 6pm this Thursday — see you there!"
            className="w-full px-3.5 py-3.5 border border-[var(--looper-border-2)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--looper-link)] resize-none text-[14.5px]"
            rows={3}
          />
          <button
            onClick={handleSendNewsletter}
            disabled={sending}
            className="mt-3 bg-[var(--looper-blue)] disabled:opacity-40 text-white rounded-[10px] px-5 py-3 text-sm font-bold"
          >
            {sending ? 'Sending...' : 'Send to followers'}
          </button>

          {history.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[var(--looper-border)]">
              <div className="text-xs font-bold text-[var(--looper-body-2)] uppercase tracking-wide mb-3">Past notes</div>
              <div className="flex flex-col gap-3">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-3.5">
                    <span className="shrink-0 text-xs text-[var(--looper-muted)] w-16">{h.date}</span>
                    <span className="text-[13.5px] text-[var(--looper-ink-2)] leading-relaxed">{h.preview}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
