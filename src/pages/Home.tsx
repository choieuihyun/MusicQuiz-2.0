import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { createRoom } from '../lib/realtimeDB'
import { PARTS, partMeta } from '../lib/parts'

const TIME_OPTIONS = [10, 15, 20, 30]

export default function Home() {
  const navigate = useNavigate()
  const { sessionId, nickname, photoURL, setCurrentRoom } = usePlayerStore()

  const [selectedPartId, setSelectedPartId] = useState('')
  const [selectedTime, setSelectedTime] = useState(15)
  const [loading, setLoading] = useState(false)

  const selectedMeta = selectedPartId ? partMeta(selectedPartId) : null

  useEffect(() => {
    if (!nickname) navigate('/login')
  }, [nickname, navigate])

  const handleCreate = async () => {
    if (!selectedPartId || loading) return
    setLoading(true)
    try {
      const roomCode = await createRoom(sessionId, nickname, selectedPartId, selectedTime, photoURL)
      setCurrentRoom(roomCode)
      navigate(`/room/${roomCode}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      paddingBottom: selectedPartId ? 190 : 52,
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
      {selectedMeta && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', height: 320, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% -20%, rgba(${selectedMeta.rgb},0.14) 0%, transparent 65%)`,
          transition: 'background 0.4s ease',
        }} />
      )}

      {/* 헤더 */}
      <header className="header-enter" style={{ padding: '56px 20px 28px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.5px', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          뒤로
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, color: '#fff', letterSpacing: '-0.5px',
            textShadow: '0 0 50px rgba(168,85,247,0.5)',
            marginBottom: 6,
          }}>
            방 생성하기
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}>
            파트를 선택하세요
          </div>
        </div>
      </header>

      {/* 파트 카드 목록 */}
      <main style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {PARTS.map((part, idx) => {
          const isSelected = selectedPartId === part.id
          return (
            <button
              key={part.id}
              onClick={() => setSelectedPartId(part.id)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                border: `1px solid rgba(${part.rgb}, ${isSelected ? '0.45' : '0.15'})`,
                borderLeft: `4px solid ${isSelected ? part.from : `rgba(${part.rgb},0.35)`}`,
                borderRadius: 20, padding: '18px 20px',
                background: isSelected
                  ? `rgba(${part.rgb},0.1)`
                  : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                boxShadow: isSelected
                  ? `0 12px 36px rgba(0,0,0,0.5), 0 0 32px rgba(${part.rgb},0.22), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`,
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.25s ease',
                WebkitTapHighlightColor: 'transparent',
                animation: `fadeSlideUp 0.5s ease ${idx * 0.06}s both`,
              }}
            >
              {/* 파트 뱃지 */}
              <div
                className="era-badge"
                style={{
                  '--badge-glow': `rgba(${part.rgb},0.55)`,
                  '--badge-glow-wide': `rgba(${part.rgb},0.2)`,
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  background: `linear-gradient(145deg, ${part.from}, ${part.to})`,
                  boxShadow: `0 6px 20px rgba(${part.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.28)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                } as React.CSSProperties}
              >
                <span style={{
                  fontFamily: 'var(--font-number)',
                  fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
                }}>
                  {part.id}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '2.5px',
                  color: `rgba(${part.rgb},0.7)`, textTransform: 'uppercase', marginBottom: 4,
                }}>
                  PART
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, color: '#fff', letterSpacing: '-0.5px',
                }}>
                  {part.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 600 }}>
                  {part.subtitle}
                </div>
              </div>

              {/* 체크 / 화살표 */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: isSelected
                  ? `linear-gradient(135deg, ${part.from}, ${part.to})`
                  : `rgba(${part.rgb},0.1)`,
                border: `1px solid rgba(${part.rgb},${isSelected ? '0.5' : '0.25'})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: isSelected ? `0 2px 12px rgba(${part.rgb},0.5)` : 'none',
                transition: 'all 0.25s ease',
              }}>
                {isSelected ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.8 }}>
                    <path d="M4 2l4 4-4 4" stroke={part.from} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </main>

      {/* 하단 CTA */}
      {selectedMeta && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '16px 18px 38px',
          background: 'linear-gradient(to top, rgba(6,4,18,0.98) 65%, transparent)',
          backdropFilter: 'blur(4px)',
        }}>
          {/* 선택 요약 + 타이머 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, padding: '10px 14px',
            background: `rgba(${selectedMeta.rgb},0.08)`,
            border: `1px solid rgba(${selectedMeta.rgb},0.2)`,
            borderLeft: `3px solid ${selectedMeta.from}`,
            borderRadius: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>
              <span style={{ color: selectedMeta.from }}>Part.{selectedPartId}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedMeta.label}</span>
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: 'none',
                    background: selectedTime === t
                      ? `linear-gradient(135deg, ${selectedMeta.from}, ${selectedMeta.to})`
                      : 'rgba(255,255,255,0.07)',
                    fontFamily: 'var(--font-number)',
                    fontSize: 13, fontWeight: 700,
                    color: selectedTime === t ? '#fff' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    boxShadow: selectedTime === t ? `0 2px 10px rgba(${selectedMeta.rgb},0.4)` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: '100%', padding: '17px',
              borderRadius: 16, border: 'none',
              background: `linear-gradient(135deg, ${selectedMeta.from}, ${selectedMeta.to})`,
              boxShadow: `0 8px 36px rgba(${selectedMeta.rgb},0.5)`,
              fontFamily: 'var(--font-display)',
              fontSize: 20, color: '#fff', letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {loading ? '방 만드는 중...' : '방 만들기 →'}
          </button>
        </div>
      )}
    </div>
  )
}
