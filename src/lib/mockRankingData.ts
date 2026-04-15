export interface RankingEntry {
  uid: string
  displayName: string
  score: number
  total: number
  playedAt: string
}

export type RankingData = Record<string, Record<string, RankingEntry[]>>
// RankingData[eraId][partId] = RankingEntry[]

export const MOCK_RANKINGS: RankingData = {
  '2000s': {
    '1': [
      { uid: 'u1', displayName: '별빛수집가', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u2', displayName: '노래천재', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u3', displayName: '가사달인', score: 9, total: 10, playedAt: '2025-04-12' },
      { uid: 'u4', displayName: '음악소년', score: 8, total: 10, playedAt: '2025-04-11' },
      { uid: 'u5', displayName: '멜로디킹', score: 7, total: 10, playedAt: '2025-04-10' },
      { uid: 'u6', displayName: '노래방고수', score: 6, total: 10, playedAt: '2025-04-09' },
      { uid: 'u7', displayName: '뮤직러버', score: 5, total: 10, playedAt: '2025-04-08' },
    ],
    '2': [
      { uid: 'u3', displayName: '가사달인', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u1', displayName: '별빛수집가', score: 8, total: 10, playedAt: '2025-04-13' },
      { uid: 'u5', displayName: '멜로디킹', score: 8, total: 10, playedAt: '2025-04-12' },
      { uid: 'u2', displayName: '노래천재', score: 7, total: 10, playedAt: '2025-04-11' },
      { uid: 'u6', displayName: '노래방고수', score: 5, total: 10, playedAt: '2025-04-10' },
    ],
    '3': [
      { uid: 'u2', displayName: '노래천재', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u4', displayName: '음악소년', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u7', displayName: '뮤직러버', score: 7, total: 10, playedAt: '2025-04-12' },
      { uid: 'u1', displayName: '별빛수집가', score: 6, total: 10, playedAt: '2025-04-11' },
    ],
  },
  '2010s': {
    '1': [
      { uid: 'u5', displayName: '멜로디킹', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u1', displayName: '별빛수집가', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u8', displayName: '한류팬', score: 8, total: 10, playedAt: '2025-04-12' },
      { uid: 'u2', displayName: '노래천재', score: 8, total: 10, playedAt: '2025-04-11' },
      { uid: 'u9', displayName: 'KPOP마스터', score: 7, total: 10, playedAt: '2025-04-10' },
      { uid: 'u3', displayName: '가사달인', score: 6, total: 10, playedAt: '2025-04-09' },
    ],
    '2': [
      { uid: 'u9', displayName: 'KPOP마스터', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u8', displayName: '한류팬', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u5', displayName: '멜로디킹', score: 7, total: 10, playedAt: '2025-04-12' },
      { uid: 'u6', displayName: '노래방고수', score: 6, total: 10, playedAt: '2025-04-11' },
    ],
    '3': [
      { uid: 'u8', displayName: '한류팬', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u3', displayName: '가사달인', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u1', displayName: '별빛수집가', score: 8, total: 10, playedAt: '2025-04-12' },
      { uid: 'u9', displayName: 'KPOP마스터', score: 7, total: 10, playedAt: '2025-04-11' },
      { uid: 'u7', displayName: '뮤직러버', score: 5, total: 10, playedAt: '2025-04-10' },
    ],
  },
  '2020s': {
    '1': [
      { uid: 'u9', displayName: 'KPOP마스터', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u2', displayName: '노래천재', score: 10, total: 10, playedAt: '2025-04-13' },
      { uid: 'u8', displayName: '한류팬', score: 9, total: 10, playedAt: '2025-04-12' },
      { uid: 'u4', displayName: '음악소년', score: 8, total: 10, playedAt: '2025-04-11' },
      { uid: 'u1', displayName: '별빛수집가', score: 7, total: 10, playedAt: '2025-04-10' },
      { uid: 'u5', displayName: '멜로디킹', score: 6, total: 10, playedAt: '2025-04-09' },
    ],
    '2': [
      { uid: 'u4', displayName: '음악소년', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u9', displayName: 'KPOP마스터', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u6', displayName: '노래방고수', score: 8, total: 10, playedAt: '2025-04-12' },
      { uid: 'u2', displayName: '노래천재', score: 7, total: 10, playedAt: '2025-04-11' },
      { uid: 'u7', displayName: '뮤직러버', score: 5, total: 10, playedAt: '2025-04-10' },
    ],
    '3': [
      { uid: 'u6', displayName: '노래방고수', score: 10, total: 10, playedAt: '2025-04-14' },
      { uid: 'u4', displayName: '음악소년', score: 9, total: 10, playedAt: '2025-04-13' },
      { uid: 'u9', displayName: 'KPOP마스터', score: 8, total: 10, playedAt: '2025-04-12' },
      { uid: 'u3', displayName: '가사달인', score: 7, total: 10, playedAt: '2025-04-11' },
      { uid: 'u7', displayName: '뮤직러버', score: 6, total: 10, playedAt: '2025-04-10' },
    ],
  },
}
