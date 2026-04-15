import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'

const ADMIN_CODE = 'MUSICQUIZ_ADMIN'

export default function Login() {
  const navigate = useNavigate()
  const { setNickname, setAdmin } = usePlayerStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState('')

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed) { setError('닉네임을 입력해주세요'); return }
    if (trimmed.length < 2) { setError('2자 이상 입력해주세요'); return }

    if (showAdmin) {
      if (!adminCode.trim()) { setAdminError('관리자 코드를 입력해주세요'); return }
      if (adminCode.trim() !== ADMIN_CODE) { setAdminError('관리자 코드가 올바르지 않습니다'); return }
      setAdmin(true)
    } else {
      setAdmin(false)
    }

    setNickname(trimmed)
    navigate('/rooms')
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 110%, rgba(99,102,241,0.12) 0%, transparent 55%)',
      }} />

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
        <div style={{
          fontSize: 64, marginBottom: 16,
          filter: 'drop-shadow(0 0 24px rgba(168,85,247,0.7))',
        }}>🎵</div>
        <h1 style={{
          margin: 0, fontSize: 36, fontWeight: 900, color: '#fff',
          letterSpacing: '-1.5px', textShadow: '0 0 40px rgba(168,85,247,0.4)',
        }}>Music Quiz</h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>
          한국 가요 가사 빈칸 맞추기
        </p>
      </div>

      <div style={{
        width: '100%', maxWidth: 380, position: 'relative',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: 28,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* 닉네임 */}
        <label style={{
          display: 'block', fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.5)', marginBottom: 10,
        }}>
          닉네임
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="사용할 닉네임을 입력하세요"
          maxLength={16}
          autoFocus
          style={{
            width: '100%', padding: '16px', fontSize: 17, fontWeight: 600,
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${error ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 14, color: '#fff', outline: 'none',
            boxSizing: 'border-box', marginBottom: 8,
          }}
        />
        {error && (
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 8, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* 관리자 코드 섹션 */}
        {showAdmin && (
          <div style={{
            marginTop: 4, marginBottom: 8,
            padding: '14px 16px',
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 12,
          }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: 'rgba(251,191,36,0.7)', marginBottom: 8,
            }}>
              🔑 관리자 코드
            </label>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => { setAdminCode(e.target.value); setAdminError('') }}
              placeholder="관리자 코드 입력"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 15, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${adminError ? 'rgba(244,63,94,0.5)' : 'rgba(251,191,36,0.2)'}`,
                borderRadius: 10, color: '#fff', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {adminError && (
              <div style={{ fontSize: 12, color: '#f87171', marginTop: 6, fontWeight: 600 }}>
                {adminError}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 20, marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setShowAdmin(!showAdmin); setAdminCode(''); setAdminError('') }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: showAdmin ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.2)',
              fontWeight: 600,
            }}
          >
            {showAdmin ? '일반 로그인으로' : '관리자 로그인'}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: showAdmin
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #a855f7, #6366f1)',
            boxShadow: showAdmin
              ? '0 4px 24px rgba(245,158,11,0.4)'
              : '0 4px 24px rgba(168,85,247,0.45)',
            fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {showAdmin ? '관리자로 시작하기 →' : '시작하기 →'}
        </button>
      </div>
    </div>
  )
}
