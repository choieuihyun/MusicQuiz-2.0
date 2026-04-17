import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import {
  subscribeToRoom, submitAnswer, nextQuestion, showResult,
  sendNudge, subscribeToNudge, clearNudge,
  sendChatMessage, subscribeToChatMessages, subscribeToBubbles,
} from '../lib/realtimeDB'
import type { Room, ChatMessage, Bubble } from '../lib/realtimeDB'
import { saveScore, getPartQuestions, getMusicURL } from '../lib/firestore'
import MusicPlayer from '../components/MusicPlayer'
import { partMeta } from '../lib/parts'
import type { QuizQuestion } from '../types/quiz'

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
              background: `${color}20`,
              border: `1.5px solid ${color}55`,
              borderRadius: 8,
              padding: '0 12px',
              marginInline: 4,
              color: color,
              fontWeight: 900,
              minWidth: 52,
              textAlign: 'center',
              fontSize: '0.88em',
              fontFamily: 'var(--font-number)',
              letterSpacing: '1px',
            }}>
              ?
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function MultiQuiz() {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode: string }>()
  const { sessionId, nickname, photoURL, setCurrentRoom } = usePlayerStore()

  const [room, setRoom] = useState<Room | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [nudgeReceived, setNudgeReceived] = useState<{ fromName: string } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'players' | 'chat'>('players')
  const [nudgedPlayers, setNudgedPlayers] = useState<Set<string>>(new Set())
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; data: ChatMessage }>>([])
  const [bubbles, setBubbles] = useState<Record<string, Bubble>>({})
  const [chatInput, setChatInput] = useState('')
  const [unreadChat, setUnreadChat] = useState(0)
  const [tick, setTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreSavedRef = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const [currentMusicURL, setCurrentMusicURL] = useState('')

  // 파트 문제 로드 (Firestore)
  useEffect(() => {
    const partId = room?.partId
    if (!partId) return
    getPartQuestions(partId)
      .then(qs => { setQuestions(qs); setQuestionsLoaded(true) })
      .catch(err => { console.error('[문제 로드 실패]', err); setQuestionsLoaded(true) })
  }, [room?.partId])

  // 현재 문제 음악 URL 로드 (Storage)
  useEffect(() => {
    const partId = room?.partId
    const qIndex = room?.currentQuestion ?? 0
    const song = questions[qIndex]?.song
    if (!partId || !song) return
    setCurrentMusicURL('')
    getMusicURL(partId, song)
      .then((url: string) => setCurrentMusicURL(url))
      .catch(() => setCurrentMusicURL(''))
  }, [room?.partId, room?.currentQuestion, questions])

  const meta = partMeta(room?.partId ?? '')
  const isHost = room?.hostId === sessionId
  const currentQ = room ? room.currentQuestion : 0
  const q = questions[currentQ]
  const players = room ? Object.entries(room.players ?? {}).sort((a, b) => b[1].score - a[1].score) : []
  const _allSubmitted = room ? Object.values(room.players).every(p => p.submitted) : false
  void _allSubmitted
  const myPlayer = room?.players[sessionId]
  const progress = questions.length === 0
    ? 0
    : ((currentQ + (revealed ? 1 : 0)) / questions.length) * 100

  // 1초 tick — 말풍선 자동 소멸용
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  void tick

  // 방 구독
  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      if (!roomData) {
        setCurrentRoom(null)
        navigate('/rooms')
        return
      }
      if (roomData.status === 'result' || roomData.status === 'finished') {
        setRoom(roomData)
        return
      }
      if (room && roomData.currentQuestion !== room.currentQuestion) {
        setSelected(null)
        setRevealed(false)
        setLocalSubmitted(false)
      }
      const allDone = Object.values(roomData.players ?? {}).every(p => p.submitted)
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

  // 타이머
  useEffect(() => {
    if (!room || room.status !== 'playing' || revealed) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const startedAt = room.questionStartedAt
    const limit = room.timeLimit
    if (!startedAt) return
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(0, limit - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0 && !localSubmitted && !revealed) {
        setLocalSubmitted(true)
        if (roomCode) submitAnswer(roomCode, sessionId, selected ?? -1, false)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [room?.questionStartedAt, room?.timeLimit, room?.status, revealed, localSubmitted, selected, roomCode, sessionId])

  // 재촉 구독
  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = subscribeToNudge(roomCode, sessionId, (nudge) => {
      if (nudge && Date.now() - nudge.timestamp < 3000) {
        setNudgeReceived({ fromName: nudge.fromName })
        clearNudge(roomCode, sessionId)
        setTimeout(() => setNudgeReceived(null), 2000)
      }
    })
    return () => unsubscribe()
  }, [roomCode, sessionId])

  // 게임 종료 시 Firestore 점수 저장
  useEffect(() => {
    if (!room || room.status !== 'result') return
    if (scoreSavedRef.current) return
    const myPlayer = room.players[sessionId]
    if (!myPlayer) return
    scoreSavedRef.current = true
    saveScore(sessionId, nickname, room.partId, myPlayer.score, questions.length, photoURL)
  }, [room?.status])

  // 채팅 구독
  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToChatMessages(roomCode, (msgs) => {
      setChatMessages(msgs)
      // 드로어가 채팅 탭이 아닐 때 새 메시지 카운트
      if (msgs.length > prevMsgCount.current) {
        setUnreadChat(u => u + (msgs.length - prevMsgCount.current))
      }
      prevMsgCount.current = msgs.length
    })
    return () => unsub()
  }, [roomCode])

  // 말풍선 구독
  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToBubbles(roomCode, setBubbles)
    return () => unsub()
  }, [roomCode])

  // 채팅 탭 열면 unread 초기화
  useEffect(() => {
    if (drawerTab === 'chat' && drawerOpen) {
      setUnreadChat(0)
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [drawerTab, drawerOpen])

  // 채팅 탭 열려있을 때 새 메시지 스크롤
  useEffect(() => {
    if (drawerTab === 'chat' && drawerOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const getBubble = (playerId: string): string | null => {
    const b = bubbles[playerId]
    if (!b) return null
    if (Date.now() - b.timestamp > 5000) return null
    return b.message
  }

  const handleNudge = async (targetId: string) => {
    if (!roomCode || targetId === sessionId) return
    await sendNudge(roomCode, sessionId, nickname, targetId)
    setNudgedPlayers(prev => new Set(prev).add(targetId))
    setTimeout(() => {
      setNudgedPlayers(prev => { const n = new Set(prev); n.delete(targetId); return n })
    }, 2000)
  }

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
    if (currentQ + 1 >= questions.length) await showResult(roomCode)
    else await nextQuestion(roomCode, currentQ + 1)
  }

  const handleGoHome = () => {
    setCurrentRoom(null)
    navigate('/')
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

  const CONFETTI_COLORS = ['#a855f7', '#22d3ee', '#f472b6', '#facc15', '#4ade80', '#fb923c', '#fff']

  if (!room) {
    return (
      <div style={{
        minHeight: '100svh', background: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 20, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px',
      }}>
        로딩 중...
      </div>
    )
  }

  // 문제 데이터 없음 — 준비 중인 파트
  if (questionsLoaded && questions.length === 0) {
    return (
      <div style={{
        minHeight: '100svh', background: 'var(--bg-main)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', padding: '0 24px',
        position: 'relative',
      }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
        <div style={{ fontSize: 56, marginBottom: 18, filter: `drop-shadow(0 0 24px rgba(${meta.rgb},0.5))` }}>🎵</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, color: '#fff',
          letterSpacing: '-0.5px', marginBottom: 8, textAlign: 'center',
          textShadow: `0 0 40px rgba(${meta.rgb},0.4)`,
        }}>
          Part.{room.partId} 준비 중
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.5px', marginBottom: 28, textAlign: 'center',
        }}>
          아직 문제가 업로드되지 않았어요
        </div>
        <button
          onClick={handleGoHome}
          style={{
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
            fontFamily: 'var(--font-display)',
            fontSize: 16, color: '#fff', cursor: 'pointer', letterSpacing: '0.5px',
            boxShadow: `0 6px 24px rgba(${meta.rgb},0.4)`,
          }}
        >
          홈으로 →
        </button>
      </div>
    )
  }

  if (!q) {
    return (
      <div style={{
        minHeight: '100svh', background: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 20, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px',
      }}>
        로딩 중...
      </div>
    )
  }

  // ─── 결과 화면 ───────────────────────────────────────────────
  if (room.status === 'result' || room.status === 'finished') {
    const sortedPlayers = [...players]
    const myRank = sortedPlayers.findIndex(([id]) => id === sessionId) + 1
    const myScore = myPlayer?.score ?? 0
    const pct = Math.round((myScore / questions.length) * 100)

    return (
      <div style={{
        minHeight: '100svh',
        background: 'var(--bg-main)',
        fontFamily: 'var(--font-body)',
        padding: '56px 16px 36px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
        <div style={{
          position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 400, pointerEvents: 'none',
          background: `radial-gradient(ellipse, rgba(${meta.rgb},0.1) 0%, transparent 70%)`,
        }} />

        {/* 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
          <div style={{
            fontSize: 60, marginBottom: 12,
            filter: `drop-shadow(0 0 28px rgba(${meta.rgb},0.7))`,
          }}>🏆</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38, color: '#fff', letterSpacing: '-0.5px',
            textShadow: `0 0 60px rgba(${meta.rgb},0.5)`,
            marginBottom: 8,
          }}>
            게임 종료
          </div>
          <div style={{
            fontFamily: 'var(--font-number)',
            fontSize: 14, fontWeight: 700, letterSpacing: '2px',
            color: `rgba(${meta.rgb},0.7)`,
          }}>
            나의 순위 {myRank}위 · {myScore}/{questions.length} ({pct}%)
          </div>
        </div>

        {/* 랭킹 카드 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: `4px solid ${meta.from}`,
          borderRadius: 20, padding: '12px 14px',
          marginBottom: 20, maxWidth: 420, margin: '0 auto 20px',
          position: 'relative',
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
                  padding: '11px 12px', borderRadius: 12,
                  background: isMe ? `rgba(${meta.rgb},0.12)` : 'transparent',
                  marginBottom: idx < sortedPlayers.length - 1 ? 6 : 0,
                  border: isMe ? `1px solid rgba(${meta.rgb},0.25)` : '1px solid transparent',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: rank <= 3
                    ? `linear-gradient(135deg, ${meta.from}, ${meta.to})`
                    : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: rank <= 3 ? undefined : 'var(--font-number)',
                  fontSize: rank <= 3 ? 16 : 13, fontWeight: 900, color: '#fff',
                  boxShadow: rank <= 3 ? `0 3px 12px rgba(${meta.rgb},0.4)` : 'none',
                }}>
                  {medals[rank] ?? rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: isMe ? '#fff' : 'rgba(255,255,255,0.75)',
                  }}>
                    {player.displayName}
                    {isMe && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: meta.from,
                        marginLeft: 8, letterSpacing: '0.5px',
                      }}>나</span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-number)',
                  fontSize: 17, fontWeight: 900, color: meta.from,
                  letterSpacing: '0.5px',
                }}>
                  {player.score}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
                    /{questions.length}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={handleGoHome}
          style={{
            display: 'block', width: '100%', maxWidth: 420, margin: '0 auto',
            background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
            border: 'none', borderRadius: 16, padding: '17px',
            fontFamily: 'var(--font-display)',
            fontSize: 20, color: '#fff', cursor: 'pointer', letterSpacing: '0.5px',
            boxShadow: `0 8px 32px rgba(${meta.rgb},0.45)`,
          }}
        >
          홈으로 돌아가기 →
        </button>
      </div>
    )
  }

  const isCorrect = selected === q.correctId

  // ─── 퀴즈 진행 화면 ──────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* 화면 플래시 */}
      {flash && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          background: flash === 'correct'
            ? 'radial-gradient(ellipse at 50% 60%, rgba(34,197,94,0.32) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.32) 0%, transparent 70%)',
        }} />
      )}

      {/* 정답/오답 팝업 */}
      {revealed && (
        <div className="result-pop" style={{
          position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 101, pointerEvents: 'none',
          background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1.5px solid ${isCorrect ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
          borderLeft: `3px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
          borderRadius: 18, padding: '10px 22px',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: isCorrect ? '0 0 30px rgba(34,197,94,0.3)' : '0 0 30px rgba(239,68,68,0.3)',
        }}>
          <span style={{ fontSize: 20 }}>{isCorrect ? '🎉' : '😢'}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18, color: isCorrect ? '#4ade80' : '#f87171',
            letterSpacing: '0.5px',
          }}>
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

      {/* 재촉 알림 */}
      {nudgeReceived && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 103,
          background: 'rgba(244,114,182,0.18)',
          border: '1px solid rgba(244,114,182,0.5)',
          borderLeft: '3px solid #f472b6',
          borderRadius: 16, padding: '11px 20px',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 24px rgba(244,114,182,0.3)',
          animation: 'nudgeShake 0.5s ease',
        }}>
          <span style={{ fontSize: 18 }}>👋</span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 800, color: '#f472b6',
          }}>
            {nudgeReceived.fromName}님이 재촉했어요!
          </span>
        </div>
      )}

      {/* 딤 오버레이 */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* 사이드 드로어 탭 버튼 */}
      <div
        onClick={() => setDrawerOpen(o => !o)}
        style={{
          position: 'fixed', right: drawerOpen ? 224 : 0, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 201, width: 28,
          background: `linear-gradient(180deg, ${meta.from}, ${meta.to})`,
          borderRadius: '10px 0 0 10px',
          padding: '14px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          cursor: 'pointer',
          boxShadow: `-3px 0 20px rgba(${meta.rgb},0.4)`,
          transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-number)',
          fontSize: 11, fontWeight: 900, color: '#fff',
        }}>
          {players.length}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
          writingMode: 'vertical-rl', letterSpacing: 1,
          fontFamily: 'var(--font-body)',
        }}>
          참가자
        </span>
        {/* 채팅 미읽음 배지 */}
        {unreadChat > 0 && !drawerOpen && (
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: '#f472b6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-number)',
            fontSize: 9, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 8px rgba(244,114,182,0.7)',
          }}>
            {unreadChat > 9 ? '9+' : unreadChat}
          </div>
        )}
        <span style={{
          fontSize: 9, color: 'rgba(255,255,255,0.65)',
          transform: drawerOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.3s ease',
        }}>▶</span>
      </div>

      {/* 드로어 패널 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 224,
        zIndex: 201,
        background: 'linear-gradient(180deg, rgba(21,5,40,0.98) 0%, rgba(6,4,18,0.98) 100%)',
        borderLeft: `1px solid rgba(${meta.rgb},0.2)`,
        boxShadow: `-8px 0 40px rgba(0,0,0,0.6)`,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 드로어 탭 바 */}
        <div style={{
          paddingTop: 52, paddingInline: 10, paddingBottom: 0, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 3, gap: 3,
            marginBottom: 10,
          }}>
            {([
              { key: 'players', label: '참가자', icon: '👥' },
              { key: 'chat', label: '채팅', icon: '💬' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setDrawerTab(tab.key)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 9, border: 'none',
                  background: drawerTab === tab.key
                    ? `linear-gradient(135deg, ${meta.from}, ${meta.to})`
                    : 'transparent',
                  color: drawerTab === tab.key ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  boxShadow: drawerTab === tab.key ? `0 2px 10px rgba(${meta.rgb},0.35)` : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <span>{tab.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)' }}>{tab.label}</span>
                {tab.key === 'chat' && unreadChat > 0 && drawerTab !== 'chat' && (
                  <div style={{
                    position: 'absolute', top: 3, right: 8,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#f472b6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-number)',
                    fontSize: 8, fontWeight: 900, color: '#fff',
                  }}>
                    {unreadChat > 9 ? '9' : unreadChat}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 참가자 탭 */}
        {drawerTab === 'players' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 24px' }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', marginBottom: 10,
            }}>
              {players.length}명 참가 중
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {players.map(([playerId, player], idx) => {
                const isMe = playerId === sessionId
                const hasSubmitted = player.submitted
                const canNudge = !isMe && !hasSubmitted && localSubmitted && !revealed
                const wasNudged = nudgedPlayers.has(playerId)
                const rank = idx + 1
                const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
                const bubble = getBubble(playerId)

                return (
                  <div
                    key={playerId}
                    style={{
                      borderRadius: 12,
                      background: isMe
                        ? `rgba(${meta.rgb},0.14)`
                        : wasNudged ? 'rgba(244,114,182,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isMe ? `rgba(${meta.rgb},0.3)`
                        : wasNudged ? 'rgba(244,114,182,0.35)' : 'rgba(255,255,255,0.07)'
                      }`,
                      borderLeft: `3px solid ${
                        isMe ? meta.from
                        : wasNudged ? '#f472b6' : 'transparent'
                      }`,
                      overflow: 'hidden',
                      transition: 'all 0.22s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '9px 10px' }}>
                      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                        {medals[rank] ?? (
                          <span style={{
                            fontFamily: 'var(--font-number)',
                            fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.25)',
                          }}>{rank}</span>
                        )}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 800,
                          color: isMe ? '#fff' : 'rgba(255,255,255,0.7)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {player.displayName}
                          {isMe && (
                            <span style={{
                              fontSize: 9, color: meta.from, marginLeft: 4, fontWeight: 700,
                            }}>나</span>
                          )}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 1 }}>
                          {hasSubmitted
                            ? <span style={{ color: '#4ade80', fontWeight: 700 }}>✓ 제출</span>
                            : wasNudged
                            ? <span style={{ color: '#f472b6', fontWeight: 700 }}>👋 재촉함</span>
                            : <span style={{ color: 'rgba(255,255,255,0.2)' }}>대기중</span>
                          }
                        </div>
                        {/* 말풍선 */}
                        {bubble && (
                          <div style={{
                            marginTop: 5,
                            background: isMe ? `rgba(${meta.rgb},0.18)` : 'rgba(255,255,255,0.09)',
                            border: `1px solid ${isMe ? `rgba(${meta.rgb},0.3)` : 'rgba(255,255,255,0.12)'}`,
                            borderRadius: '0 8px 8px 8px',
                            padding: '4px 8px',
                            fontSize: 10, fontWeight: 600,
                            color: isMe ? meta.from : 'rgba(255,255,255,0.75)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {bubble}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-number)',
                        fontSize: 16, fontWeight: 900,
                        color: isMe ? meta.from : hasSubmitted ? '#fff' : 'rgba(255,255,255,0.3)',
                        flexShrink: 0,
                      }}>
                        {player.score}
                      </div>
                    </div>

                    {canNudge && (
                      <button
                        onClick={() => handleNudge(playerId)}
                        style={{
                          width: '100%', padding: '6px 0',
                          background: 'rgba(244,114,182,0.12)',
                          border: 'none',
                          borderTop: '1px solid rgba(244,114,182,0.2)',
                          fontSize: 10, fontWeight: 700, color: '#f472b6',
                          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        👋 재촉하기
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 채팅 탭 */}
        {drawerTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 메시지 목록 */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '6px 10px 8px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '32px 0',
                }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)',
                    }}>
                      아직 채팅이 없어요
                    </div>
                  </div>
                </div>
              ) : (
                chatMessages.map(({ id, data }) => {
                  const isMe = data.displayName === nickname
                  return (
                    <div key={id} style={{
                      display: 'flex',
                      flexDirection: isMe ? 'row-reverse' : 'row',
                      alignItems: 'flex-end', gap: 5,
                    }}>
                      {!isMe && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: data.photoURL ? 'transparent' : 'rgba(255,255,255,0.1)',
                          overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11,
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
                        maxWidth: '78%',
                      }}>
                        {!isMe && (
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: 'rgba(255,255,255,0.3)', marginBottom: 2, paddingLeft: 3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: 120,
                          }}>
                            {data.displayName}
                          </span>
                        )}
                        <div style={{
                          background: isMe
                            ? `linear-gradient(135deg, ${meta.from}cc, ${meta.to}99)`
                            : 'rgba(255,255,255,0.08)',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                          padding: '6px 9px',
                          fontSize: 12, fontWeight: 600,
                          color: isMe ? '#fff' : 'rgba(255,255,255,0.85)',
                          wordBreak: 'break-word',
                          boxShadow: isMe ? `0 2px 10px rgba(${meta.rgb},0.3)` : 'none',
                        }}>
                          {data.message}
                        </div>
                        <span style={{
                          fontSize: 9, color: 'rgba(255,255,255,0.2)',
                          marginTop: 2, paddingInline: 3,
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

            {/* 채팅 입력 */}
            <div style={{
              flexShrink: 0,
              padding: '8px 10px 16px',
              borderTop: `1px solid rgba(${meta.rgb},0.15)`,
              background: 'rgba(6,4,18,0.6)',
            }}>
              <div style={{
                display: 'flex', gap: 6,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(${meta.rgb},0.2)`,
                borderRadius: 12,
                padding: '7px 7px 7px 10px',
              }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder="메시지..."
                  maxLength={80}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: 12, fontWeight: 600, color: '#fff',
                    fontFamily: 'var(--font-body)',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none',
                    background: chatInput.trim()
                      ? `linear-gradient(135deg, ${meta.from}, ${meta.to})`
                      : 'rgba(255,255,255,0.07)',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                    boxShadow: chatInput.trim() ? `0 2px 10px rgba(${meta.rgb},0.4)` : 'none',
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                    color: '#fff',
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상단 진행 바 영역 */}
      <div style={{ padding: '48px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            fontFamily: 'var(--font-number)',
            fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px',
          }}>
            {currentQ + 1} / {questions.length}
          </span>
          <span style={{
            fontFamily: 'var(--font-number)',
            fontSize: 11, fontWeight: 700, color: meta.from,
            background: `rgba(${meta.rgb},0.15)`, padding: '4px 10px', borderRadius: 8,
            letterSpacing: '0.5px',
          }}>
            Part.{room.partId} · {meta.label}
          </span>
        </div>

        {/* 진행률 바 */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 100,
            background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`,
            width: `${progress}%`,
            boxShadow: `0 0 8px rgba(${meta.rgb},0.5)`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* 타이머 바 */}
        {room.status === 'playing' && timeLeft !== null && !revealed && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                color: timeLeft <= 5 ? '#f43f5e' : 'rgba(255,255,255,0.4)',
              }}>
                ⏱ 남은 시간
              </span>
              <span
                className={timeLeft <= 5 ? 'timer-pulse' : ''}
                style={{
                  fontFamily: 'var(--font-number)',
                  fontSize: 15, fontWeight: 900, letterSpacing: '0.5px',
                  color: timeLeft <= 5 ? '#f43f5e' : meta.from,
                }}
              >
                {timeLeft}s
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <div
                className={timeLeft <= 5 ? 'timer-pulse' : ''}
                style={{
                  height: '100%', borderRadius: 100,
                  background: timeLeft <= 5
                    ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                    : `linear-gradient(90deg, ${meta.from}, ${meta.to})`,
                  width: `${(timeLeft / room.timeLimit) * 100}%`,
                  boxShadow: timeLeft <= 5
                    ? '0 0 12px rgba(244,63,94,0.6)'
                    : `0 0 8px rgba(${meta.rgb},0.5)`,
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 가사 + 선택지 영역 */}
      <div style={{ padding: '0 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 뮤직 플레이어 */}
        <MusicPlayer
          tracks={[{ title: q.song, artist: q.artist, src: currentMusicURL }]}
          rgb={meta.rgb}
          colorFrom={meta.from}
          colorTo={meta.to}
        />

        {/* 가사 카드 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: `1px solid rgba(${meta.rgb},0.18)`,
          borderLeft: `4px solid ${meta.from}`,
          borderRadius: 20, padding: '20px 18px',
          boxShadow: `0 8px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              boxShadow: `0 2px 10px rgba(${meta.rgb},0.4)`,
            }}>
              🎵
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.65)' }}>{q.song}</div>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.5px',
              }}>{q.artist}</div>
            </div>
          </div>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 19, fontWeight: 800, color: '#fff',
            lineHeight: 1.75, textAlign: 'center',
          }}>
            {renderLyrics(q.lyrics, meta.from)}
          </p>
        </div>

        {/* 선택지 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {q.options.map((opt) => {
            const isSelected = selected === opt.id
            const isAnswer = opt.id === q.correctId

            let bg = 'rgba(255,255,255,0.04)'
            let borderColor = 'rgba(255,255,255,0.07)'
            let borderLeft = '3px solid transparent'
            let textColor = 'rgba(255,255,255,0.82)'

            if (revealed) {
              if (isAnswer) {
                bg = 'rgba(34,197,94,0.12)'
                borderColor = 'rgba(34,197,94,0.45)'
                borderLeft = '3px solid #22c55e'
                textColor = '#4ade80'
              } else if (isSelected) {
                bg = 'rgba(239,68,68,0.12)'
                borderColor = 'rgba(239,68,68,0.45)'
                borderLeft = '3px solid #ef4444'
                textColor = '#f87171'
              }
            } else if (isSelected) {
              bg = `rgba(${meta.rgb},0.14)`
              borderColor = `rgba(${meta.rgb},0.5)`
              borderLeft = `3px solid ${meta.from}`
              textColor = meta.from
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={revealed || localSubmitted}
                style={{
                  width: '100%',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderLeft,
                  borderRadius: 13, padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: revealed || localSubmitted ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: localSubmitted && !revealed ? 0.55 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: `rgba(${meta.rgb},0.1)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-number)',
                  fontSize: 12, fontWeight: 900, color: textColor,
                }}>
                  {opt.id}
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13, fontWeight: 700, color: textColor, flex: 1,
                }}>
                  {opt.text}
                </span>
                {revealed && isAnswer && <span style={{ fontSize: 14 }}>✓</span>}
                {revealed && isSelected && !isAnswer && <span style={{ fontSize: 14 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* 제출 버튼 */}
        {selected !== null && !localSubmitted && !revealed && (
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', marginTop: 2,
              background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              border: 'none', borderRadius: 14, padding: '15px',
              fontFamily: 'var(--font-display)',
              fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: '0.5px',
              boxShadow: `0 8px 28px rgba(${meta.rgb},0.45)`,
            }}
          >
            제출하기 →
          </button>
        )}

        {/* 제출 대기 */}
        {localSubmitted && !revealed && (
          <div style={{
            textAlign: 'center', padding: '14px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
            color: 'rgba(255,255,255,0.3)',
          }}>
            다른 참가자를 기다리는 중...
          </div>
        )}

        {/* 다음 문제 (호스트) */}
        {revealed && isHost && (
          <button
            onClick={handleNextQuestion}
            style={{
              width: '100%', marginTop: 2, marginBottom: 24,
              background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              border: 'none', borderRadius: 14, padding: '15px',
              fontFamily: 'var(--font-display)',
              fontSize: 18, color: '#fff', cursor: 'pointer', letterSpacing: '0.5px',
              boxShadow: `0 8px 28px rgba(${meta.rgb},0.4)`,
            }}
          >
            {currentQ + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
          </button>
        )}

        {/* 대기 (비호스트) */}
        {revealed && !isHost && (
          <div style={{
            textAlign: 'center', padding: '14px', marginBottom: 24,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
            color: 'rgba(255,255,255,0.25)',
          }}>
            방장이 다음 문제로 넘길 때까지 기다려주세요
          </div>
        )}
      </div>
    </div>
  )
}
