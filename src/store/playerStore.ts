import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateSessionId } from '../lib/realtimeDB'

interface PlayerState {
  sessionId: string
  nickname: string
  currentRoomCode: string | null
  setNickname: (name: string) => void
  setCurrentRoom: (roomCode: string | null) => void
  resetSession: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      nickname: '',
      currentRoomCode: null,

      setNickname: (name: string) => set({ nickname: name }),

      setCurrentRoom: (roomCode: string | null) => set({ currentRoomCode: roomCode }),

      resetSession: () => set({
        sessionId: generateSessionId(),
        nickname: '',
        currentRoomCode: null,
      }),
    }),
    {
      name: 'musicquiz-player',
      partialize: (state) => ({
        sessionId: state.sessionId,
        nickname: state.nickname,
      }),
    }
  )
)
