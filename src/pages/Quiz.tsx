import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MOCK_QUESTIONS } from '../lib/mockQuizData'
import type { QuizQuestion } from '../types/quiz'
import MusicPlayer from '../components/MusicPlayer'
import type { Track } from '../components/MusicPlayer'
import { usePlayerStore } from '../store/playerStore'
import { saveScore } from '../lib/firestore'

const ERA_COLORS: Record<string, { from: string; to: string; rgb: string }> = {
  '2000s': { from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  '2010s': { from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  '2020s': { from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
}

function renderLyrics(lyrics: string, color: string) {
  const parts = lyrics.split('(  )')
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span style={{
              display: 'inline-block',
              background: `${color}22`,
              border: `1.5px solid ${color}66`,
              borderRadius: 8,
              padding: '0 10px',
              marginInline: 4,
              color: color,
              fontWeight: 800,
              minWidth: 52,
              textAlign: 'center',
              fontSize: '0.9em',
            }}>
              ?
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

export default function Quiz() {
  const { eraId = '2000s', partId = '1' } = useParams()
  const navigate = useNavigate()
  const era = ERA_COLORS[eraId] ?? ERA_COLORS['2000s']
  const { sessionId, nickname } = usePlayerStore()

  // TODO: Firebase에서 eraId + partId 기준으로 문제 로드
  const questions: QuizQuestion[] = MOCK_QUESTIONS

  // TODO: Firebase Storage URL로 교체
  const tracks: Track[] = questions.map(q => ({
    title: q.song,
    artist: q.artist,
    src: '',  // Firebase Storage URL 연결 전까지 빈 값
  }))

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // 퀴즈 완료 시 점수 저장
  useEffect(() => {
    if (!finished || !nickname) return
    saveScore(sessionId, nickname, eraId, partId, score, questions.length)
      .catch(console.error)
  }, [finished])

  const q = questions[current]
  const isCorrect = selected === q.correctId
  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100

  function handleSelect(optionId: number) {
    if (revealed) return
    setSelected(optionId)
  }

  function handleReveal() {
    if (selected === null || revealed) return
    setRevealed(true)
    if (selected === q.correctId) {
      setScore(s => s + 1)
      setFlash('correct')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1200)
    } else {
      setFlash('wrong')
    }
    setTimeout(() => setFlash(null), 700)
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const CONFETTI_COLORS = ['#a855f7','#22d3ee','#f472b6','#facc15','#4ade80','#fb923c','#fff']

  // 결과 화면
  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div style={{
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '😊' : '😅'}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px' }}>
          {score} / {questions.length} 정답
        </h2>
        <p style={{ margin: '0 0 40px', fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
          정답률 {pct}%
        </p>

        {/* 점수 게이지 */}
        <div style={{ width: '100%', maxWidth: 320, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100, marginBottom: 48, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 100,
            background: `linear-gradient(90deg, ${era.from}, ${era.to})`,
            width: `${pct}%`,
            boxShadow: `0 0 12px rgba(${era.rgb},0.6)`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
            border: 'none', borderRadius: 16, padding: '16px 40px',
            fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: `0 8px 24px rgba(${era.rgb},0.4)`,
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* 화면 플래시 오버레이 */}
      {flash && (
        <div className="flash-overlay" style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          background: flash === 'correct'
            ? 'radial-gradient(ellipse at 50% 60%, rgba(34,197,94,0.35) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.35) 0%, transparent 70%)',
        }} />
      )}

      {/* 정답/오답 결과 팝업 */}
      {revealed && (
        <div className="result-pop" style={{
          position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 101, pointerEvents: 'none',
          background: isCorrect ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
          border: `1.5px solid ${isCorrect ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
          borderRadius: 20, padding: '10px 24px',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: isCorrect ? '0 0 30px rgba(34,197,94,0.3)' : '0 0 30px rgba(239,68,68,0.3)',
        }}>
          <span style={{ fontSize: 22 }}>{isCorrect ? '🎉' : '😢'}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: isCorrect ? '#4ade80' : '#f87171' }}>
            {isCorrect ? '정답!' : '오답!'}
          </span>
        </div>
      )}

      {/* 컨페티 파티클 (정답 시) */}
      {showConfetti && (
        <div style={{ position: 'fixed', top: '55%', left: '50%', zIndex: 102, pointerEvents: 'none' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i % 3 === 0 ? 10 : i % 3 === 1 ? 8 : 6,
              height: i % 3 === 0 ? 10 : i % 3 === 1 ? 8 : 6,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              opacity: 1,
              animation: `confetti${i} ${0.7 + (i % 4) * 0.1}s cubic-bezier(0.2,0.8,0.4,1) ${i * 30}ms forwards`,
              boxShadow: `0 0 6px ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
            }} />
          ))}
        </div>
      )}

      {/* 상단 바 */}
      <div style={{ padding: '56px 20px 20px', position: 'relative' }}>
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
            marginBottom: 24, WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈
        </button>

        {/* 문제 번호 + 진행률 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            {current + 1} / {questions.length}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: era.from }}>
            Part.{partId}
          </span>
        </div>

        {/* 진행률 바 */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 100,
            background: `linear-gradient(90deg, ${era.from}, ${era.to})`,
            width: `${progress}%`,
            boxShadow: `0 0 8px rgba(${era.rgb},0.5)`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* 뮤직 플레이어 */}
      <div style={{ padding: '0 16px 16px' }}>
        <MusicPlayer tracks={tracks} rgb={era.rgb} colorFrom={era.from} colorTo={era.to} />
      </div>

      {/* 가사 카드 */}
      <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(${era.rgb},0.2)`,
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(${era.rgb},0.08)`,
        }}>
          {/* 곡 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>
              🎵
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{q.song}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{q.artist}</div>
            </div>
          </div>

          {/* 가사 */}
          <p style={{
            margin: 0, fontSize: 22, fontWeight: 700, color: '#fff',
            lineHeight: 1.7, letterSpacing: '-0.3px',
            textAlign: 'center',
          }}>
            {renderLyrics(q.lyrics, era.from)}
          </p>
        </div>

        {/* 선택지 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {q.options.map((opt) => {
            const isSelected = selected === opt.id
            const isAnswer = opt.id === q.correctId

            let bg = 'rgba(255,255,255,0.05)'
            let border = 'rgba(255,255,255,0.08)'
            let textColor = 'rgba(255,255,255,0.85)'
            let shadow = 'inset 0 1px 0 rgba(255,255,255,0.06)'
            let animClass = ''

            if (revealed) {
              if (isAnswer) {
                bg = 'rgba(34,197,94,0.15)'
                border = 'rgba(34,197,94,0.5)'
                textColor = '#4ade80'
                shadow = '0 0 20px rgba(34,197,94,0.25)'
                animClass = 'correct-burst'
              } else if (isSelected) {
                bg = 'rgba(239,68,68,0.15)'
                border = 'rgba(239,68,68,0.5)'
                textColor = '#f87171'
                shadow = '0 0 16px rgba(239,68,68,0.2)'
                animClass = 'wrong-shake'
              }
            } else if (isSelected) {
              bg = `rgba(${era.rgb},0.15)`
              border = `rgba(${era.rgb},0.5)`
              textColor = era.from
            }

            return (
              <button
                key={opt.id}
                className={animClass}
                onClick={() => handleSelect(opt.id)}
                style={{
                  width: '100%',
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 16, padding: '15px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: revealed ? 'default' : 'pointer',
                  WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                  boxShadow: shadow,
                  transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: revealed && isAnswer
                    ? 'rgba(34,197,94,0.25)'
                    : revealed && isSelected
                      ? 'rgba(239,68,68,0.25)'
                      : `rgba(${era.rgb},0.12)`,
                  border: `1px solid ${revealed && isAnswer ? 'rgba(34,197,94,0.4)' : revealed && isSelected ? 'rgba(239,68,68,0.4)' : `rgba(${era.rgb},0.2)`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: revealed && isAnswer ? '#4ade80' : revealed && isSelected ? '#f87171' : `rgba(${era.rgb},0.9)`,
                }}>
                  {opt.id}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: textColor, flex: 1 }}>
                  {opt.text}
                </span>
                {revealed && isAnswer && <span style={{ fontSize: 18 }}>✓</span>}
                {revealed && isSelected && !isAnswer && <span style={{ fontSize: 18 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* 정답 확인 버튼 */}
        {selected !== null && !revealed && (
          <button
            onClick={handleReveal}
            style={{
              width: '100%', marginTop: 4, marginBottom: 8,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              border: 'none', borderRadius: 18, padding: '17px',
              fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: `0 8px 28px rgba(${era.rgb},0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
              animation: 'fadeSlideUp 0.3s ease both',
            }}
          >
            정답 확인
          </button>
        )}

        {/* 다음 문제 버튼 */}
        {revealed && (
          <button
            onClick={handleNext}
            style={{
              width: '100%', marginTop: 4, marginBottom: 32,
              background: isCorrect
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : `linear-gradient(135deg, ${era.from}, ${era.to})`,
              border: 'none', borderRadius: 18, padding: '17px',
              fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: isCorrect
                ? '0 8px 24px rgba(34,197,94,0.4)'
                : `0 8px 24px rgba(${era.rgb},0.35)`,
              animation: 'fadeSlideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both',
            }}
          >
            {current + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
          </button>
        )}
      </div>
    </div>
  )
}
