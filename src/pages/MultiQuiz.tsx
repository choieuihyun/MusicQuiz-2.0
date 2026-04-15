import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import { subscribeToRoom, submitAnswer, nextQuestion, showResult } from '../lib/realtimeDB'
import type { Room } from '../lib/realtimeDB'
import { MOCK_QUESTIONS } from '../lib/mockQuizData'
import type { QuizQuestion } from '../types/quiz'

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

export default function MultiQuiz() {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const { sessionId, setCurrentRoom } = usePlayerStore()

  const [room, setRoom] = useState<Room | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [localSubmitted, setLocalSubmitted] = useState(false)

  // TODO: Firebase에서 room.eraId + room.partId 기준으로 문제 로드
  const questions: QuizQuestion[] = MOCK_QUESTIONS

  const era = room ? ERA_COLORS[room.eraId] ?? ERA_COLORS['2000s'] : ERA_COLORS['2000s']
  const isHost = room?.hostId === sessionId
  const currentQ = room ? room.currentQuestion : 0
  const q = questions[currentQ]
  const players = room ? Object.entries(room.players).sort((a, b) => b[1].score - a[1].score) : []
  const _allSubmitted = room ? Object.values(room.players).every(p => p.submitted) : false
  void _allSubmitted // used in useEffect dependency tracking
  const myPlayer = room?.players[sessionId]
  const progress = ((currentQ + (revealed ? 1 : 0)) / questions.length) * 100

  useEffect(() => {
    if (!roomCode) return

    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      if (!roomData) {
        setCurrentRoom(null)
        navigate('/lobby')
        return
      }

      // 결과 화면으로 전환 감지
      if (roomData.status === 'result' || roomData.status === 'finished') {
        setRoom(roomData)
        return
      }

      // 문제 변경 감지 → 상태 초기화
      if (room && roomData.currentQuestion !== room.currentQuestion) {
        setSelected(null)
        setRevealed(false)
        setLocalSubmitted(false)
      }

      // 전원 제출 완료 → 정답 공개
      const allDone = Object.values(roomData.players).every(p => p.submitted)
      if (allDone && !revealed && roomData.status === 'playing') {
        setRevealed(true)
        const myAnswer = roomData.players[sessionId]?.answer
        const isCorrect = myAnswer === questions[roomData.currentQuestion]?.correctId
        setFlash(isCorrect ? 'correct' : 'wrong')
        if (isCorrect) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 1200)
        }
        setTimeout(() => setFlash(null), 700)
      }

      setRoom(roomData)
    })

    return () => unsubscribe()
  }, [roomCode, room?.currentQuestion, revealed, navigate, setCurrentRoom, sessionId, questions])

  const handleSelect = (optionId: number) => {
    if (revealed || localSubmitted) return
    setSelected(optionId)
  }

  const handleSubmit = async () => {
    if (!roomCode || selected === null || localSubmitted) return
    const isCorrect = selected === q.correctId
    setLocalSubmitted(true)
    await submitAnswer(roomCode, sessionId, selected, isCorrect)
  }

  const handleNextQuestion = async () => {
    if (!roomCode || !isHost) return
    if (currentQ + 1 >= questions.length) {
      await showResult(roomCode)
    } else {
      await nextQuestion(roomCode, currentQ + 1)
    }
  }

  const handleGoHome = () => {
    setCurrentRoom(null)
    navigate('/')
  }

  const CONFETTI_COLORS = ['#a855f7','#22d3ee','#f472b6','#facc15','#4ade80','#fb923c','#fff']

  if (!room || !q) {
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

  // 결과 화면
  if (room.status === 'result' || room.status === 'finished') {
    const sortedPlayers = [...players]
    const myRank = sortedPlayers.findIndex(([id]) => id === sessionId) + 1
    const myScore = myPlayer?.score ?? 0
    const pct = Math.round((myScore / questions.length) * 100)

    return (
      <div style={{
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '56px 16px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>게임 종료!</h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            나의 순위: {myRank}위 · {myScore}/{questions.length} ({pct}%)
          </p>
        </div>

        {/* 랭킹 리스트 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 16, marginBottom: 24,
          maxWidth: 400, margin: '0 auto 24px',
        }}>
          {sortedPlayers.map(([playerId, player], idx) => {
            const rank = idx + 1
            const isMe = playerId === sessionId
            const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

            return (
              <div
                key={playerId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: isMe ? `rgba(${era.rgb},0.12)` : 'transparent',
                  marginBottom: idx < sortedPlayers.length - 1 ? 8 : 0,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: rank <= 3 ? `linear-gradient(135deg, ${era.from}, ${era.to})` : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: rank <= 3 ? 18 : 14, fontWeight: 800, color: '#fff',
                  boxShadow: rank <= 3 ? `0 3px 12px rgba(${era.rgb},0.4)` : 'none',
                }}>
                  {medals[rank] ?? rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isMe ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                    {player.displayName}
                    {isMe && <span style={{ fontSize: 11, color: era.from, marginLeft: 6 }}>(나)</span>}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: era.from }}>
                  {player.score}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/{questions.length}</span>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={handleGoHome}
          style={{
            display: 'block', width: '100%', maxWidth: 400, margin: '0 auto',
            background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
            border: 'none', borderRadius: 16, padding: '16px',
            fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: `0 8px 24px rgba(${era.rgb},0.4)`,
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  const isCorrect = selected === q.correctId

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* 화면 플래시 */}
      {flash && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          background: flash === 'correct'
            ? 'radial-gradient(ellipse at 50% 60%, rgba(34,197,94,0.35) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.35) 0%, transparent 70%)',
        }} />
      )}

      {/* 정답/오답 팝업 */}
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

      {/* 컨페티 */}
      {showConfetti && (
        <div style={{ position: 'fixed', top: '55%', left: '50%', zIndex: 102, pointerEvents: 'none' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i % 3 === 0 ? 10 : i % 3 === 1 ? 8 : 6,
              height: i % 3 === 0 ? 10 : i % 3 === 1 ? 8 : 6,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animation: `confetti${i} ${0.7 + (i % 4) * 0.1}s cubic-bezier(0.2,0.8,0.4,1) ${i * 30}ms forwards`,
              boxShadow: `0 0 6px ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
            }} />
          ))}
        </div>
      )}

      {/* 상단 바 */}
      <div style={{ padding: '48px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            {currentQ + 1} / {questions.length}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: era.from,
            background: `rgba(${era.rgb},0.15)`, padding: '4px 10px', borderRadius: 8,
          }}>
            {room.eraId} · Part.{room.partId}
          </span>
        </div>
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

      {/* 참가자 점수판 (가로 스크롤) */}
      <div style={{ padding: '8px 16px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {players.map(([playerId, player]) => {
            const isMe = playerId === sessionId
            const hasSubmitted = player.submitted

            return (
              <div
                key={playerId}
                style={{
                  flexShrink: 0, padding: '10px 14px', borderRadius: 14,
                  background: isMe ? `rgba(${era.rgb},0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isMe ? `rgba(${era.rgb},0.3)` : 'rgba(255,255,255,0.06)'}`,
                  minWidth: 80, textAlign: 'center',
                  opacity: hasSubmitted ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.displayName.slice(0, 6)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isMe ? era.from : '#fff' }}>
                  {player.score}
                </div>
                {hasSubmitted && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>✓ 제출</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 가사 카드 */}
      <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(${era.rgb},0.2)`,
          borderRadius: 24, padding: '24px 20px',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              🎵
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{q.song}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{q.artist}</div>
            </div>
          </div>
          <p style={{
            margin: 0, fontSize: 20, fontWeight: 700, color: '#fff',
            lineHeight: 1.7, textAlign: 'center',
          }}>
            {renderLyrics(q.lyrics, era.from)}
          </p>
        </div>

        {/* 선택지 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt) => {
            const isSelected = selected === opt.id
            const isAnswer = opt.id === q.correctId

            let bg = 'rgba(255,255,255,0.05)'
            let border = 'rgba(255,255,255,0.08)'
            let textColor = 'rgba(255,255,255,0.85)'

            if (revealed) {
              if (isAnswer) {
                bg = 'rgba(34,197,94,0.15)'
                border = 'rgba(34,197,94,0.5)'
                textColor = '#4ade80'
              } else if (isSelected) {
                bg = 'rgba(239,68,68,0.15)'
                border = 'rgba(239,68,68,0.5)'
                textColor = '#f87171'
              }
            } else if (isSelected) {
              bg = `rgba(${era.rgb},0.15)`
              border = `rgba(${era.rgb},0.5)`
              textColor = era.from
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={revealed || localSubmitted}
                style={{
                  width: '100%',
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: revealed || localSubmitted ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: localSubmitted && !revealed ? 0.6 : 1,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `rgba(${era.rgb},0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: textColor,
                }}>
                  {opt.id}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor, flex: 1 }}>
                  {opt.text}
                </span>
                {revealed && isAnswer && <span style={{ fontSize: 16 }}>✓</span>}
                {revealed && isSelected && !isAnswer && <span style={{ fontSize: 16 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* 제출 버튼 */}
        {selected !== null && !localSubmitted && !revealed && (
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', marginTop: 4,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              border: 'none', borderRadius: 16, padding: '16px',
              fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: `0 8px 28px rgba(${era.rgb},0.45)`,
            }}
          >
            제출하기
          </button>
        )}

        {/* 제출 완료 대기 */}
        {localSubmitted && !revealed && (
          <div style={{
            textAlign: 'center', padding: '16px',
            color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600,
          }}>
            다른 참가자를 기다리는 중...
          </div>
        )}

        {/* 다음 문제 버튼 (호스트만) */}
        {revealed && isHost && (
          <button
            onClick={handleNextQuestion}
            style={{
              width: '100%', marginTop: 4, marginBottom: 24,
              background: `linear-gradient(135deg, ${era.from}, ${era.to})`,
              border: 'none', borderRadius: 16, padding: '16px',
              fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: `0 8px 24px rgba(${era.rgb},0.35)`,
            }}
          >
            {currentQ + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
          </button>
        )}

        {/* 대기 메시지 (호스트 아닌 경우) */}
        {revealed && !isHost && (
          <div style={{
            textAlign: 'center', padding: '16px', marginBottom: 24,
            color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600,
          }}>
            방장이 다음 문제로 넘길 때까지 기다려주세요...
          </div>
        )}
      </div>
    </div>
  )
}
