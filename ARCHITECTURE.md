# MusicQuiz App — Architecture

## 개요

한국 가요 가사 빈칸 맞추기 퀴즈 앱. 연대(2000s/2010s/2020s)와 파트별로 문제를 풀고, 1인 솔로 또는 최대 10명 실시간 멀티플레이어로 경쟁할 수 있다. 점수는 Firestore에 저장되어 파트별 랭킹에 반영된다.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Vite + React 18 + TypeScript |
| 스타일링 | Tailwind CSS (`@tailwindcss/vite`) |
| 라우팅 | React Router v7 |
| 상태관리 | Zustand (localStorage persist) |
| 인증 | 닉네임 전용 (비밀번호 없음) + 어드민 코드 |
| 솔로 점수/랭킹 DB | Firebase Firestore |
| 멀티플레이어 실시간 동기화 | Firebase Realtime Database |
| 음악 파일 저장 | Firebase Storage (미연결) |
| 호스팅 | (미정) |

---

## 폴더 구조

```
src/
├── App.tsx                  # BrowserRouter + Routes
├── index.css                # Tailwind import + 커스텀 keyframe 애니메이션
├── main.tsx
│
├── pages/
│   ├── Home.tsx             # 연대 선택 화면 (아코디언 카드) ✅
│   ├── Quiz.tsx             # 솔로 퀴즈 진행 화면 ✅
│   ├── Ranking.tsx          # 파트별 랭킹 화면 (Firestore 연동) ✅
│   ├── Login.tsx            # 닉네임 입력 로그인 + 어드민 로그인 ✅
│   ├── Rooms.tsx            # 멀티플레이어 방 목록 화면 ✅
│   ├── Room.tsx             # 방 대기실 (홈 UI + 연대/파트 선택) ✅
│   ├── MultiQuiz.tsx        # 멀티플레이어 퀴즈 진행 화면 ✅
│   └── Lobby.tsx            # (미사용 — Rooms.tsx로 대체됨)
│
├── components/
│   └── MusicPlayer.tsx      # 음악 플레이어 컴포넌트 ✅
│
├── store/
│   └── playerStore.ts       # 세션ID / 닉네임 / isAdmin / 현재 방코드 ✅
│
├── lib/
│   ├── firebase.ts          # Firebase 초기화 (Firestore + Realtime DB + Storage)
│   ├── firestore.ts         # Firestore CRUD — saveScore, getPartRanking ✅
│   ├── realtimeDB.ts        # Realtime DB — 방 관리 + 닉네임 중복 방지 ✅
│   ├── mockQuizData.ts      # Firebase 연동 전 임시 퀴즈 데이터
│   └── mockRankingData.ts   # (미사용 — Firestore로 교체됨)
│
└── types/
    └── quiz.ts              # QuizQuestion, QuizOption, QuizSet 타입
```

---

## 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Home | 연대/파트 선택 (솔로) ✅ |
| `/quiz/:eraId/:partId` | Quiz | 솔로 퀴즈 진행 ✅ |
| `/ranking` | Ranking | 파트별 랭킹 (Firestore) ✅ |
| `/login` | Login | 닉네임 입력 / 어드민 로그인 ✅ |
| `/rooms` | Rooms | 멀티플레이 방 목록 + 생성 ✅ |
| `/room/:roomCode` | Room | 대기실 + 연대/파트 선택 ✅ |
| `/multi/:roomCode` | MultiQuiz | 멀티플레이어 퀴즈 진행 ✅ |

---

## Firebase 설계

### 인증
- Firebase Auth 미사용
- 닉네임 + sessionId (로컬스토리지 persist) 기반
- 어드민: 로그인 시 관리자 코드 입력으로 권한 부여 (`isAdmin: boolean`)

---

### Realtime Database — 멀티플레이어 방 + 닉네임

```
nicknames/{nickname}
  ├─ sessionId: string
  └─ updatedAt: number

rooms/{roomCode}
  ├─ roomCode: string
  ├─ hostId: string
  ├─ hostName: string          # 방장 퇴장 후에도 이름 유지용
  ├─ eraId: string             # 방장이 Room 화면에서 선택
  ├─ partId: string            # 방장이 Room 화면에서 선택
  ├─ status: "waiting" | "playing" | "result" | "finished"
  ├─ currentQuestion: number
  ├─ questionStartedAt: number | null
  ├─ timeLimit: number
  ├─ createdAt: number
  │
  └─ players/{sessionId}
      ├─ displayName: string
      ├─ score: number
      ├─ submitted: boolean
      └─ answer?: number | null
```

**멀티플레이어 흐름**
```
/login (닉네임 입력 + 중복 체크)
→ /rooms (방 목록 실시간 구독)
→ 방 생성 or 방 클릭 입장
→ /room/:roomCode (홈 UI — 방장이 연대/파트 선택, 전원 실시간 동기화)
→ 방장 "게임 시작" 클릭 → status: playing
→ /multi/:roomCode (실시간 퀴즈 진행)
→ 전원 제출 → 정답 공개 → 방장이 다음 문제 진행
→ 마지막 문제 후 결과 화면 → Firestore 점수 저장
```

---

### Firestore — 솔로/멀티 점수 / 랭킹

```
scores/{sessionId}_{eraId}_{partId}
  ├─ sessionId: string
  ├─ nickname: string
  ├─ eraId: string          # "2000s" | "2010s" | "2020s"
  ├─ partId: string         # "1" | "2" | "3"
  ├─ score: number          # 맞힌 문제 수 (최고 점수만 저장)
  ├─ total: number          # 전체 문제 수
  └─ playedAt: number       # timestamp
```

**파트별 랭킹 쿼리**
```ts
query(
  collection(db, 'scores'),
  where('eraId', '==', eraId),
  where('partId', '==', partId),
  orderBy('score', 'desc'),
  limit(10)
)
// ※ (eraId, partId, score) 복합 인덱스 필요
```

---

### Firebase Storage — 음악 파일 (미연결)

```
music/{eraId}/{partId}/{songTitle}.mp3
```
- 플레이어에서 해당 경로의 다운로드 URL을 가져와 `MusicPlayer` `src`에 주입

---

## 데이터 타입

```ts
// src/types/quiz.ts
interface QuizQuestion {
  id: string
  lyrics: string      // 빈칸은 (  ) 표기
  song: string
  artist: string
  options: { id: number; text: string }[]  // 5개
  correctId: number
}

// src/lib/realtimeDB.ts
interface Room {
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

interface Player {
  displayName: string
  score: number
  submitted: boolean
  answer?: number | null
}

// src/lib/firestore.ts
interface ScoreEntry {
  sessionId: string
  nickname: string
  eraId: string
  partId: string
  score: number
  total: number
  playedAt: number
}

// src/store/playerStore.ts
interface PlayerState {
  sessionId: string    // 자동 생성, localStorage persist
  nickname: string
  isAdmin: boolean
  currentRoomCode: string | null
}
```

---

## 디자인 시스템

- **배경**: 딥 퍼플/네이비 `radial-gradient`
- **카드**: glassmorphism (`backdrop-blur` + `rgba` 배경 + 다중 `box-shadow`)
- **포인트 컬러**:
  - 2000s: 보라 `#a855f7`
  - 2010s: 시안 `#22d3ee`
  - 2020s: 핑크 `#f472b6`
- **애니메이션**: `badgePulse`, `cardFloat`, `fadeSlideUp`, `correctBurst`, `wrongShake`, `flashOverlay`, `resultPop`, `confetti0~11`
- **입체감**: inset 하이라이트 + 컬러 글로우 그림자

---

## 구현 로드맵

### 1단계 — 기반 작업
- [x] Vite + React + TS + Tailwind 세팅
- [x] Home 화면 (연대 아코디언 카드)
- [x] 솔로 Quiz 화면 (정답 확인 애니메이션 포함)
- [x] MusicPlayer 컴포넌트
- [x] 파트별 랭킹 화면
- [x] Firebase `.env.local` 세팅 및 연결
- [x] 닉네임 기반 로그인 (비밀번호 없음 + 어드민 코드)

### 2단계 — 솔로 모드 완성
- [x] 퀴즈 완료 시 점수 Firestore 저장 (최고 점수 유지)
- [x] 랭킹 Firestore 실데이터 연결
- [ ] Firestore 퀴즈 데이터 로드 (mockData 교체)
- [ ] Firebase Storage 음악 업로드 + 플레이어 연결
- [ ] 실제 퀴즈 문제 데이터 입력

### 3단계 — 멀티플레이어
- [x] 방 목록 화면 (Rooms.tsx)
- [x] 방 생성 / 입장 (realtimeDB.ts)
- [x] 실시간 플레이어 목록 동기화
- [x] 방 화면에서 연대/파트 선택 동기화
- [x] MultiQuiz 퀴즈 진행 + 결과 화면
- [ ] MultiQuiz 타이머 UI (questionStartedAt 기반 카운트다운)
- [ ] 멀티플레이 종료 시 Firestore 점수 저장
- [ ] Security Rules 설정 (RTDB + Firestore)
