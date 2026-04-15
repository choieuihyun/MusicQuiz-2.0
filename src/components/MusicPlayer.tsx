import { useState, useRef, useEffect } from 'react'

export interface Track {
  title: string
  artist: string
  src: string  // Firebase Storage URL (or any audio URL)
}

interface Props {
  tracks: Track[]
  rgb: string
  colorFrom: string
  colorTo: string
}

function formatTime(sec: number) {
  if (isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer({ tracks, rgb, colorFrom, colorTo }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [showVolume, setShowVolume] = useState(false)

  const track = tracks[trackIdx]
  const hasSrc = !!track?.src

  // 트랙 변경 시 리셋
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setCurrentTime(0)
    setDuration(0)
    if (playing) audio.play().catch(() => setPlaying(false))
  }, [trackIdx])

  // 볼륨 동기화
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !hasSrc) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  function handlePrev() {
    setPlaying(false)
    setTrackIdx(i => (i - 1 + tracks.length) % tracks.length)
  }

  function handleNext() {
    setPlaying(false)
    setTrackIdx(i => (i + 1) % tracks.length)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = val
    setCurrentTime(val)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{
      borderRadius: 24,
      background: `linear-gradient(135deg, rgba(${rgb},0.12), rgba(${rgb},0.05))`,
      border: `1px solid rgba(${rgb},0.25)`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '18px 20px',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4), 0 0 30px rgba(${rgb},0.08)`,
    }}>
      <audio
        ref={audioRef}
        src={track?.src || undefined}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); handleNext() }}
      />

      {/* 트랙 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {/* 앨범 아이콘 */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(145deg, ${colorFrom}, ${colorTo})`,
          boxShadow: `0 4px 16px rgba(${rgb},0.45)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          animation: playing ? 'spin 4s linear infinite' : 'none',
        }}>
          🎵
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {track?.title ?? '트랙 없음'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {track?.artist ?? '—'}
          </div>
        </div>
        {/* 트랙 번호 */}
        <div style={{ fontSize: 12, color: `rgba(${rgb},0.6)`, fontWeight: 700, flexShrink: 0 }}>
          {trackIdx + 1} / {tracks.length}
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={!hasSrc}
          style={{
            width: '100%', height: 4, appearance: 'none', WebkitAppearance: 'none',
            background: `linear-gradient(90deg, ${colorFrom} ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
            borderRadius: 100, cursor: hasSrc ? 'pointer' : 'default', outline: 'none', border: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {/* 이전 */}
        <button onClick={handlePrev} style={btnStyle}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4v10M14 4L8 9l6 5V4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 재생/일시정지 */}
        <button
          onClick={togglePlay}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: hasSrc ? 'pointer' : 'not-allowed',
            background: hasSrc ? `linear-gradient(145deg, ${colorFrom}, ${colorTo})` : 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hasSrc ? `0 4px 20px rgba(${rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
            color: '#fff', WebkitTapHighlightColor: 'transparent',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="3" width="4" height="14" rx="1.5"/>
              <rect x="12" y="3" width="4" height="14" rx="1.5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 4l11 6-11 6V4z"/>
            </svg>
          )}
        </button>

        {/* 다음 */}
        <button onClick={handleNext} style={btnStyle}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 4v10M4 4l6 5-6 5V4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 볼륨 */}
        <div style={{ position: 'relative', marginLeft: 8 }}>
          <button
            onClick={() => setShowVolume(v => !v)}
            style={{ ...btnStyle, color: showVolume ? colorFrom : 'rgba(255,255,255,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 6.5h2.5L9 3.5v11l-3.5-3H3v-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              {volume > 0.5 && <path d="M11.5 5.5a4 4 0 010 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>}
              {volume > 0 && <path d="M13 7.5a2 2 0 010 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>}
            </svg>
          </button>
          {showVolume && (
            <div style={{
              position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20,10,40,0.95)', border: `1px solid rgba(${rgb},0.25)`,
              borderRadius: 14, padding: '12px 10px', backdropFilter: 'blur(20px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 10, color: `rgba(${rgb},0.8)`, fontWeight: 700 }}>
                {Math.round(volume * 100)}
              </span>
              <input
                type="range" min={0} max={1} step={0.02} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                style={{
                  width: 80, height: 4, appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(90deg, ${colorFrom} ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
                  borderRadius: 100, cursor: 'pointer', outline: 'none', border: 'none',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #fff; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 11, border: 'none',
  background: 'rgba(255,255,255,0.07)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'rgba(255,255,255,0.6)', WebkitTapHighlightColor: 'transparent',
}
