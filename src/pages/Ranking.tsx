import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPartRanking } from '../lib/firestore'
import type { ScoreEntry } from '../lib/firestore'
import { PARTS, partMeta } from '../lib/parts'

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Ranking() {
  const navigate = useNavigate()
  const [selectedPart, setSelectedPart] = useState('1')
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(false)

  const meta = partMeta(selectedPart)

  useEffect(() => {
    setLoading(true)
    getPartRanking(selectedPart)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedPart])

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'var(--bg-accent)' }} />
      {/* 배경 광원 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 80% 10%, rgba(${meta.rgb},0.12) 0%, transparent 55%)`,
        transition: 'background 0.5s ease',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 20px 24px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700,
            WebkitTapHighlightColor: 'transparent', letterSpacing: '0.5px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈
        </button>

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{
            fontSize: 50, lineHeight: 1, marginBottom: 10,
            filter: `drop-shadow(0 0 24px rgba(${meta.rgb},0.65))`,
            transition: 'filter 0.4s ease',
          }}>
            🏆
          </div>
          <h1 style={{
            margin: 0, fontSize: 34, fontFamily: 'var(--font-display)',
            color: '#fff', letterSpacing: '-0.5px',
            textShadow: `0 0 50px rgba(${meta.rgb},0.4)`,
          }}>
            랭킹
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
          }}>
            파트별 TOP 랭킹
          </p>
        </div>
      </header>

      <main style={{ padding: '0 16px 52px', position: 'relative' }}>

        {/* 파트 탭 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 22,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: 5,
        }}>
          {PARTS.map(p => {
            const isActive = selectedPart === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPart(p.id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 13, border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-number)',
                  fontSize: 14, fontWeight: 800, letterSpacing: '0.5px',
                  WebkitTapHighlightColor: 'transparent',
                  background: isActive
                    ? `linear-gradient(135deg, ${p.from}, ${p.to})`
                    : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                  boxShadow: isActive ? `0 4px 16px rgba(${p.rgb},0.4)` : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                P.{p.id}
              </button>
            )
          })}
        </div>

        {/* 랭킹 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700, letterSpacing: '1px',
            }}>
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: 'rgba(255,255,255,0.25)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>🎵</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, color: 'rgba(255,255,255,0.4)',
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
                      ? `linear-gradient(135deg, rgba(${meta.rgb},0.12), rgba(${meta.rgb},0.04))`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isTop3 ? `rgba(${meta.rgb},0.3)` : 'rgba(255,255,255,0.07)'}`,
                    borderLeft: `4px solid ${isTop3 ? meta.from : 'rgba(255,255,255,0.1)'}`,
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: isTop3
                      ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 22px rgba(${meta.rgb},0.14)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* 순위 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isTop3
                      ? `linear-gradient(145deg, ${meta.from}, ${meta.to})`
                      : 'rgba(255,255,255,0.07)',
                    boxShadow: isTop3 ? `0 3px 12px rgba(${meta.rgb},0.4)` : 'none',
                    fontSize: isTop3 ? 20 : 14,
                    fontFamily: isTop3 ? undefined : 'var(--font-number)',
                    fontWeight: 900,
                    color: isTop3 ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}>
                    {RANK_MEDALS[rank] ?? rank}
                  </div>

                  {/* 프로필 아바타 */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: entry.photoURL ? 'transparent' : 'rgba(255,255,255,0.08)',
                    border: `2px solid ${isTop3 ? `rgba(${meta.rgb},0.4)` : 'rgba(255,255,255,0.1)'}`,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                    boxShadow: isTop3 ? `0 0 12px rgba(${meta.rgb},0.35)` : 'none',
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
                        fontSize: 15, fontWeight: 800,
                        color: isTop3 ? '#fff' : 'rgba(255,255,255,0.7)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.nickname}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-number)',
                        fontSize: 15, fontWeight: 900, flexShrink: 0, marginLeft: 8,
                        color: isTop3 ? meta.from : 'rgba(255,255,255,0.45)',
                      }}>
                        {entry.score}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
                          /{entry.total}
                        </span>
                      </span>
                    </div>

                    {/* 점수 바 */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        width: `${pct}%`,
                        background: isTop3
                          ? `linear-gradient(90deg, ${meta.from}, ${meta.to})`
                          : 'rgba(255,255,255,0.2)',
                        boxShadow: isTop3 ? `0 0 8px rgba(${meta.rgb},0.5)` : 'none',
                      }} />
                    </div>
                  </div>

                  {/* 정답률 */}
                  <div style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-number)',
                    fontSize: 14, fontWeight: 800,
                    color: isTop3 ? `rgba(${meta.rgb},0.95)` : 'rgba(255,255,255,0.25)',
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
