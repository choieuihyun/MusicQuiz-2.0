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
      background: 'radial-gradient(ellipse at 50% -10%, #1a0a3e 0%, #0d0820 55%, #060412 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* 배경 광원 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 80% 20%, rgba(${era.rgb},0.08) 0%, transparent 55%)`,
        transition: 'background 0.5s ease',
      }} />

      {/* 헤더 */}
      <header style={{ padding: '56px 20px 24px', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
            marginBottom: 28, WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12,
            filter: `drop-shadow(0 0 20px rgba(${era.rgb},0.6))`,
            transition: 'filter 0.4s ease',
          }}>
            🏆
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-1px',
            textShadow: `0 0 30px rgba(${era.rgb},0.35)`,
          }}>
            랭킹
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            파트별 TOP 랭킹
          </p>
        </div>
      </header>

      <main style={{ padding: '0 16px 52px', position: 'relative' }}>

        {/* 연대 탭 */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 6,
        }}>
          {ERAS.map(e => {
            const isActive = selectedEra === e.id
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEra(e.id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 14, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  WebkitTapHighlightColor: 'transparent',
                  background: isActive
                    ? `linear-gradient(135deg, ${e.from}, ${e.to})`
                    : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                  boxShadow: isActive ? `0 4px 16px rgba(${e.rgb},0.4)` : 'none',
                  transition: 'all 0.25s ease',
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
                  flex: 1, padding: '10px 0', borderRadius: 14,
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  WebkitTapHighlightColor: 'transparent',
                  background: isActive
                    ? `rgba(${era.rgb},0.18)`
                    : 'rgba(255,255,255,0.04)',
                  color: isActive ? era.from : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${isActive ? `rgba(${era.rgb},0.4)` : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isActive ? `0 0 16px rgba(${era.rgb},0.2)` : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                Part.{p}
              </button>
            )
          })}
        </div>

        {/* 랭킹 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: 15 }}>
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: 'rgba(255,255,255,0.25)', fontSize: 15,
            }}>
              아직 기록이 없어요
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
                    borderRadius: 20,
                    background: isTop3
                      ? `linear-gradient(135deg, rgba(${era.rgb},0.12), rgba(${era.rgb},0.05))`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isTop3 ? `rgba(${era.rgb},0.25)` : 'rgba(255,255,255,0.07)'}`,
                    padding: '16px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: isTop3
                      ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 20px rgba(${era.rgb},0.12)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* 순위 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isTop3
                      ? `linear-gradient(145deg, ${era.from}, ${era.to})`
                      : 'rgba(255,255,255,0.07)',
                    boxShadow: isTop3 ? `0 3px 12px rgba(${era.rgb},0.4)` : 'none',
                    fontSize: isTop3 ? 20 : 14,
                    fontWeight: 800,
                    color: isTop3 ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}>
                    {RANK_MEDALS[rank] ?? rank}
                  </div>

                  {/* 닉네임 + 점수 바 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 700,
                        color: isTop3 ? '#fff' : 'rgba(255,255,255,0.7)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {entry.nickname}
                      </span>
                      <span style={{
                        fontSize: 14, fontWeight: 800, flexShrink: 0, marginLeft: 8,
                        color: isTop3 ? era.from : 'rgba(255,255,255,0.45)',
                      }}>
                        {entry.score}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>/{entry.total}</span>
                      </span>
                    </div>

                    {/* 점수 바 */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        width: `${pct}%`,
                        background: isTop3
                          ? `linear-gradient(90deg, ${era.from}, ${era.to})`
                          : 'rgba(255,255,255,0.2)',
                        boxShadow: isTop3 ? `0 0 8px rgba(${era.rgb},0.5)` : 'none',
                      }} />
                    </div>
                  </div>

                  {/* 정답률 */}
                  <div style={{
                    flexShrink: 0, fontSize: 13, fontWeight: 700,
                    color: isTop3 ? `rgba(${era.rgb},0.9)` : 'rgba(255,255,255,0.25)',
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
