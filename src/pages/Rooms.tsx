import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { createRoom, joinRoom, deleteRoom, subscribeToRooms } from '../lib/realtimeDB'
import type { Room } from '../lib/realtimeDB'

const ERA_COLORS: Record<string, string> = {
  '2000s': '#a855f7', '2010s': '#22d3ee', '2020s': '#f472b6', '': 'rgba(255,255,255,0.35)',
}

export default function Rooms() {
  const navigate = useNavigate()
  const { sessionId, nickname, isAdmin, setCurrentRoom } = usePlayerStore()
  const [rooms, setRooms] = useState<Record<string, Room>>({})
  const [loading, setLoading] = useState(false)
  const [joiningCode, setJoiningCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!nickname) { navigate('/login'); return }
    const unsubscribe = subscribeToRooms(setRooms)
    return () => unsubscribe()
  }, [nickname, navigate])

  const handleCreate = async () => {
    setLoading(true); setError('')
    try {
      const roomCode = await createRoom(sessionId, nickname)
      setCurrentRoom(roomCode)
      navigate(`/room/${roomCode}`)
    } catch {
      setError('방 생성에 실패했습니다')
    } finally { setLoading(false) }
  }

  const handleJoin = async (roomCode: string) => {
    if (joiningCode) return
    setJoiningCode(roomCode); setError('')
    try {
      const room = await joinRoom(roomCode, sessionId, nickname)
      if (!room) { setError('방을 찾을 수 없습니다'); setJoiningCode(null); return }
      setCurrentRoom(roomCode)
      navigate(`/room/${roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 참가에 실패했습니다')
      setJoiningCode(null)
    }
  }

  const handleDelete = async (roomCode: string) => {
    await deleteRoom(roomCode)
  }

  const waitingRooms = Object.entries(rooms).filter(([, r]) => r.status === 'waiting')

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.12) 0%, transparent 55%)',
      }} />

      <header style={{ padding: '56px 20px 24px', position: 'relative' }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>안녕하세요, </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>{nickname}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}> 님</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
          방을 선택하거나 새로 만들어보세요
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
              fontSize: 15, fontWeight: 800, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {loading ? '생성 중...' : '🎮  방 만들기'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 20px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            솔로 플레이
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
            color: '#f43f5e', fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}
      </header>

      <main style={{ padding: '0 20px 40px', position: 'relative' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
          marginBottom: 14, letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          열린 방 {waitingRooms.length > 0 ? `(${waitingRooms.length})` : ''}
        </div>

        {waitingRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎵</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>열린 방이 없어요</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>방을 만들어 친구를 초대해보세요</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waitingRooms.map(([roomCode, room]) => {
              const playerCount = Object.keys(room.players ?? {}).length
              const isJoining = joiningCode === roomCode
              const color = ERA_COLORS[room.eraId] ?? ERA_COLORS['']
              const hasSelection = room.eraId && room.partId

              return (
                <div key={roomCode} style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleJoin(roomCode)}
                    disabled={!!joiningCode}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 20, padding: '18px 20px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      cursor: joiningCode ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                      opacity: joiningCode && !isJoining ? 0.5 : 1,
                      WebkitTapHighlightColor: 'transparent',
                      width: '100%',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, fontSize: 24,
                      background: `linear-gradient(135deg, ${color}33, ${color}18)`,
                      border: `1px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isJoining ? '⏳' : '🎮'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {room.hostName ?? '알 수 없음'}의 방
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                        {roomCode}
                        {hasSelection && (
                          <span style={{ marginLeft: 8, color, fontWeight: 600 }}>
                            {room.eraId} · Part.{room.partId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color,
                      background: `${color}22`, padding: '5px 10px',
                      borderRadius: 8, flexShrink: 0,
                      marginRight: isAdmin ? 36 : 0,
                    }}>
                      {playerCount}/10
                    </div>
                  </button>

                  {/* 어드민 삭제 버튼 */}
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(roomCode) }}
                      style={{
                        position: 'absolute', top: '50%', right: 16,
                        transform: 'translateY(-50%)',
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(244,63,94,0.2)',
                        border: '1px solid rgba(244,63,94,0.4)',
                        color: '#f43f5e', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
