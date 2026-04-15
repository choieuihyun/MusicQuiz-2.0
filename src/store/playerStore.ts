import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateSessionId } from '../lib/realtimeDB'

interface PlayerState {
  sessionId: string
  nickname: string
  isAdmin: boolean
  currentRoomCode: string | null
  setNickname: (name: string) => void
  setAdmin: (value: boolean) => void
  setCurrentRoom: (roomCode: string | null) => void
  resetSession: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      nickname: '',
      isAdmin: false,
      currentRoomCode: null,

      setNickname: (name: string) => set({ nickname: name }),

      setAdmin: (value: boolean) => set({ isAdmin: value }),

      setCurrentRoom: (roomCode: string | null) => set({ currentRoomCode: roomCode }),

      resetSession: () => set({
        sessionId: generateSessionId(),
        nickname: '',
        isAdmin: false,
        currentRoomCode: null,
      }),
    }),
    {
      name: 'musicquiz-player',
      partialize: (state) => ({
        sessionId: state.sessionId,
        nickname: state.nickname,
        isAdmin: state.isAdmin,
      }),
    }
  )
)
