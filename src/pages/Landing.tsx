import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'

export default function Landing() {
  const navigate = useNavigate()
  const { nickname, photoURL } = usePlayerStore()

  useEffect(() => {
    if (!nickname) navigate('/login')
  }, [nickname, navigate])

  if (!nickname) return null

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 광원 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
      <div style={{
        position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 24px 28px', textAlign: 'center', position: 'relative' }}>
        {/* 랭킹 버튼 */}
        <button
          onClick={() => navigate('/ranking')}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            color: 'rgba(255,255,255,0.5)', fontSize: 12,
            fontFamily: 'var(--font-body)', fontWeight: 700,
            letterSpacing: '0.5px', backdropFilter: 'blur(12px)',
          }}
        >
          🏆 <span>랭킹</span>
        </button>

        {/* 타이틀 */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 48, lineHeight: 1, color: '#fff',
          letterSpacing: '-1px', marginBottom: 10,
          textShadow: '0 0 60px rgba(168,85,247,0.55), 0 0 120px rgba(168,85,247,0.15)',
        }}>
          MUSIC QUIZ
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase',
          color: 'rgba(168,85,247,0.6)',
        }}>
          한국 가요 가사 빈칸 맞추기
        </div>
      </header>

      {/* 프로필 카드 */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '3px solid rgba(168,85,247,0.6)',
          borderRadius: 16,
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: photoURL ? 'transparent' : 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(99,102,241,0.3))',
            border: '2px solid rgba(168,85,247,0.4)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168,85,247,0.25)',
          }}>
            {photoURL
              ? <img src={photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22 }}>🎤</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 900, color: '#fff',
            }}>
              {nickname}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)', marginTop: 2,
            }}>
              퀴즈 참가자
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
              padding: '4px 8px',
            }}
          >
            변경
          </button>
        </div>
      </div>

      {/* 메인 버튼 */}
      <main style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* 방 생성하기 */}
        <button
          onClick={() => navigate('/create')}
          style={{
            width: '100%', padding: '0',
            background: 'rgba(168,85,247,0.07)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderLeft: '4px solid #a855f7',
            borderRadius: 20,
            cursor: 'pointer', textAlign: 'left',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.07)',
            WebkitTapHighlightColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: '0 6px 24px rgba(168,85,247,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              🎮
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, color: '#fff', letterSpacing: '0.5px', marginBottom: 6,
              }}>
                방 생성하기
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
              }}>
                시대·파트를 선택하고 새 방을 만들어요
              </div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'rgba(168,85,247,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 2l6 5-6 5" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </button>

        {/* 방 참여하기 */}
        <button
          onClick={() => navigate('/rooms')}
          style={{
            width: '100%', padding: '0',
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderLeft: '4px solid #22d3ee',
            borderRadius: 20,
            cursor: 'pointer', textAlign: 'left',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(34,211,238,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
            WebkitTapHighlightColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              boxShadow: '0 6px 24px rgba(34,211,238,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              👥
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, color: '#fff', letterSpacing: '0.5px', marginBottom: 6,
              }}>
                방 참여하기
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
              }}>
                열린 방 목록에서 참여할 방을 골라요
              </div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'rgba(34,211,238,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 2l6 5-6 5" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </button>
      </main>

      <div style={{ height: 52 }} />
    </div>
  )
}
