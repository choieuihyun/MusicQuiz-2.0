import { db } from './firebase'
import {
  collection, doc, setDoc,
  query, where, orderBy, limit, getDocs,
} from 'firebase/firestore'

export interface ScoreEntry {
  sessionId: string
  nickname: string
  eraId: string
  partId: string
  score: number
  total: number
  playedAt: number
}

// 점수 저장 (같은 유저+파트는 덮어씀 — 최고 점수 유지)
export async function saveScore(
  sessionId: string,
  nickname: string,
  eraId: string,
  partId: string,
  score: number,
  total: number
): Promise<void> {
  const docId = `${sessionId}_${eraId}_${partId}`
  const docRef = doc(db, 'scores', docId)

  // 기존 점수보다 높을 때만 업데이트
  const existing = await getDocs(
    query(collection(db, 'scores'), where('sessionId', '==', sessionId), where('eraId', '==', eraId), where('partId', '==', partId))
  )

  if (!existing.empty) {
    const prev = existing.docs[0].data() as ScoreEntry
    if (prev.score >= score) return // 기존 점수가 더 높으면 저장 안 함
  }

  await setDoc(docRef, {
    sessionId,
    nickname,
    eraId,
    partId,
    score,
    total,
    playedAt: Date.now(),
  })
}

// 파트별 랭킹 조회 (상위 10명)
// ※ 첫 실행 시 Firestore 복합 인덱스 생성 필요 — 콘솔 에러 링크 클릭
export async function getPartRanking(
  eraId: string,
  partId: string,
  limitCount = 10
): Promise<ScoreEntry[]> {
  const q = query(
    collection(db, 'scores'),
    where('eraId', '==', eraId),
    where('partId', '==', partId),
    orderBy('score', 'desc'),
    limit(limitCount)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => d.data() as ScoreEntry)
}
