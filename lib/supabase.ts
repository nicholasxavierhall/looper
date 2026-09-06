import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Teacher = {
  id: string
  email: string
  name: string
  bio?: string
  category?: string
  photo_url?: string
  created_at: string
}

export type Class = {
  id: string
  teacher_id: string
  name: string
  day_of_week: string // Monday, Tuesday, etc.
  time: string // HH:MM format
  location: string
  address?: string
  class_type: string // Yoga, Dance, DJ Set, etc.
  cost?: number
  created_at: string
}

export type WeeklyClass = {
  id: string
  teacher_id: string
  class_id: string
  week_of: string // ISO date string
  is_active: boolean
  created_at: string
}

export type Subscriber = {
  id: string
  teacher_id: string
  email: string
  subscribed_at: string
}

export type WeeklyUpdate = {
  id: string
  teacher_id: string
  week_of: string // ISO date string
  message?: string
  sent_at?: string
  created_at: string
}
