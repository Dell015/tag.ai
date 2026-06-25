'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinGamePage() {
  const params = useParams()
  const router = useRouter()

  // If the user arrives via URL, pre-fill the room code from params
  const paramRoomCode = typeof params.roomCode === 'string' ? params.roomCode.toUpperCase() : ''

  const [roomCode, setRoomCode] = useState(paramRoomCode)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Pre-fill from URL param on mount
  useEffect(() => {
    if (paramRoomCode) {
      setRoomCode(paramRoomCode)
    }
  }, [paramRoomCode])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedCode = roomCode.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Please enter a room code.')
      return
    }

    if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
      setError('Room code must be exactly 6 alphanumeric characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('You must be logged in to join a game.')
        setLoading(false)
        return
      }

      // Look up the session by room_code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('room_code', trimmedCode)
        .single()

      if (sessionError || !session) {
        setError('Room not found')
        setLoading(false)
        return
      }

      // Check session status
      if (session.status === 'active') {
        setError("Game already in progress. You can't join mid-game.")
        setLoading(false)
        return
      }

      if (session.status === 'ended') {
        setError('This game session has already ended.')
        setLoading(false)
        return
      }

      // Check if player is already in the session
      const { data: existingPlayer } = await supabase
        .from('session_players')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .is('removed_at', null)
        .single()

      if (existingPlayer) {
        // Player is already in the session, redirect directly
        router.push(`/game/${trimmedCode}`)
        return
      }

      // Get user profile for display_name
      const { data: profile } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Please complete your profile setup first.')
        setLoading(false)
        return
      }

      // Calculate next turn_order as max(existing turn_orders) + 1
      const { data: existingPlayers } = await supabase
        .from('session_players')
        .select('turn_order')
        .eq('session_id', session.id)
        .is('removed_at', null)
        .order('turn_order', { ascending: false })
        .limit(1)

      const nextTurnOrder = existingPlayers && existingPlayers.length > 0
        ? existingPlayers[0].turn_order + 1
        : 1

      // Add player to session_players table
      const { error: insertError } = await supabase
        .from('session_players')
        .insert({
          session_id: session.id,
          user_id: user.id,
          display_name: profile.username,
          turn_order: nextTurnOrder,
        })

      if (insertError) {
        // Handle unique constraint violation (player already in session)
        if (insertError.code === '23505') {
          router.push(`/game/${trimmedCode}`)
          return
        }
        setError("Couldn't join. Check the room code and try again.")
        setLoading(false)
        return
      }

      // Successfully joined — redirect to game page
      router.push(`/game/${trimmedCode}`)
    } catch {
      setError("Couldn't join. Check the room code and try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Join Game</h1>
          <p className="mt-2 text-gray-400">
            Enter the room code to join a game session
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Room code form */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label
              htmlFor="roomCode"
              className="block text-sm font-medium text-gray-300"
            >
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoComplete="off"
              autoFocus
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-2xl font-mono tracking-widest text-white uppercase placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="ABC123"
            />
          </div>

          <button
            type="submit"
            disabled={loading || roomCode.trim().length !== 6}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        {/* Back link */}
        <p className="text-center text-sm text-gray-400">
          <button
            onClick={() => router.push('/')}
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Home
          </button>
        </p>
      </div>
    </div>
  )
}
