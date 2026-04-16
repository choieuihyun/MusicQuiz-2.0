import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { joinRoom, deleteRoom, subscribeToRooms } from '../lib/realtimeDB'
import type { Room } from '../lib/realtimeDB'

const ERA_COLORS: Record<string, { from: string; to: string; rgb: string }> = {
  '2000s': { from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  '2010s': { from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  '2020s': { from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
  '':      { from: 'rgba(255,255,255,0.35)', to: 'rgba(255,255,255,0.2)', rgb: '255,255,255' },
}

export default function Rooms() {
  const navigate = useNavigate()
  const { sessionId, nickname, photoURL, isAdmin, setCurrentRoom } = usePlayerStore()
  const [rooms, setRooms] = useState<Record<string, Room>>({})
  const [joiningCode, setJoiningCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!nickname) { navigate('/login'); return }
    const unsubscribe = subscribeToRooms(setRooms)
    return () => unsubscribe()
  }, [nickname, navigate])

  const handleJoin = async (roomCode: string) => {
    if (joiningCode) return
    setJoiningCode(roomCode); setError('')
    try {
      const room = await joinRoom(roomCode, sessionId, nickname, photoURL)
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
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 20px 24px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700,
            WebkitTapHighlightColor: 'transparent', letterSpacing: '0.5px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          뒤로
        </button>

        <div style={{ paddingTop: 8 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4,
            textShadow: '0 0 50px rgba(34,211,238,0.3)',
          }}>
            방 참여하기
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}>
            참여할 방을 선택하세요
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(244,63,94,0.12)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderLeft: '3px solid #f43f5e',
            color: '#f87171', fontSize: 13, fontWeight: 700,
          }}>
            ⚠ {error}
          </div>
        )}
      </header>

      <main style={{ padding: '0 18px 48px', position: 'relative' }}>
        {/* 카운트 레이블 */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)', marginBottom: 12,
        }}>
          열린 방 {waitingRooms.length > 0 ? `(${waitingRooms.length})` : ''}
        </div>

        {waitingRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.4))' }}>🎵</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, color: 'rgba(255,255,255,0.4)', marginBottom: 8,
            }}>
              열린 방이 없어요
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.2)', marginBottom: 24 }}>
              방을 만들어 친구를 초대해보세요
            </div>
            <button
              onClick={() => navigate('/create')}
              style={{
                padding: '12px 28px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                fontFamily: 'var(--font-display)',
                fontSize: 16, color: '#fff', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(168,85,247,0.4)',
                letterSpacing: '0.5px',
              }}
            >
              방 만들러 가기 →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waitingRooms.map(([roomCode, room]) => {
              const playerCount = Object.keys(room.players ?? {}).length
              const isJoining = joiningCode === roomCode
              const eraColor = ERA_COLORS[room.eraId] ?? ERA_COLORS['']
              const hasSelection = !!(room.eraId && room.partId)

              return (
                <div key={roomCode} style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleJoin(roomCode)}
                    disabled={!!joiningCode}
                    style={{
                      width: '100%',
                      background: hasSelection
                        ? `rgba(${eraColor.rgb},0.06)`
                        : 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid rgba(${eraColor.rgb},0.18)`,
                      borderLeft: `4px solid ${hasSelection ? eraColor.from : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: 18, padding: '0',
                      cursor: joiningCode ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                      opacity: joiningCode && !isJoining ? 0.45 : 1,
                      WebkitTapHighlightColor: 'transparent',
                      overflow: 'hidden',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* 아이콘 */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 13, fontSize: 20, flexShrink: 0,
                        background: hasSelection
                          ? `linear-gradient(135deg, rgba(${eraColor.rgb},0.3), rgba(${eraColor.rgb},0.1))`
                          : 'rgba(255,255,255,0.07)',
                        border: `1px solid rgba(${eraColor.rgb},0.25)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isJoining ? '⏳' : '🎮'}
                      </div>

                      {/* 방 정보 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                          {room.hostName ?? '알 수 없음'}의 방
                        </div>
                        {hasSelection ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: 'var(--font-number)',
                              fontSize: 12, fontWeight: 700, color: eraColor.from,
                              background: `rgba(${eraColor.rgb},0.15)`,
                              padding: '2px 8px', borderRadius: 6,
                            }}>
                              {room.eraId}
                            </span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                              Part.{room.partId}
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-number)',
                              fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1,
                            }}>
                              · {roomCode}
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            fontFamily: 'var(--font-number)',
                            fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1,
                          }}>
                            {roomCode} · 파트 선택 중
                          </div>
                        )}
                      </div>

                      {/* 인원 */}
                      <div style={{
                        fontFamily: 'var(--font-number)',
                        fontSize: 14, fontWeight: 700, color: eraColor.from,
                        background: `rgba(${eraColor.rgb},0.12)`,
                        padding: '5px 10px', borderRadius: 8, flexShrink: 0,
                        marginRight: isAdmin ? 38 : 0,
                        letterSpacing: '0.5px',
                      }}>
                        {playerCount}/10
                      </div>
                    </div>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(roomCode) }}
                      style={{
                        position: 'absolute', top: '50%', right: 16,
                        transform: 'translateY(-50%)',
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(244,63,94,0.15)',
                        border: '1px solid rgba(244,63,94,0.35)',
                        color: '#f43f5e', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
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
