import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateSessionId } from '../lib/realtimeDB'

interface PlayerState {
  sessionId: string
  nickname: string
  photoURL: string
  isAdmin: boolean
  currentRoomCode: string | null
  setNickname: (name: string) => void
  setPhotoURL: (url: string) => void
  setAdmin: (value: boolean) => void
  setCurrentRoom: (roomCode: string | null) => void
  resetSession: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      nickname: '',
      photoURL: '',
      isAdmin: false,
      currentRoomCode: null,

      setNickname: (name: string) => set({ nickname: name }),

      setPhotoURL: (url: string) => set({ photoURL: url }),

      setAdmin: (value: boolean) => set({ isAdmin: value }),

      setCurrentRoom: (roomCode: string | null) => set({ currentRoomCode: roomCode }),

      resetSession: () => set({
        sessionId: generateSessionId(),
        nickname: '',
        photoURL: '',
        isAdmin: false,
        currentRoomCode: null,
      }),
    }),
    {
      name: 'musicquiz-player',
      partialize: (state) => ({
        sessionId: state.sessionId,
        nickname: state.nickname,
        photoURL: state.photoURL,
        isAdmin: state.isAdmin,
      }),
    }
  )
)
