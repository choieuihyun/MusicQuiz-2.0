import { rtdb } from './firebase'
import { ref, set, get, push } from 'firebase/database'

// 테스트용 — 브라우저 콘솔에서 실행
export async function testWrite() {
  const testRef = ref(rtdb, 'test/hello')
  await set(testRef, {
    message: 'Firebase Realtime DB 연결 성공!',
    timestamp: Date.now(),
  })
  console.log('✅ Write 성공')
}

export async function testRead() {
  const testRef = ref(rtdb, 'test/hello')
  const snapshot = await get(testRef)
  if (snapshot.exists()) {
    console.log('✅ Read 성공:', snapshot.val())
    return snapshot.val()
  } else {
    console.log('❌ 데이터 없음')
    return null
  }
}

// 방 생성 테스트
export async function testCreateRoom() {
  const roomsRef = ref(rtdb, 'rooms')
  const newRoomRef = push(roomsRef)
  const roomId = newRoomRef.key

  await set(newRoomRef, {
    hostUid: 'test-user-123',
    eraId: '2000s',
    partId: '1',
    status: 'waiting',
    currentQuestion: 0,
    questionStartedAt: null,
    timeLimit: 15,
    players: {
      'test-user-123': {
        displayName: '테스트유저',
        score: 0,
        submitted: false,
      }
    },
    createdAt: Date.now(),
  })

  console.log('✅ Room 생성 성공, roomId:', roomId)
  return roomId
}
