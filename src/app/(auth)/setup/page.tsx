'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateUsername } from '@/lib/validators'

const PRESET_AVATARS = [
  { id: 'avatar-1', emoji: '😎', color: 'bg-yellow-500' },
  { id: 'avatar-2', emoji: '🔥', color: 'bg-orange-500' },
  { id: 'avatar-3', emoji: '💜', color: 'bg-purple-500' },
  { id: 'avatar-4', emoji: '🌊', color: 'bg-blue-500' },
  { id: 'avatar-5', emoji: '🌸', color: 'bg-pink-500' },
  { id: 'avatar-6', emoji: '⚡', color: 'bg-amber-500' },
  { id: 'avatar-7', emoji: '🍀', color: 'bg-green-500' },
  { id: 'avatar-8', emoji: '🎯', color: 'bg-red-500' },
]

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Check auth on mount — redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
      } else {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [router])

  const checkUsernameAvailability = useCallback(async (name: string) => {
    if (!validateUsername(name)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')

    try {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('username', name)
        .maybeSingle()

      if (queryError) {
        // RLS may block this query for new users — treat as available
        // The unique constraint on insert will catch actual collisions
        setUsernameStatus('available')
        return
      }

      setUsernameStatus(data ? 'taken' : 'available')
    } catch {
      setUsernameStatus('idle')
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!username) {
      setUsernameStatus('idle')
      return
    }

    if (!validateUsername(username)) {
      setUsernameStatus('invalid')
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      checkUsernameAvailability(username)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [username, checkUsernameAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only.')
      return
    }

    if (usernameStatus !== 'available') {
      setError('Please choose an available username.')
      return
    }

    if (!selectedAvatar) {
      setError('Please select an avatar.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to complete setup.')
        setLoading(false)
        return
      }

      const avatarData = PRESET_AVATARS.find((a) => a.id === selectedAvatar)
      const avatarUrl = avatarData ? avatarData.emoji : '😎'

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          username,
          avatar_url: avatarUrl,
          coin_balance: 10,
        }, { onConflict: 'id' })

      if (upsertError) {
        // Handle race condition — username taken between check and submit
        if (upsertError.message.includes('unique') || upsertError.message.includes('duplicate') || upsertError.code === '23505') {
          setError('Username was just taken. Try another.')
          setUsernameStatus('taken')
        } else {
          console.error('[Setup] Upsert error:', upsertError.message, upsertError.code, upsertError.details)
          setError(`Setup failed: ${upsertError.message}`)
        }
        setLoading(false)
        return
      }

      // Show celebratory animation
      setShowCelebration(true)

      // Redirect after celebration
      setTimeout(() => {
        router.push('/')
      }, 2500)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          </div>
        )
      case 'available':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Username available">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'taken':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Username taken">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'invalid':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Username invalid">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (usernameStatus) {
      case 'available':
        return <p className="mt-1 text-xs text-green-400">Username is available!</p>
      case 'taken':
        return <p className="mt-1 text-xs text-red-400">Username is already taken.</p>
      case 'invalid':
        return (
          <p className="mt-1 text-xs text-red-400">
            3-20 characters, letters, numbers, and underscores only.
          </p>
        )
      default:
        return null
    }
  }

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // Celebration overlay
  if (showCelebration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Tag.ai!</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-4xl">🪙</span>
            <p className="text-xl font-semibold text-yellow-400">
              You got 10 welcome coins!
            </p>
          </div>
        </div>
        {/* Confetti-like particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                backgroundColor: ['#fbbf24', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#fb923c'][i % 6],
                animationDelay: `${i * 150}ms`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Set Up Your Profile</h1>
          <p className="mt-2 text-gray-400">Choose a username and avatar to get started</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <div className="relative mt-1">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="cool_username"
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 pr-10 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoComplete="off"
              />
              {getStatusIcon()}
            </div>
            {getStatusMessage()}
            {usernameStatus === 'idle' && username === '' && (
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters, numbers, and underscores only.
              </p>
            )}
          </div>

          {/* Avatar selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose your avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`flex items-center justify-center w-16 h-16 rounded-xl text-2xl transition-all ${
                    selectedAvatar === avatar.id
                      ? `${avatar.color} ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110`
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  aria-label={`Select avatar ${avatar.emoji}`}
                  aria-pressed={selectedAvatar === avatar.id}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available' || !selectedAvatar}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
