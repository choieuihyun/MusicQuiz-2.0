import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPartRanking } from '../lib/firestore'
import type { ScoreEntry } from '../lib/firestore'

const ERAS = [
  { id: '2000s', label: '2000s', tag: '00s', from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  { id: '2010s', label: '2010s', tag: '10s', from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238' },
  { id: '2020s', label: '2020s', tag: '20s', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
]

const PARTS = ['1', '2', '3']
const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Ranking() {
  const navigate = useNavigate()
  const [selectedEra, setSelectedEra] = useState('2000s')
  const [selectedPart, setSelectedPart] = useState('1')
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(false)

  const era = ERAS.find(e => e.id === selectedEra)!

  useEffect(() => {
    setLoading(true)
    getPartRanking(selectedEra, selectedPart)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedEra, selectedPart])

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
    }}>
      {/* 배경 광원 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 400, height: 400, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 100% 0%, rgba(${era.rgb},0.1) 0%, transparent 60%)`,
        transition: 'background 0.5s ease',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 18px 24px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700,
            marginBottom: 24, WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 44, lineHeight: 1, marginBottom: 12,
            filter: `drop-shadow(0 0 24px rgba(${era.rgb},0.7))`,
            transition: 'filter 0.4s ease',
          }}>
            🏆
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40, color: '#fff', letterSpacing: '-1px', lineHeight: 1,
            textShadow: `0 0 60px rgba(${era.rgb},0.4)`,
            transition: 'text-shadow 0.4s ease',
            marginBottom: 8,
          }}>
            랭킹
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}>
            파트별 TOP 랭킹
          </div>
        </div>
      </header>

      <main style={{ padding: '0 16px 52px', position: 'relative' }}>

        {/* 연대 탭 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: 5,
        }}>
          {ERAS.map(e => {
            const isActive = selectedEra === e.id
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEra(e.id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  background: isActive ? `linear-gradient(135deg, ${e.from}, ${e.to})` : 'transparent',
                  fontFamily: isActive ? 'var(--font-number)' : 'var(--font-body)',
                  fontSize: 13, fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: isActive ? `0 4px 18px rgba(${e.rgb},0.45)` : 'none',
                  letterSpacing: isActive ? '0.5px' : '0',
                  transition: 'all 0.22s ease',
                }}
              >
                {e.label}
              </button>
            )
          })}
        </div>

        {/* 파트 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {PARTS.map(p => {
            const isActive = selectedPart === p
            return (
              <button
                key={p}
                onClick={() => setSelectedPart(p)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 12,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  background: isActive ? `rgba(${era.rgb},0.16)` : 'rgba(255,255,255,0.04)',
                  color: isActive ? era.from : 'rgba(255,255,255,0.28)',
                  border: `1px solid ${isActive ? `rgba(${era.rgb},0.45)` : 'rgba(255,255,255,0.07)'}`,
                  borderLeft: isActive ? `3px solid ${era.from}` : '3px solid transparent',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: isActive ? `0 0 20px rgba(${era.rgb},0.18)` : 'none',
                  transition: 'all 0.22s ease',
                }}
              >
                Part.{p}
              </button>
            )
          })}
        </div>

        {/* 랭킹 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{
              textAlign: 'center', padding: '64px 0',
              fontFamily: 'var(--font-display)',
              fontSize: 18, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px',
            }}>
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>🎵</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px',
              }}>
                아직 기록이 없어요
              </div>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1
              const pct = Math.round((entry.score / entry.total) * 100)
              const isTop3 = rank <= 3

              return (
                <div
                  key={entry.sessionId}
                  style={{
                    borderRadius: 18,
                    background: isTop3
                      ? `rgba(${era.rgb},0.09)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isTop3 ? `rgba(${era.rgb},0.22)` : 'rgba(255,255,255,0.06)'}`,
                    borderLeft: isTop3 ? `4px solid ${era.from}` : '4px solid transparent',
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: isTop3
                      ? `0 4px 24px rgba(${era.rgb},0.1), inset 0 1px 0 rgba(255,255,255,0.07)`
                      : 'none',
                  }}
                >
                  {/* 순위 */}
                  <div style={{
                    width: 30, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-number)',
                    fontSize: isTop3 ? 22 : 14, fontWeight: 900,
                    color: isTop3 ? '#fff' : 'rgba(255,255,255,0.25)',
                  }}>
                    {RANK_MEDALS[rank] ?? rank}
                  </div>

                  {/* 아바타 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: entry.photoURL
                      ? 'transparent'
                      : (isTop3 ? `linear-gradient(135deg, ${era.from}, ${era.to})` : 'rgba(255,255,255,0.07)'),
                    border: `2px solid ${isTop3 ? `rgba(${era.rgb},0.5)` : 'rgba(255,255,255,0.09)'}`,
                    boxShadow: isTop3 ? `0 0 14px rgba(${era.rgb},0.4)` : 'none',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {entry.photoURL
                      ? <img src={entry.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🎤'
                    }
                  </div>

                  {/* 닉네임 + 점수 바 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800,
                        color: isTop3 ? '#fff' : 'rgba(255,255,255,0.65)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.nickname}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-number)',
                        fontSize: 15, fontWeight: 900, flexShrink: 0, marginLeft: 8,
                        color: isTop3 ? era.from : 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.5px',
                      }}>
                        {entry.score}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.25)' }}>
                          /{entry.total}
                        </span>
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100, width: `${pct}%`,
                        background: isTop3
                          ? `linear-gradient(90deg, ${era.from}, ${era.to})`
                          : 'rgba(255,255,255,0.18)',
                        boxShadow: isTop3 ? `0 0 8px rgba(${era.rgb},0.5)` : 'none',
                      }} />
                    </div>
                  </div>

                  {/* 정답률 */}
                  <div style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-number)',
                    fontSize: 13, fontWeight: 700,
                    color: isTop3 ? `rgba(${era.rgb},0.9)` : 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.5px',
                  }}>
                    {pct}%
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
