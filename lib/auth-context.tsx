'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type Teacher = {
  id: string
  email: string
  name: string
  bio?: string
}

type AuthContextType = {
  teacher: Teacher | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('looper_teacher_id')
      if (token) {
        const { data } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', token)
          .single()
        if (data) {
          setTeacher(data)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single()
    
    if (!data) {
      throw new Error('Teacher not found')
    }
    
    // Simple password check (in production, use proper hashing)
    const storedPassword = localStorage.getItem(`looper_pw_${email}`)
    if (storedPassword !== password) {
      throw new Error('Invalid password')
    }
    
    localStorage.setItem('looper_teacher_id', data.id)
    setTeacher(data)
  }

  const signup = async (email: string, password: string, name: string) => {
    const { data } = await supabase
      .from('teachers')
      .insert([{ email, name, password_hash: password }])
      .select()
      .single()
    
    if (data) {
      localStorage.setItem(`looper_pw_${email}`, password)
      localStorage.setItem('looper_teacher_id', data.id)
      setTeacher(data)
    }
  }

  const logout = async () => {
    localStorage.removeItem('looper_teacher_id')
    setTeacher(null)
  }

  return (
    <AuthContext.Provider value={{ teacher, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
