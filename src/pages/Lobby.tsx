import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { createRoom, joinRoom } from '../lib/realtimeDB'

const ERAS = [
  { id: '2000s', label: '2000s', from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  { id: '2010s', label: '2010s', from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  { id: '2020s', label: '2020s', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
]

const PARTS = ['1', '2', '3']

type Mode = 'select' | 'create' | 'join'

export default function Lobby() {
  const navigate = useNavigate()
  const { sessionId, nickname, setNickname, setCurrentRoom } = usePlayerStore()

  const [mode, setMode] = useState<Mode>('select')
  const [inputNickname, setInputNickname] = useState(nickname)
  const [selectedEra, setSelectedEra] = useState('2000s')
  const [selectedPart, setSelectedPart] = useState('1')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const era = ERAS.find(e => e.id === selectedEra)!

  const handleCreateRoom = async () => {
    if (!inputNickname.trim()) {
      setError('닉네임을 입력해주세요')
      return
    }
    setLoading(true)
    setError('')

    try {
      setNickname(inputNickname.trim())
      const roomCode = await createRoom(sessionId, inputNickname.trim(), selectedEra, selectedPart)
      setCurrentRoom(roomCode)
      navigate(`/room/${roomCode}`)
    } catch (err) {
      setError('방 생성에 실패했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!inputNickname.trim()) {
      setError('닉네임을 입력해주세요')
      return
    }
    if (!roomCodeInput.trim()) {
      setError('방 코드를 입력해주세요')
      return
    }
    setLoading(true)
    setError('')

    try {
      setNickname(inputNickname.trim())
      const room = await joinRoom(roomCodeInput.trim().toUpperCase(), sessionId, inputNickname.trim())
      if (!room) {
        setError('존재하지 않는 방입니다')
        return
      }
      setCurrentRoom(roomCodeInput.trim().toUpperCase())
      navigate(`/room/${roomCodeInput.trim().toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 참가에 실패했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        background: `radial-gradient(ellipse at 80% 20%, rgba(${era.rgb},0.08) 0%, transparent 55%)`,
        transition: 'background 0.5s ease',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 0 24px', position: 'relative' }}>
        <button
          onClick={() => mode === 'select' ? navigate('/') : setMode('select')}
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
          {mode === 'select' ? '홈' : '뒤로'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))' }}>
            {mode === 'create' ? '🎮' : mode === 'join' ? '🚪' : '👥'}
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-1px',
            textShadow: '0 0 30px rgba(168,85,247,0.35)',
          }}>
            {mode === 'create' ? '방 만들기' : mode === 'join' ? '방 참가하기' : '멀티플레이'}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            {mode === 'create' ? '친구들과 함께 즐겨요' : mode === 'join' ? '코드를 입력하세요' : '최대 10명과 함께'}
          </p>
        </div>
      </header>

      <main style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
        {/* 닉네임 입력 (공통) */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 20, marginBottom: 16,
        }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
            닉네임
          </label>
          <input
            type="text"
            value={inputNickname}
            onChange={(e) => setInputNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={12}
            style={{
              width: '100%', padding: '14px 16px', fontSize: 16, fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, color: '#fff', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 모드 선택 */}
        {mode === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setMode('create')}
              style={{
                padding: '24px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(168,85,247,0.2)',
                display: 'flex', alignItems: 'center', gap: 16,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16, fontSize: 28,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
              }}>
                🎮
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>방 만들기</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>새로운 퀴즈 방을 만들어요</div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              style={{
                padding: '24px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.1))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(34,211,238,0.2)',
                display: 'flex', alignItems: 'center', gap: 16,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16, fontSize: 28,
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(34,211,238,0.4)',
              }}>
                🚪
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>방 참가하기</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>코드로 친구 방에 들어가요</div>
              </div>
            </button>
          </div>
        )}

        {/* 방 만들기 */}
        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 연대 선택 */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: 20,
            }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                연대 선택
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ERAS.map(e => {
                  const isActive = selectedEra === e.id
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEra(e.id)}
                      style={{
                        flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        background: isActive
                          ? `linear-gradient(135deg, ${e.from}, ${e.to})`
                          : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                        boxShadow: isActive ? `0 4px 16px rgba(${e.rgb},0.4)` : 'none',
                        transition: 'all 0.2s ease',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 파트 선택 */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: 20,
            }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                파트 선택
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PARTS.map(p => {
                  const isActive = selectedPart === p
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPart(p)}
                      style={{
                        flex: 1, padding: '12px 0', borderRadius: 12,
                        cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        background: isActive
                          ? `rgba(${era.rgb},0.25)`
                          : 'rgba(255,255,255,0.06)',
                        color: isActive ? era.from : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${isActive ? `rgba(${era.rgb},0.4)` : 'transparent'}`,
                        transition: 'all 0.2s ease',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Part.{p}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 만들기 버튼 */}
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              style={{
                padding: '18px', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
                boxShadow: `0 4px 24px rgba(${era.rgb},0.4)`,
                fontSize: 17, fontWeight: 800, color: '#fff',
                opacity: loading ? 0.6 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {loading ? '생성 중...' : '방 만들기'}
            </button>
          </div>
        )}

        {/* 방 참가하기 */}
        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: 20,
            }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                방 코드
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                maxLength={6}
                style={{
                  width: '100%', padding: '18px', fontSize: 24, fontWeight: 800,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, color: '#fff', outline: 'none',
                  textAlign: 'center', letterSpacing: 8,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading}
              style={{
                padding: '18px', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                boxShadow: '0 4px 24px rgba(34,211,238,0.4)',
                fontSize: 17, fontWeight: 800, color: '#fff',
                opacity: loading ? 0.6 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {loading ? '참가 중...' : '참가하기'}
            </button>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 14,
            background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
            color: '#f43f5e', fontSize: 14, fontWeight: 600, textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
