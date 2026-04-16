import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { subscribeToRoom, leaveRoom, startGame, sendChatMessage, subscribeToChatMessages, subscribeToBubbles } from '../lib/realtimeDB'
import type { Room as RoomType, ChatMessage, Bubble } from '../lib/realtimeDB'

const ERA_META: Record<string, { from: string; to: string; rgb: string; label: string }> = {
  '2000s': { from: '#a855f7', to: '#6366f1', rgb: '168,85,247', label: '황금기 K-POP' },
  '2010s': { from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238', label: '한류 전성시대' },
  '2020s': { from: '#f472b6', to: '#f43f5e', rgb: '244,114,182', label: '지금 이 순간' },
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function Room() {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const { sessionId, nickname, photoURL, setCurrentRoom } = usePlayerStore()
  const [room, setRoom] = useState<RoomType | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; data: ChatMessage }>>([])
  const [bubbles, setBubbles] = useState<Record<string, Bubble>>({})
  const [chatInput, setChatInput] = useState('')
  const [tick, setTick] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isHost = room?.hostId === sessionId
  const players = room ? Object.entries(room.players ?? {}) : []
  const era = room ? ERA_META[room.eraId] : null

  // 1초 tick — 말풍선 자동 소멸용
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  void tick

  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      if (!roomData) {
        setCurrentRoom(null)
        navigate('/')
        return
      }
      setRoom(roomData)
      if (roomData.status === 'playing') {
        navigate(`/multi/${roomCode}`)
      }
    })
    return () => unsubscribe()
  }, [roomCode, navigate, setCurrentRoom])

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToChatMessages(roomCode, setChatMessages)
    return () => unsub()
  }, [roomCode])

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToBubbles(roomCode, setBubbles)
    return () => unsub()
  }, [roomCode])

  // 새 메시지 오면 스크롤 끝으로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleLeave = async () => {
    if (!roomCode) return
    await leaveRoom(roomCode, sessionId)
    setCurrentRoom(null)
    navigate('/')
  }

  const handleStart = async () => {
    if (!roomCode || !isHost) return
    await startGame(roomCode)
  }

  const handleSendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || !roomCode) return
    setChatInput('')
    await sendChatMessage(roomCode, sessionId, nickname, msg, photoURL)
  }

  const handleChatKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendChat()
  }

  const getBubble = (playerId: string): string | null => {
    const b = bubbles[playerId]
    if (!b) return null
    if (Date.now() - b.timestamp > 5000) return null
    return b.message
  }

  if (!room) {
    return (
      <div style={{
        minHeight: '100svh',
        background: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px',
        }}>
          로딩 중...
        </div>
      </div>
    )
  }

  const accentColor = era?.from ?? '#a855f7'
  const accentRgb = era?.rgb ?? '168,85,247'

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      paddingBottom: isHost ? 220 : 100,
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
      {era && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', height: 300, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% -20%, rgba(${era.rgb},0.12) 0%, transparent 65%)`,
        }} />
      )}

      {/* 헤더 */}
      <header style={{ padding: '56px 20px 20px', position: 'relative' }}>
        <button
          onClick={handleLeave}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          나가기
        </button>

        {/* 방 코드 */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: `rgba(${accentRgb},0.12)`,
          border: `1px solid rgba(${accentRgb},0.3)`,
          borderRadius: 10, padding: '6px 12px',
          fontFamily: 'var(--font-number)',
          fontSize: 14, fontWeight: 700, color: accentColor, letterSpacing: 2,
        }}>
          {roomCode}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34, color: '#fff', letterSpacing: '-0.5px',
            textShadow: `0 0 50px rgba(${accentRgb},0.4)`,
            marginBottom: 4,
          }}>
            대기실
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
          }}>
            게임 시작을 기다리는 중
          </div>
        </div>
      </header>

      {/* 선택된 시대/파트 배너 */}
      {era && room.partId && (
        <div style={{ padding: '0 18px 20px' }}>
          <div style={{
            padding: '16px 18px',
            background: `rgba(${era.rgb},0.08)`,
            border: `1px solid rgba(${era.rgb},0.25)`,
            borderLeft: `4px solid ${era.from}`,
            borderRadius: 18,
            boxShadow: `0 4px 24px rgba(${era.rgb},0.12), inset 0 1px 0 rgba(255,255,255,0.06)`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              boxShadow: `0 4px 16px rgba(${era.rgb},0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              🎵
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '2.5px',
                color: `rgba(${era.rgb},0.65)`, textTransform: 'uppercase', marginBottom: 4,
              }}>
                선택된 퀴즈
              </div>
              <div style={{
                fontFamily: 'var(--font-number)',
                fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
              }}>
                <span style={{ color: era.from }}>{room.eraId}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>·</span>
                Part.{room.partId}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginTop: 2,
              }}>
                {era.label} · {room.timeLimit}초 제한
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 참가자 목록 */}
      <div style={{ padding: '0 18px 20px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)', marginBottom: 12,
        }}>
          참가자 {players.length}명
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map(([playerId, player]) => {
            const isMe = playerId === sessionId
            const isPlayerHost = playerId === room.hostId
            const bubble = getBubble(playerId)
            return (
              <div key={playerId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 16,
                background: isMe ? `rgba(${accentRgb},0.1)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isMe ? `rgba(${accentRgb},0.3)` : 'rgba(255,255,255,0.07)'}`,
                borderLeft: isPlayerHost ? `3px solid ${accentColor}` : `3px solid transparent`,
              }}>
                {/* 아바타 */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: player.photoURL
                    ? 'transparent'
                    : (isMe ? `linear-gradient(135deg, ${accentColor}, rgba(99,102,241,0.8))` : 'rgba(255,255,255,0.08)'),
                  border: `2px solid ${isMe ? `rgba(${accentRgb},0.5)` : 'rgba(255,255,255,0.1)'}`,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: isMe ? `0 0 16px rgba(${accentRgb},0.3)` : 'none',
                }}>
                  {player.photoURL
                    ? <img src={player.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (isPlayerHost ? '👑' : '🎤')
                  }
                </div>

                {/* 이름 + 말풍선 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 800,
                      color: isMe ? '#fff' : 'rgba(255,255,255,0.75)',
                    }}>
                      {player.displayName}
                    </span>
                    {isMe && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: accentColor,
                        letterSpacing: '0.5px',
                      }}>나</span>
                    )}
                  </div>
                  {isPlayerHost && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                      color: 'rgba(255,255,255,0.3)', marginTop: 1, textTransform: 'uppercase',
                    }}>
                      방장
                    </div>
                  )}
                  {/* 말풍선 */}
                  {bubble && (
                    <div style={{
                      marginTop: 5,
                      display: 'inline-block',
                      background: isMe ? `rgba(${accentRgb},0.18)` : 'rgba(255,255,255,0.09)',
                      border: `1px solid ${isMe ? `rgba(${accentRgb},0.35)` : 'rgba(255,255,255,0.14)'}`,
                      borderRadius: '0 10px 10px 10px',
                      padding: '5px 10px',
                      fontSize: 12, fontWeight: 600,
                      color: isMe ? accentColor : 'rgba(255,255,255,0.8)',
                      maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      position: 'relative',
                    }}>
                      {bubble}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 채팅 섹션 */}
      <div style={{ padding: '0 18px 16px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>💬</span>
          <span>채팅</span>
        </div>

        {/* 메시지 피드 */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: `4px solid rgba(${accentRgb},0.3)`,
          borderRadius: 16,
          padding: '10px 12px',
          minHeight: 120,
          maxHeight: 220,
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {chatMessages.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'rgba(255,255,255,0.18)', fontWeight: 600,
              padding: '20px 0',
            }}>
              아직 채팅이 없어요. 먼저 인사해보세요! 👋
            </div>
          ) : (
            chatMessages.map(({ id, data }) => {
              const isMe = data.sessionId === sessionId
              return (
                <div key={id} style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 6,
                }}>
                  {/* 아바타 (타인만) */}
                  {!isMe && (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: data.photoURL ? 'transparent' : 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12,
                    }}>
                      {data.photoURL
                        ? <img src={data.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🎤'
                      }
                    </div>
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                  }}>
                    {!isMe && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)', marginBottom: 2, paddingLeft: 4,
                      }}>
                        {data.displayName}
                      </span>
                    )}
                    <div style={{
                      background: isMe
                        ? `linear-gradient(135deg, ${accentColor}cc, rgba(99,102,241,0.7))`
                        : 'rgba(255,255,255,0.08)',
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '7px 11px',
                      fontSize: 13, fontWeight: 600,
                      color: isMe ? '#fff' : 'rgba(255,255,255,0.85)',
                      wordBreak: 'break-word',
                      boxShadow: isMe ? `0 2px 12px rgba(${accentRgb},0.3)` : 'none',
                    }}>
                      {data.message}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: 'rgba(255,255,255,0.2)', marginTop: 2,
                      paddingInline: 4,
                    }}>
                      {formatTime(data.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 비호스트 대기 메시지 */}
      {!isHost && (
        <div style={{
          textAlign: 'center', padding: '4px 24px 12px',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
          color: 'rgba(255,255,255,0.2)',
        }}>
          방장이 게임을 시작할 때까지 기다려주세요
        </div>
      )}

      {/* 고정 채팅 입력 */}
      <div style={{
        position: 'fixed', bottom: isHost ? 108 : 16, left: 0, right: 0, zIndex: 40,
        padding: '0 18px',
      }}>
        <div style={{
          display: 'flex', gap: 8,
          background: 'rgba(10,5,28,0.92)',
          border: `1px solid rgba(${accentRgb},0.22)`,
          borderRadius: 16,
          padding: '8px 8px 8px 14px',
          backdropFilter: 'blur(24px)',
          boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(${accentRgb},0.08)`,
        }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleChatKey}
            placeholder="메시지 입력..."
            maxLength={80}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 13, fontWeight: 600, color: '#fff',
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={handleSendChat}
            disabled={!chatInput.trim()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: chatInput.trim()
                ? `linear-gradient(135deg, ${accentColor}, rgba(99,102,241,0.9))`
                : 'rgba(255,255,255,0.07)',
              cursor: chatInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
              boxShadow: chatInput.trim() ? `0 2px 12px rgba(${accentRgb},0.4)` : 'none',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* 게임 시작 버튼 (호스트만) */}
      {isHost && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '16px 18px 38px',
          background: 'linear-gradient(to top, rgba(6,4,18,0.98) 65%, transparent)',
        }}>
          <button
            onClick={handleStart}
            style={{
              width: '100%', padding: '17px',
              borderRadius: 16, border: 'none',
              background: era
                ? `linear-gradient(135deg, ${era.from}, ${era.to})`
                : 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: era
                ? `0 8px 36px rgba(${era.rgb},0.5)`
                : '0 8px 36px rgba(168,85,247,0.5)',
              fontFamily: 'var(--font-display)',
              fontSize: 20, color: '#fff', letterSpacing: '0.5px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            게임 시작 ({players.length}명) →
          </button>
        </div>
      )}
    </div>
  )
}
