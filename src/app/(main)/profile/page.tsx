'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  username: string
  avatar_url: string | null
  coin_balance: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
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
        .select('username, avatar_url, coin_balance')
        .eq('id', user.id)
        .single()

      if (!data) {
        router.replace('/login')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 text-white font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-5xl border-2 border-gray-700">
          {profile.avatar_url || '😀'}
        </div>

        {/* Username */}
        <h1 className="text-2xl font-bold">{profile.username}</h1>

        {/* Coin Balance */}
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-6 py-4 border border-gray-800">
          <span className="text-3xl" role="img" aria-label="Gold coin">
            🪙
          </span>
          <span className="text-2xl font-mono font-semibold tabular-nums">
            {profile.coin_balance}
          </span>
          <span className="text-sm text-gray-400 ml-1">coins</span>
        </div>

        {/* Back link */}
        <a
          href="/"
          className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}
