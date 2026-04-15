import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { subscribeToRoom, leaveRoom, deleteRoom, startGame, updateRoomSelection } from '../lib/realtimeDB'
import type { Room as RoomType } from '../lib/realtimeDB'

const eras = [
  { id: '2000s', range: '2000 – 2010', subtitle: '황금기 K-POP', tag: '00s', from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  { id: '2010s', range: '2010 – 2020', subtitle: '한류 전성시대', tag: '10s', from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  { id: '2020s', range: '2020 – 현재', subtitle: '지금 이 순간', tag: '20s', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
]
const PARTS = ['Part.1', 'Part.2', 'Part.3']

export default function Room() {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const { sessionId, setCurrentRoom } = usePlayerStore()

  const [room, setRoom] = useState<RoomType | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const isHost = room?.hostId === sessionId
  const selectedEraId = room?.eraId ?? ''
  const selectedPartId = room?.partId ?? ''
  const players = room ? Object.entries(room.players ?? {}) : []
  const canStart = isHost && !!selectedEraId && !!selectedPartId
  const selectedEra = eras.find(e => e.id === selectedEraId)

  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      if (!roomData) {
        setCurrentRoom(null)
        navigate('/rooms')
        return
      }
      setRoom(roomData)
      if (roomData.status === 'playing') {
        navigate(`/multi/${roomCode}`)
      }
    })
    return () => unsubscribe()
  }, [roomCode, navigate, setCurrentRoom])

  // 호스트가 연대 선택 시 아코디언 자동 오픈
  useEffect(() => {
    if (selectedEraId) setOpenId(selectedEraId)
  }, [selectedEraId])

  const handleLeave = async () => {
    if (!roomCode) return
    await leaveRoom(roomCode, sessionId)
    setCurrentRoom(null)
    navigate('/rooms')
  }

  const handlePartSelect = async (eraId: string, partIdx: number) => {
    if (!isHost || !roomCode) return
    await updateRoomSelection(roomCode, eraId, String(partIdx + 1))
  }

  const handleStart = async () => {
    if (!roomCode || !canStart) return
    await startGame(roomCode)
  }

  if (!room) {
    return (
      <div style={{
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)', fontSize: 16,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        로딩 중...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingBottom: canStart ? 108 : 40,
    }}>
      {/* 배경 광원 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.12) 0%, transparent 55%)',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 24px 24px', textAlign: 'center', position: 'relative' }}>
        {/* 나가기 */}
        <button
          onClick={handleLeave}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          나가기
        </button>

        {/* 방 코드 */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 10, padding: '6px 12px',
          fontSize: 13, fontWeight: 800, color: '#a855f7', letterSpacing: 2,
        }}>
          {roomCode}
        </div>

        <div style={{
          fontSize: 52, lineHeight: 1, marginBottom: 16,
          filter: 'drop-shadow(0 0 24px rgba(168,85,247,0.6))',
        }}>🎵</div>
        <h1 style={{
          margin: 0, fontSize: 36, fontWeight: 800, color: '#fff',
          letterSpacing: '-1.2px', lineHeight: 1.1,
          textShadow: '0 0 40px rgba(168,85,247,0.4)',
        }}>
          Music Quiz
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>
          {isHost ? '연대와 파트를 선택하세요' : '방장이 연대와 파트를 선택 중이에요'}
        </p>
      </header>

      {/* 참가자 스트립 */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {players.map(([playerId, player]) => {
            const isMe = playerId === sessionId
            const isPlayerHost = playerId === room.hostId
            return (
              <div key={playerId} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: isMe ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isMe ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <span style={{ fontSize: 13 }}>{isPlayerHost ? '👑' : '🎤'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                  {player.displayName}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 연대 카드 목록 */}
      <main style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        {eras.map((era, eraIdx) => {
          const isOpen = openId === era.id
          const isSelectedEra = selectedEraId === era.id

          return (
            <div
              key={era.id}
              style={{
                borderRadius: 24, overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(${era.rgb}, ${isOpen ? '0.4' : '0.15'})`,
                boxShadow: isOpen
                  ? `0 0 0 1px rgba(${era.rgb},0.15), 0 20px 60px rgba(0,0,0,0.7), 0 8px 30px rgba(${era.rgb},0.2), inset 0 1px 0 rgba(255,255,255,0.1)`
                  : `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)`,
                transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
                animationDelay: `${eraIdx * 0.5}s`,
              }}
            >
              {/* 상단 그라데이션 바 */}
              <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${era.from}, ${era.to})`,
                boxShadow: `0 0 12px rgba(${era.rgb},0.6)`,
              }} />

              {/* 카드 헤더 */}
              <button
                onClick={() => setOpenId(isOpen ? null : era.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 22px',
                  WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                  background: `linear-gradient(145deg, ${era.from}, ${era.to})`,
                  boxShadow: `0 4px 20px rgba(${era.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.5px', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    {era.tag}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: `rgba(${era.rgb},0.7)`, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>
                    Era
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {era.range}
                    {isSelectedEra && selectedPartId && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: era.from, marginLeft: 8 }}>
                        Part.{selectedPartId} ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {era.subtitle}
                  </div>
                </div>

                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `rgba(${era.rgb},0.1)`,
                  border: `1px solid rgba(${era.rgb},0.25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: `rgba(${era.rgb},0.9)`,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {/* 구분선 */}
              <div style={{
                height: 1, margin: '0 22px',
                background: `linear-gradient(90deg, transparent, rgba(${era.rgb},0.4), transparent)`,
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }} />

              {/* 아코디언 */}
              <div style={{
                maxHeight: isOpen ? 300 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.44s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{ padding: '14px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PARTS.map((part, pIdx) => {
                    const isSelectedPart = isSelectedEra && selectedPartId === String(pIdx + 1)
                    return (
                      <button
                        key={part}
                        onClick={() => handlePartSelect(era.id, pIdx)}
                        disabled={!isHost}
                        style={{
                          width: '100%',
                          background: isSelectedPart
                            ? `linear-gradient(135deg, rgba(${era.rgb},0.22), rgba(${era.rgb},0.1))`
                            : `linear-gradient(135deg, rgba(${era.rgb},0.1), rgba(${era.rgb},0.04))`,
                          border: isSelectedPart
                            ? `1.5px solid rgba(${era.rgb},0.6)`
                            : `1px solid rgba(${era.rgb},0.2)`,
                          borderRadius: 16, padding: '14px 18px',
                          display: 'flex', alignItems: 'center', gap: 14,
                          cursor: isHost ? 'pointer' : 'default',
                          WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                          boxShadow: isSelectedPart
                            ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(${era.rgb},0.25)`
                            : `inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.3)`,
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.96)',
                          transition: `opacity 0.32s ease ${pIdx * 70}ms, transform 0.32s cubic-bezier(0.34,1.3,0.64,1) ${pIdx * 70}ms, background 0.2s, border-color 0.2s`,
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: `linear-gradient(145deg, ${era.from}, ${era.to})`,
                          boxShadow: `0 3px 12px rgba(${era.rgb},0.45)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: '#fff',
                        }}>
                          {pIdx + 1}
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: isSelectedPart ? '#fff' : 'rgba(255,255,255,0.88)', flex: 1 }}>
                          {part}
                        </span>
                        {isSelectedPart ? (
                          <span style={{ fontSize: 18, color: era.from }}>✓</span>
                        ) : (
                          <div style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: `rgba(${era.rgb},0.12)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M4 2l4 4-4 4" stroke={era.from} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* 비호스트 대기 메시지 */}
      {!isHost && !canStart && (
        <div style={{ textAlign: 'center', padding: '28px 0 0', color: 'rgba(255,255,255,0.22)', fontSize: 13 }}>
          방장이 연대와 파트를 선택할 때까지 기다려주세요
        </div>
      )}

      {/* 게임 시작 버튼 (호스트 + 선택 완료 시) */}
      {canStart && selectedEra && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '16px 20px 36px',
          background: 'linear-gradient(to top, rgba(6,4,18,0.97) 65%, transparent)',
        }}>
          <button
            onClick={handleStart}
            style={{
              width: '100%', padding: '18px', borderRadius: 18, border: 'none',
              background: `linear-gradient(135deg, ${selectedEra.from}, ${selectedEra.to})`,
              boxShadow: `0 8px 32px rgba(${selectedEra.rgb},0.5)`,
              fontSize: 18, fontWeight: 800, color: '#fff', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            게임 시작 ({players.length}명) →
          </button>
        </div>
      )}
    </div>
  )
}
