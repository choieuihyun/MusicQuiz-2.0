import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { subscribeToRoom, leaveRoom, startGame } from '../lib/realtimeDB'
import type { Room as RoomType } from '../lib/realtimeDB'

const ERAS: Record<string, { label: string; from: string; to: string; rgb: string }> = {
  '2000s': { label: '2000s', from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  '2010s': { label: '2010s', from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  '2020s': { label: '2020s', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
}

export default function Room() {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const { sessionId, setCurrentRoom } = usePlayerStore()

  const [room, setRoom] = useState<RoomType | null>(null)
  const [copied, setCopied] = useState(false)

  const era = room ? ERAS[room.eraId] : ERAS['2000s']
  const isHost = room?.hostId === sessionId
  const players = room ? Object.entries(room.players) : []

  useEffect(() => {
    if (!roomCode) return

    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      if (!roomData) {
        // 방이 삭제됨
        setCurrentRoom(null)
        navigate('/lobby')
        return
      }
      setRoom(roomData)

      // 게임 시작되면 퀴즈 화면으로 이동
      if (roomData.status === 'playing') {
        navigate(`/multi/${roomCode}`)
      }
    })

    return () => unsubscribe()
  }, [roomCode, navigate, setCurrentRoom])

  const handleLeave = async () => {
    if (!roomCode) return
    await leaveRoom(roomCode, sessionId)
    setCurrentRoom(null)
    navigate('/lobby')
  }

  const handleStart = async () => {
    if (!roomCode || !isHost) return
    await startGame(roomCode)
  }

  const handleCopyCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) {
    return (
      <div style={{
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)', fontSize: 16,
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
      padding: '0 16px',
    }}>
      {/* 배경 광원 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 80% 20%, rgba(${era.rgb},0.1) 0%, transparent 55%)`,
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 0 24px', position: 'relative' }}>
        <button
          onClick={handleLeave}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
            marginBottom: 28, WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          나가기
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12, filter: `drop-shadow(0 0 20px rgba(${era.rgb},0.6))` }}>
            🎵
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-1px',
            textShadow: `0 0 30px rgba(${era.rgb},0.35)`,
          }}>
            대기실
          </h1>
        </div>
      </header>

      <main style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
        {/* 방 코드 */}
        <div
          onClick={handleCopyCode}
          style={{
            background: `linear-gradient(135deg, rgba(${era.rgb},0.15), rgba(${era.rgb},0.05))`,
            border: `1px solid rgba(${era.rgb},0.3)`,
            borderRadius: 20, padding: '20px 24px', marginBottom: 16,
            textAlign: 'center', cursor: 'pointer',
            boxShadow: `0 4px 24px rgba(${era.rgb},0.15)`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            방 코드 (탭해서 복사)
          </div>
          <div style={{
            fontSize: 36, fontWeight: 800, letterSpacing: 6, color: '#fff',
            textShadow: `0 0 20px rgba(${era.rgb},0.5)`,
          }}>
            {roomCode}
          </div>
          {copied && (
            <div style={{ fontSize: 13, color: era.from, marginTop: 8, fontWeight: 600 }}>
              복사됨!
            </div>
          )}
        </div>

        {/* 퀴즈 정보 */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16,
        }}>
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>연대</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: era.from }}>{room.eraId}</div>
          </div>
          <div style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>파트</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: era.from }}>Part.{room.partId}</div>
          </div>
        </div>

        {/* 참가자 리스트 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 20, marginBottom: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>참가자</span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: era.from,
              background: `rgba(${era.rgb},0.15)`, padding: '4px 10px', borderRadius: 8,
            }}>
              {players.length}/10
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map(([playerId, player]) => {
              const isMe = playerId === sessionId
              const isPlayerHost = playerId === room.hostId

              return (
                <div
                  key={playerId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 14,
                    background: isMe ? `rgba(${era.rgb},0.12)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMe ? `rgba(${era.rgb},0.25)` : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  {/* 아바타 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isPlayerHost
                      ? `linear-gradient(135deg, ${era.from}, ${era.to})`
                      : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: isPlayerHost ? `0 3px 12px rgba(${era.rgb},0.4)` : 'none',
                  }}>
                    {isPlayerHost ? '👑' : '🎤'}
                  </div>

                  {/* 닉네임 */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      color: isMe ? '#fff' : 'rgba(255,255,255,0.8)',
                    }}>
                      {player.displayName}
                      {isMe && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: era.from,
                          marginLeft: 8, opacity: 0.8,
                        }}>
                          (나)
                        </span>
                      )}
                    </div>
                    {isPlayerHost && (
                      <div style={{ fontSize: 11, color: era.from, fontWeight: 600, marginTop: 2 }}>
                        방장
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 시작 버튼 (호스트만) */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 1}
            style={{
              width: '100%', padding: '18px', borderRadius: 16, border: 'none',
              cursor: players.length < 1 ? 'not-allowed' : 'pointer',
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              boxShadow: `0 4px 24px rgba(${era.rgb},0.4)`,
              fontSize: 17, fontWeight: 800, color: '#fff',
              opacity: players.length < 1 ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            게임 시작
          </button>
        ) : (
          <div style={{
            textAlign: 'center', padding: '18px',
            color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 600,
          }}>
            방장이 게임을 시작할 때까지 기다려주세요...
          </div>
        )}
      </main>
    </div>
  )
}
