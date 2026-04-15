import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const eras = [
  {
    id: '2000s',
    range: '2000 – 2010',
    subtitle: '황금기 K-POP',
    tag: '00s',
    from: '#a855f7',
    to: '#6366f1',
    rgb: '168,85,247',
  },
  {
    id: '2010s',
    range: '2010 – 2020',
    subtitle: '한류 전성시대',
    tag: '10s',
    from: '#22d3ee',
    to: '#3b82f6',
    rgb: '34,211,238',
  },
  {
    id: '2020s',
    range: '2020 – 현재',
    subtitle: '지금 이 순간',
    tag: '20s',
    from: '#f472b6',
    to: '#f43f5e',
    rgb: '244,114,182',
  },
]

const PARTS = ['Part.1', 'Part.2', 'Part.3']

export default function Home() {
  const [openId, setOpenId] = useState<string | null>(null)
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* 배경 광원 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.12) 0%, transparent 55%)',
      }} />

      {/* 헤더 — 중앙 정렬 */}
      <header className="header-enter" style={{ padding: '64px 24px 36px', textAlign: 'center', position: 'relative' }}>
        {/* 상단 버튼들 */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
          {/* 멀티플레이 버튼 */}
          <button
            onClick={() => navigate('/rooms')}
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(59,130,246,0.1))',
              border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: 14, padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              color: '#22d3ee', fontSize: 13, fontWeight: 600,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 12px rgba(34,211,238,0.2)',
            }}
          >
            <span style={{ fontSize: 16 }}>👥</span>
            멀티
          </button>

          {/* 랭킹 버튼 */}
          <button
            onClick={() => navigate('/ranking')}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 16 }}>🏆</span>
            랭킹
          </button>
        </div>

        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 16,
          filter: 'drop-shadow(0 0 24px rgba(168,85,247,0.6))',
        }}>
          🎵
        </div>
        <h1 style={{
          margin: 0, fontSize: 36, fontWeight: 800, color: '#fff',
          letterSpacing: '-1.2px', lineHeight: 1.1,
          textShadow: '0 0 40px rgba(168,85,247,0.4)',
        }}>
          Music Quiz
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1px' }}>
          연대를 선택하고 퀴즈를 시작하세요
        </p>
      </header>

      {/* 카드 목록 */}
      <main style={{ padding: '0 16px 52px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        {eras.map((era, eraIdx) => {
          const isOpen = openId === era.id

          return (
            <div
              key={era.id}
              className={isOpen ? 'era-card-open' : ''}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
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
                {/* 뱃지 */}
                <div
                  className="era-badge"
                  style={{
                    '--badge-glow': `rgba(${era.rgb},0.55)`,
                    '--badge-glow-wide': `rgba(${era.rgb},0.2)`,
                    width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                    background: `linear-gradient(145deg, ${era.from}, ${era.to})`,
                    boxShadow: `0 4px 20px rgba(${era.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.25)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  } as React.CSSProperties}
                >
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.5px', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    {era.tag}
                  </span>
                </div>

                {/* 텍스트 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: `rgba(${era.rgb},0.7)`, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>
                    Era
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {era.range}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {era.subtitle}
                  </div>
                </div>

                {/* 체브론 */}
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
                  {PARTS.map((part, pIdx) => (
                    <button
                      key={part}
                      onClick={() => navigate(`/quiz/${era.id}/${pIdx + 1}`)}
                      style={{
                        width: '100%',
                        background: `linear-gradient(135deg, rgba(${era.rgb},0.1), rgba(${era.rgb},0.04))`,
                        border: `1px solid rgba(${era.rgb},0.2)`,
                        borderRadius: 16,
                        padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.3)`,
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.96)',
                        transition: `opacity 0.32s ease ${pIdx * 70}ms, transform 0.32s cubic-bezier(0.34,1.3,0.64,1) ${pIdx * 70}ms`,
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
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.88)', flex: 1 }}>
                        {part}
                      </span>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `rgba(${era.rgb},0.12)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M4 2l4 4-4 4" stroke={era.from} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
