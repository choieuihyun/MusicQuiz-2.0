import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import { usePlayerStore } from '../store/playerStore'
import { registerNickname, releaseNickname } from '../lib/realtimeDB'

const ADMIN_CODE = 'MUSICQUIZ_ADMIN'

export default function Login() {
  const navigate = useNavigate()
  const { sessionId, nickname: prevNickname, setNickname, setPhotoURL, setAdmin } = usePlayerStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed) { setError('닉네임을 입력해주세요'); return }
    if (trimmed.length < 2) { setError('2자 이상 입력해주세요'); return }

    if (showAdmin) {
      if (!adminCode.trim()) { setAdminError('관리자 코드를 입력해주세요'); return }
      if (adminCode.trim() !== ADMIN_CODE) { setAdminError('관리자 코드가 올바르지 않습니다'); return }
    }

    setLoading(true)
    try {
      const result = await registerNickname(trimmed, sessionId)
      if (result === 'taken') {
        setError('이미 사용 중인 닉네임이에요')
        return
      }

      if (prevNickname && prevNickname !== trimmed) {
        await releaseNickname(prevNickname)
      }

      let url = ''
      if (photoFile) {
        try {
          const fileRef = storageRef(storage, `profiles/${sessionId}`)
          await uploadBytes(fileRef, photoFile)
          url = await getDownloadURL(fileRef)
          console.log('[프로필 업로드 성공]', url)
        } catch (uploadErr) {
          console.error('[프로필 업로드 실패]', uploadErr)
          setError('프로필 사진 업로드에 실패했어요 (Storage 규칙 확인)')
          return
        }
      }

      setAdmin(showAdmin)
      setNickname(trimmed)
      setPhotoURL(url)
      navigate('/')
    } catch (err) {
      console.error('[로그인 에러]', err)
      setError('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 광원 레이어 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'var(--bg-accent)',
      }} />
      <div style={{
        position: 'fixed', top: '60%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
      }} />

      {/* 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 52, lineHeight: 1, color: '#fff',
          letterSpacing: '-1px',
          textShadow: '0 0 60px rgba(168,85,247,0.6), 0 0 120px rgba(168,85,247,0.2)',
          marginBottom: 8,
        }}>
          MUSIC QUIZ
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase',
          color: 'rgba(168,85,247,0.7)',
        }}>
          한국 가요 가사 빈칸 맞추기
        </div>
      </div>

      {/* 카드 */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 32px 80px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        {/* 상단 컬러 바 */}
        <div style={{
          height: 3,
          background: showAdmin
            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
            : 'linear-gradient(90deg, #a855f7, #6366f1)',
          boxShadow: showAdmin
            ? '0 0 16px rgba(245,158,11,0.6)'
            : '0 0 16px rgba(168,85,247,0.6)',
        }} />

        <div style={{ padding: '28px 28px 32px' }}>
          {/* 프로필 사진 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 88, height: 88, borderRadius: '50%',
                background: photoPreview
                  ? 'transparent'
                  : 'radial-gradient(circle at 35% 35%, rgba(168,85,247,0.25), rgba(99,102,241,0.1))',
                border: `2px dashed ${photoPreview ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden',
                boxShadow: photoPreview ? '0 0 28px rgba(168,85,247,0.4)' : '0 0 20px rgba(168,85,247,0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 30, opacity: 0.45 }}>🎤</span>
              }
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '1px',
              color: 'rgba(255,255,255,0.25)', marginTop: 10, textTransform: 'uppercase',
            }}>
              {photoPreview ? '사진 변경' : '프로필 사진 (선택)'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* 닉네임 */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)', marginBottom: 8,
          }}>
            닉네임
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="사용할 닉네임을 입력하세요"
            maxLength={16}
            autoFocus
            style={{
              width: '100%', padding: '15px 16px',
              fontSize: 16, fontWeight: 700,
              fontFamily: 'var(--font-body)',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${error ? 'rgba(244,63,94,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, color: '#fff', outline: 'none',
              boxSizing: 'border-box', marginBottom: 8,
              transition: 'border-color 0.2s',
            }}
          />
          {error && (
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#f87171',
              marginBottom: 8, letterSpacing: '0.3px',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* 관리자 코드 */}
          {showAdmin && (
            <div style={{
              marginTop: 4, marginBottom: 8,
              padding: '14px 16px',
              background: 'rgba(251,191,36,0.05)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '2px',
                color: 'rgba(251,191,36,0.6)', marginBottom: 8, textTransform: 'uppercase',
              }}>
                🔑 관리자 코드
              </div>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => { setAdminCode(e.target.value); setAdminError('') }}
                placeholder="관리자 코드 입력"
                style={{
                  width: '100%', padding: '12px 14px',
                  fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${adminError ? 'rgba(244,63,94,0.5)' : 'rgba(251,191,36,0.2)'}`,
                  borderRadius: 10, color: '#fff', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {adminError && (
                <div style={{ fontSize: 12, color: '#f87171', marginTop: 6, fontWeight: 700 }}>
                  {adminError}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0 20px' }}>
            <button
              onClick={() => { setShowAdmin(!showAdmin); setAdminCode(''); setAdminError('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                color: showAdmin ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase',
              }}
            >
              {showAdmin ? '← 일반 로그인' : '관리자 로그인'}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 14, border: 'none',
              background: showAdmin
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: showAdmin
                ? '0 6px 28px rgba(245,158,11,0.45)'
                : '0 6px 28px rgba(168,85,247,0.5)',
              fontFamily: 'var(--font-display)',
              fontSize: 18, color: '#fff', letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {loading ? '확인 중...' : showAdmin ? '관리자로 시작하기' : '시작하기 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
