import { rtdb } from './firebase'
import { ref, set, get, onValue, update, remove, off, runTransaction } from 'firebase/database'

// 6자리 룸 코드 생성
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 헷갈리는 0,O,1,I 제외
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 세션 ID 생성 (익명 유저 구분용)
export function generateSessionId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export interface Player {
  displayName: string
  score: number
  submitted: boolean
  answer?: number | null
}

export interface Room {
  roomCode: string
  hostId: string
  hostName: string
  eraId: string
  partId: string
  status: 'waiting' | 'playing' | 'result' | 'finished'
  currentQuestion: number
  questionStartedAt: number | null
  timeLimit: number
  players: Record<string, Player>
  createdAt: number
}

// 방 생성
export async function createRoom(
  hostId: string,
  hostName: string,
  eraId: string = '',
  partId: string = ''
): Promise<string> {
  const roomCode = generateRoomCode()
  const roomRef = ref(rtdb, `rooms/${roomCode}`)

  // 이미 존재하는 코드인지 확인
  const snapshot = await get(roomRef)
  if (snapshot.exists()) {
    // 재귀로 다시 생성 (충돌 시)
    return createRoom(hostId, hostName, eraId, partId)
  }

  const room: Room = {
    roomCode,
    hostId,
    hostName,
    eraId,
    partId,
    status: 'waiting',
    currentQuestion: 0,
    questionStartedAt: null,
    timeLimit: 15,
    players: {
      [hostId]: {
        displayName: hostName,
        score: 0,
        submitted: false,
      }
    },
    createdAt: Date.now(),
  }

  await set(roomRef, room)
  return roomCode
}

// 방 참가
export async function joinRoom(
  roomCode: string,
  playerId: string,
  playerName: string
): Promise<Room | null> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    return null // 방 없음
  }

  const room = snapshot.val() as Room

  if (room.status !== 'waiting') {
    throw new Error('이미 게임이 시작된 방입니다')
  }

  const playerCount = Object.keys(room.players || {}).length
  if (playerCount >= 10) {
    throw new Error('방이 가득 찼습니다 (최대 10명)')
  }

  // 플레이어 추가
  const playerRef = ref(rtdb, `rooms/${roomCode}/players/${playerId}`)
  await set(playerRef, {
    displayName: playerName,
    score: 0,
    submitted: false,
  })

  return { ...room, players: { ...room.players, [playerId]: { displayName: playerName, score: 0, submitted: false } } }
}

// 방 나가기
export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
  const playerRef = ref(rtdb, `rooms/${roomCode}/players/${playerId}`)
  await remove(playerRef)
}

// 방 정보 가져오기
export async function getRoom(roomCode: string): Promise<Room | null> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  const snapshot = await get(roomRef)
  return snapshot.exists() ? snapshot.val() as Room : null
}

// 방 실시간 구독
export function subscribeToRoom(
  roomCode: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() as Room : null)
  })

  return () => off(roomRef)
}

// 게임 시작 (호스트만)
export async function startGame(roomCode: string): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  await update(roomRef, {
    status: 'playing',
    currentQuestion: 0,
    questionStartedAt: Date.now(),
  })
}

// 다음 문제로 이동
export async function nextQuestion(roomCode: string, questionIndex: number): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)

  // 모든 플레이어 submitted 초기화
  const room = await getRoom(roomCode)
  if (!room) return

  const updates: Record<string, unknown> = {
    currentQuestion: questionIndex,
    questionStartedAt: Date.now(),
  }

  // 모든 플레이어 submitted, answer 초기화
  Object.keys(room.players ?? {}).forEach(playerId => {
    updates[`players/${playerId}/submitted`] = false
    updates[`players/${playerId}/answer`] = null
  })

  await update(roomRef, updates)
}

// 답 제출
export async function submitAnswer(
  roomCode: string,
  playerId: string,
  answer: number,
  isCorrect: boolean
): Promise<void> {
  const playerRef = ref(rtdb, `rooms/${roomCode}/players/${playerId}`)
  const room = await getRoom(roomCode)
  if (!room) return

  const currentScore = room.players[playerId]?.score || 0

  await update(playerRef, {
    submitted: true,
    answer,
    score: isCorrect ? currentScore + 1 : currentScore,
  })
}

// 결과 화면으로 전환
export async function showResult(roomCode: string): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  await update(roomRef, { status: 'result' })
}

// 게임 종료
export async function finishGame(roomCode: string): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  await update(roomRef, { status: 'finished' })
}

// 방 삭제
export async function deleteRoom(roomCode: string): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  await remove(roomRef)
}

// 전체 방 목록 실시간 구독
export function subscribeToRooms(
  callback: (rooms: Record<string, Room>) => void
): () => void {
  const roomsRef = ref(rtdb, 'rooms')
  onValue(roomsRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as Record<string, Room>) : {})
  })
  return () => off(roomsRef)
}

// 닉네임 등록 (트랜잭션으로 중복 방지)
// 반환: 'ok' = 등록 성공, 'taken' = 이미 사용 중
export async function registerNickname(
  nickname: string,
  sessionId: string
): Promise<'ok' | 'taken'> {
  const nicknameRef = ref(rtdb, `nicknames/${nickname}`)
  let result: 'ok' | 'taken' = 'taken'

  await runTransaction(nicknameRef, (current) => {
    if (current === null || current.sessionId === sessionId) {
      result = 'ok'
      return { sessionId, updatedAt: Date.now() }
    }
    result = 'taken'
    return // 트랜잭션 중단
  })

  return result
}

// 닉네임 해제
export async function releaseNickname(nickname: string): Promise<void> {
  const nicknameRef = ref(rtdb, `nicknames/${nickname}`)
  await remove(nicknameRef)
}

// 연대/파트 선택 업데이트 (호스트만)
export async function updateRoomSelection(
  roomCode: string,
  eraId: string,
  partId: string
): Promise<void> {
  const roomRef = ref(rtdb, `rooms/${roomCode}`)
  await update(roomRef, { eraId, partId })
}
