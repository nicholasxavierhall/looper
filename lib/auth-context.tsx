'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Teacher = {
  id: string
  email: string
  name: string
  bio?: string
  category?: string
  photo_url?: string
}

type AuthContextType = {
  teacher: Teacher | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, category: string) => Promise<void>
  logout: () => Promise<void>
  refreshTeacher: (updates: Partial<Teacher>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('looper_teacher_id')
      if (token) {
        const res = await fetch(`/api/auth/me?id=${token}`)
        if (res.ok) {
          const { teacher } = await res.json()
          setTeacher(teacher)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || 'Login failed')
    }

    localStorage.setItem('looper_teacher_id', result.teacher.id)
    setTeacher(result.teacher)
  }

  const signup = async (email: string, password: string, name: string, category: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, category })
    })

    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || 'Sign up failed')
    }

    localStorage.setItem('looper_teacher_id', result.teacher.id)
    setTeacher(result.teacher)
  }

  const logout = async () => {
    localStorage.removeItem('looper_teacher_id')
    setTeacher(null)
  }

  const refreshTeacher = (updates: Partial<Teacher>) => {
    setTeacher(prev => (prev ? { ...prev, ...updates } : prev))
  }

  return (
    <AuthContext.Provider value={{ teacher, loading, login, signup, logout, refreshTeacher }}>
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
