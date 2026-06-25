'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [hostingLoading, setHostingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('coin_balance')
        .eq('id', user.id)
        .single()

      if (data) {
        setCoinBalance(data.coin_balance)
      }

      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleHostGame = async () => {
    setError(null)
    setHostingLoading(true)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Couldn't create the room. Try again.")
        setHostingLoading(false)
        return
      }

      const { roomCode } = await response.json()
      router.push(`/game/${roomCode}`)
    } catch {
      setError("Couldn't create the room. Try again.")
      setHostingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 text-white font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* App Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Tag.ai</h1>
          <p className="mt-2 text-gray-400 text-sm">The social card game</p>
        </div>

        {/* Coin Wallet Display */}
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-6 py-4 border border-gray-800">
          <span className="text-3xl" role="img" aria-label="Gold coin">
            🪙
          </span>
          <span className="text-2xl font-mono font-semibold tabular-nums">
            {coinBalance ?? 0}
          </span>
          <span className="text-sm text-gray-400 ml-1">coins</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Main CTAs */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={handleHostGame}
            disabled={hostingLoading}
            className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {hostingLoading ? 'Creating room...' : '🎮 Host a Game'}
          </button>

          <Link
            href="/game/join"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-6 py-4 text-lg font-semibold text-white text-center shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition-colors"
          >
            🎯 Join a Game
          </Link>
        </div>

        {/* Profile Navigation */}
        <Link
          href="/profile"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
