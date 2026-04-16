import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { createRoom } from '../lib/realtimeDB'

const eras = [
  { id: '2000s', range: '2000 – 2010', subtitle: '황금기 K-POP', tag: '00s', from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  { id: '2010s', range: '2010 – 2020', subtitle: '한류 전성시대', tag: '10s', from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  { id: '2020s', range: '2020 – 현재', subtitle: '지금 이 순간', tag: '20s', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
]

const PARTS = ['Part.1', 'Part.2', 'Part.3']
const TIME_OPTIONS = [10, 15, 20, 30]

export default function Home() {
  const navigate = useNavigate()
  const { sessionId, nickname, photoURL, setCurrentRoom } = usePlayerStore()

  const [openId, setOpenId] = useState<string | null>(null)
  const [selectedEraId, setSelectedEraId] = useState('')
  const [selectedPartId, setSelectedPartId] = useState('')
  const [selectedTime, setSelectedTime] = useState(15)
  const [loading, setLoading] = useState(false)

  const selectedEra = eras.find(e => e.id === selectedEraId)

  useEffect(() => {
    if (!nickname) navigate('/login')
  }, [nickname, navigate])

  const handlePartSelect = (eraId: string, partIdx: number) => {
    setSelectedEraId(eraId)
    setSelectedPartId(String(partIdx + 1))
  }

  const handleCreate = async () => {
    if (!selectedEraId || !selectedPartId || loading) return
    setLoading(true)
    try {
      const roomCode = await createRoom(sessionId, nickname, selectedEraId, selectedPartId, selectedTime, photoURL)
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
      paddingBottom: selectedEraId && selectedPartId ? 190 : 52,
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />

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
            연대와 파트를 선택하세요
          </div>
        </div>
      </header>

      {/* 연대 카드 목록 */}
      <main style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {eras.map((era, eraIdx) => {
          const isOpen = openId === era.id
          const isSelectedEra = selectedEraId === era.id

          return (
            <div
              key={era.id}
              className={isOpen ? 'era-card-open' : ''}
              style={{
                borderRadius: 20, overflow: 'hidden',
                background: isOpen
                  ? `rgba(${era.rgb},0.07)`
                  : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: `1px solid rgba(${era.rgb}, ${isOpen ? '0.35' : '0.12'})`,
                borderLeft: `4px solid ${isOpen ? era.from : `rgba(${era.rgb},0.3)`}`,
                boxShadow: isOpen
                  ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(${era.rgb},0.15), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                transition: 'all 0.35s ease',
                animationDelay: `${eraIdx * 0.5}s`,
              }}
            >
              {/* 헤더 버튼 */}
              <button
                onClick={() => setOpenId(isOpen ? null : era.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px',
                  WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                }}
              >
                {/* 연대 뱃지 */}
                <div
                  className="era-badge"
                  style={{
                    '--badge-glow': `rgba(${era.rgb},0.55)`,
                    '--badge-glow-wide': `rgba(${era.rgb},0.2)`,
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(145deg, ${era.from}, ${era.to})`,
                    boxShadow: `0 4px 20px rgba(${era.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  } as React.CSSProperties}
                >
                  <span style={{
                    fontFamily: 'var(--font-number)',
                    fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '0.5px',
                  }}>
                    {era.tag}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '2.5px',
                    color: `rgba(${era.rgb},0.65)`, textTransform: 'uppercase', marginBottom: 4,
                  }}>
                    ERA
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-number)',
                    fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
                  }}>
                    {era.range}
                    {isSelectedEra && selectedPartId && (
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12, fontWeight: 700, color: era.from, marginLeft: 10,
                      }}>
                        Part.{selectedPartId} ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 600 }}>
                    {era.subtitle}
                  </div>
                </div>

                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `rgba(${era.rgb},0.1)`,
                  border: `1px solid rgba(${era.rgb},0.25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: `rgba(${era.rgb},0.9)`,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {/* 구분선 */}
              <div style={{
                height: 1, margin: '0 20px',
                background: `linear-gradient(90deg, transparent, rgba(${era.rgb},0.4), transparent)`,
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }} />

              {/* 파트 목록 */}
              <div style={{
                maxHeight: isOpen ? 280 : 0, overflow: 'hidden',
                transition: 'max-height 0.42s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{ padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PARTS.map((part, pIdx) => {
                    const isSelectedPart = isSelectedEra && selectedPartId === String(pIdx + 1)
                    return (
                      <button
                        key={part}
                        onClick={() => handlePartSelect(era.id, pIdx)}
                        style={{
                          width: '100%',
                          background: isSelectedPart
                            ? `rgba(${era.rgb},0.18)`
                            : `rgba(${era.rgb},0.06)`,
                          border: isSelectedPart
                            ? `1px solid rgba(${era.rgb},0.6)`
                            : `1px solid rgba(${era.rgb},0.15)`,
                          borderLeft: `3px solid ${isSelectedPart ? era.from : `rgba(${era.rgb},0.3)`}`,
                          borderRadius: 14, padding: '13px 16px',
                          display: 'flex', alignItems: 'center', gap: 14,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                          boxShadow: isSelectedPart
                            ? `0 4px 20px rgba(${era.rgb},0.2), inset 0 1px 0 rgba(255,255,255,0.08)`
                            : 'none',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                          transition: `opacity 0.3s ease ${pIdx * 60}ms, transform 0.3s cubic-bezier(0.34,1.2,0.64,1) ${pIdx * 60}ms, background 0.2s, border-color 0.2s`,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: `linear-gradient(145deg, ${era.from}, ${era.to})`,
                          boxShadow: `0 3px 12px rgba(${era.rgb},0.4)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-number)',
                          fontSize: 14, fontWeight: 900, color: '#fff',
                        }}>
                          {pIdx + 1}
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: isSelectedPart ? '#fff' : 'rgba(255,255,255,0.75)',
                          flex: 1,
                        }}>
                          {part}
                        </span>
                        {isSelectedPart
                          ? <span style={{ fontSize: 16, color: era.from }}>✓</span>
                          : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4 }}>
                              <path d="M4 2l4 4-4 4" stroke={era.from} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )
                        }
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* 하단 CTA */}
      {selectedEra && selectedPartId && (
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
            background: `rgba(${selectedEra.rgb},0.08)`,
            border: `1px solid rgba(${selectedEra.rgb},0.2)`,
            borderLeft: `3px solid ${selectedEra.from}`,
            borderRadius: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>
              <span style={{ color: selectedEra.from }}>{selectedEra.id}</span>
              {' · '}
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Part.{selectedPartId}</span>
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: 'none',
                    background: selectedTime === t
                      ? `linear-gradient(135deg, ${selectedEra.from}, ${selectedEra.to})`
                      : 'rgba(255,255,255,0.07)',
                    fontFamily: 'var(--font-number)',
                    fontSize: 13, fontWeight: 700,
                    color: selectedTime === t ? '#fff' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    boxShadow: selectedTime === t ? `0 2px 10px rgba(${selectedEra.rgb},0.4)` : 'none',
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
              background: `linear-gradient(135deg, ${selectedEra.from}, ${selectedEra.to})`,
              boxShadow: `0 8px 36px rgba(${selectedEra.rgb},0.5)`,
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
