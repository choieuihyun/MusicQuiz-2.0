export interface PartMeta {
  id: string
  label: string
  subtitle: string
  from: string
  to: string
  rgb: string
}

export const PARTS: PartMeta[] = [
  { id: '1', label: 'OPENING',  subtitle: '첫 번째 무대',  from: '#a855f7', to: '#6366f1', rgb: '168,85,247' },
  { id: '2', label: 'ENCORE',   subtitle: '두 번째 무대',  from: '#22d3ee', to: '#3b82f6', rgb: '34,211,238'  },
  { id: '3', label: 'SPOTLIGHT', subtitle: '세 번째 무대', from: '#f472b6', to: '#f43f5e', rgb: '244,114,182' },
  { id: '4', label: 'FINALE',   subtitle: '마지막 무대',   from: '#fbbf24', to: '#f97316', rgb: '251,191,36'  },
]

const FALLBACK: PartMeta = {
  id: '', label: 'PART', subtitle: '',
  from: 'rgba(255,255,255,0.4)', to: 'rgba(255,255,255,0.2)', rgb: '255,255,255',
}

export function partMeta(partId: string | undefined | null): PartMeta {
  return PARTS.find(p => p.id === partId) ?? FALLBACK
}
