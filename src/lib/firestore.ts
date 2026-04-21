import { db, storage } from './firebase'
import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import type { QuizQuestion } from '../types/quiz'

export interface ScoreEntry {
  sessionId: string
  nickname: string
  photoURL?: string
  partId: string
  score: number
  total: number
  playedAt: number
}

// 점수 저장 (같은 유저+파트는 덮어씀 — 최고 점수 유지)
export async function saveScore(
  sessionId: string,
  nickname: string,
  partId: string,
  score: number,
  total: number,
  photoURL: string = ''
): Promise<void> {
  const docId = `${sessionId}_${partId}`
  const docRef = doc(db, 'scores', docId)

  try {
    const existing = await getDoc(docRef)
    if (existing.exists()) {
      const prev = existing.data() as ScoreEntry
      if (prev.score >= score) {
        console.log('[점수 저장 스킵] 기존 점수가 더 높음', { prev: prev.score, new: score })
        return
      }
    }

    await setDoc(docRef, {
      sessionId,
      nickname,
      photoURL,
      partId,
      score,
      total,
      playedAt: Date.now(),
    })
    console.log('[점수 저장 성공]', { docId, score, total, partId })
  } catch (err) {
    console.error('[점수 저장 실패]', err)
    throw err
  }
}

// 파트별 랭킹 조회 (상위 10명)
// ※ 첫 실행 시 Firestore 복합 인덱스 생성 필요 — 콘솔 에러 링크 클릭
export async function getPartRanking(
  partId: string,
  limitCount = 10
): Promise<ScoreEntry[]> {
  try {
    const q = query(
      collection(db, 'scores'),
      where('partId', '==', partId),
      orderBy('score', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    const entries = snapshot.docs.map(d => d.data() as ScoreEntry)
    console.log('[랭킹 조회 성공] partId=' + partId, entries.length + '명')
    return entries
  } catch (err) {
    console.error('[랭킹 조회 실패] — 복합 인덱스 필요 시 에러 메시지의 링크 클릭', err)
    throw err
  }
}

// 파트별 퀴즈 문제 로드
export async function getPartQuestions(partId: string): Promise<QuizQuestion[]> {
  const snapshot = await getDocs(collection(db, 'quizzes', partId, 'questions'))
  return snapshot.docs.map(d => d.data() as QuizQuestion)
}

// 음악 파일 Storage URL 조회 — secondMusicQuiz/{songTitle}.mp3
export async function getMusicURL(_partId: string, songTitle: string): Promise<string> {
  const storageRef = ref(storage, `secondMusicQuiz/${songTitle}.mp3`)
  return getDownloadURL(storageRef)
}
