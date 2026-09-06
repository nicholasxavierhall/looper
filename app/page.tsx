'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import { CATEGORIES } from '@/lib/terminology'

export default function Home() {
  const { teacher, loading } = useAuth()
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('dance')
  const [error, setError] = useState('')
  const { login, signup } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
        <p className="text-sky-900">Loading...</p>
      </div>
    )
  }

  if (teacher) {
    return <Dashboard />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (showLogin) {
        await login(email, password)
      } else {
        await signup(email, password, name, category)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-8">
          <img src="/looper-logo.png" alt="Looper" className="h-16 block mx-auto mb-2" />
          <p className="text-center text-gray-600 mb-8">Share your weekly schedule as a Looper</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!showLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
              </div>
            )}

            {!showLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What best describes you?
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-sky-600 font-semibold py-3 rounded-full shadow-md border border-sky-200 hover:shadow-lg hover:bg-sky-50 transition"
            >
              {showLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {showLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setShowLogin(!showLogin)
                  setError('')
                }}
                className="text-sky-600 hover:text-sky-700 font-semibold"
              >
                {showLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
