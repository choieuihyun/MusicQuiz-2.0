# MusicQuiz App — Architecture

## 개요

한국 가요 가사 빈칸 맞추기 퀴즈 앱. **4개 파트**(Part.1 ~ Part.4)로 나뉜 문제를 최대 10명 실시간 멀티플레이어로 경쟁한다. 점수는 Firestore에 저장되어 파트별 랭킹에 반영된다. (연대 분류는 2026-04-16 제거됨)

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
│   ├── Landing.tsx          # 로그인 후 랜딩 (방 생성 / 방 참여) ✅
│   ├── Home.tsx             # 방 생성 플로우 — 파트(1~4) 선택 → 방 만들기 ✅
│   ├── Ranking.tsx          # 파트별 랭킹 화면 (Firestore + 프로필 사진) ✅
│   ├── Login.tsx            # 닉네임 입력 + 프로필 사진 업로드 + 어드민 로그인 ✅
│   ├── Rooms.tsx            # 멀티플레이어 방 목록 (참여 전용, 파트 표기) ✅
│   ├── Room.tsx             # 방 대기실 (파트 확정 표시 + 참가자 목록) ✅
│   └── MultiQuiz.tsx        # 멀티플레이어 퀴즈 진행 화면 ✅
│
├── components/
│   └── MusicPlayer.tsx      # 음악 플레이어 컴포넌트 ✅
│
├── store/
│   └── playerStore.ts       # 세션ID / 닉네임 / photoURL / isAdmin / 현재 방코드 ✅
│
├── lib/
│   ├── firebase.ts          # Firebase 초기화 (Firestore + Realtime DB + Storage)
│   ├── firestore.ts         # Firestore CRUD — saveScore, getPartRanking, getPartQuestions ✅
│   ├── realtimeDB.ts        # Realtime DB — 방 관리 + 닉네임 중복 방지 + 재촉 + 채팅 ✅
│   └── parts.ts             # 파트 메타데이터 (4개 파트 id/label/컬러) ✅
│
└── types/
    └── quiz.ts              # QuizQuestion, QuizOption, QuizSet 타입

scripts/
└── importQuiz.mjs           # SQL 원본 50곡 → Firestore `quizzes/1/questions/*` 임포트 스크립트 ✅
```

---

## 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Landing | 랜딩 — 방 생성하기 / 방 참여하기 ✅ |
| `/create` | Home | 파트(1~4)/타이머 선택 → 방 만들기 ✅ |
| `/ranking` | Ranking | 파트별 랭킹 (Firestore + 프로필 사진) ✅ |
| `/login` | Login | 닉네임 입력 + 프로필 사진 / 어드민 로그인 ✅ |
| `/rooms` | Rooms | 멀티플레이 방 목록 (참여 전용) ✅ |
| `/room/:roomCode` | Room | 대기실 (파트 확정 표시 + 참가자 목록) ✅ |
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
  ├─ hostName: string
  ├─ partId: string            # 방 생성 시 확정 ("1" | "2" | "3" | "4")
  ├─ status: "waiting" | "playing" | "result" | "finished"
  ├─ currentQuestion: number
  ├─ questionStartedAt: number | null
  ├─ timeLimit: number         # 방 생성 시 선택 (10 / 15 / 20 / 30초)
  ├─ createdAt: number
  │
  └─ players/{sessionId}
      ├─ displayName: string
      ├─ photoURL?: string     # Firebase Storage URL
      ├─ score: number
      ├─ submitted: boolean
      └─ answer?: number | null

nudges/{roomCode}/{sessionId}
  ├─ from: string              # 재촉 보낸 sessionId
  ├─ fromName: string
  └─ timestamp: number

rooms/{roomCode}/chat/{pushId}
  ├─ sessionId: string
  ├─ displayName: string
  ├─ photoURL?: string
  ├─ message: string
  └─ timestamp: number

rooms/{roomCode}/bubbles/{sessionId}
  ├─ message: string           # 최신 메시지 (말풍선 표시용)
  └─ timestamp: number         # 5초 이내만 표시
```

**멀티플레이어 흐름**
```
/login (닉네임 + 프로필 사진 업로드)
→ / (랜딩 — 방 생성하기 / 방 참여하기)
→ 방 생성: /create (파트/타이머 선택) → createRoom → /room/:roomCode
→ 방 참여: /rooms (방 목록) → joinRoom → /room/:roomCode
→ /room/:roomCode (대기실 — 파트 확정 표시, 참가자 목록)
→ 방장 "게임 시작" 클릭 → status: playing
→ /multi/:roomCode (실시간 퀴즈 진행 — Firestore에서 파트별 문제 로드)
→ 전원 제출 or 타이머 만료 → 정답 공개 → 방장이 다음 문제 진행
→ 마지막 문제 후 결과 화면 → Firestore 점수 저장
```

---

### Firestore — 퀴즈 문제 + 점수/랭킹

- **데이터베이스 이름**: `musicquizdb` (Native 모드) — `getFirestore(app, 'musicquizdb')` 로 접속
- `(default)` 데이터베이스는 사용하지 않음 (최초 생성 시 Datastore 모드로 잘못 만들어져 삭제 후 재생성)

```
quizzes/{partId}/questions/{questionId}
  ├─ id: string
  ├─ song: string           # 곡명 (한글)
  ├─ artist: string
  ├─ lyrics: string         # 빈칸은 `(  )` 표기 (2 spaces)
  ├─ options: { id: number; text: string }[]   # 5개 선택지
  └─ correctId: number      # 1~5

scores/{sessionId}_{partId}
  ├─ sessionId: string
  ├─ nickname: string
  ├─ photoURL?: string      # Firebase Storage URL
  ├─ partId: string         # "1" | "2" | "3" | "4"
  ├─ score: number          # 맞힌 문제 수 (최고 점수만 저장)
  ├─ total: number          # 전체 문제 수
  └─ playedAt: number       # timestamp
```

**파트별 랭킹 쿼리**
```ts
query(
  collection(db, 'scores'),
  where('partId', '==', partId),
  orderBy('score', 'desc'),
  limit(10)
)
// ※ (partId, score) 복합 인덱스 필요
```

---

### Firebase Storage

```
profiles/{sessionId}         # 프로필 사진 (로그인 시 업로드) ✅
music/{partId}/{songTitle}.mp3   # 음악 파일 (미연결)
```
- 프로필 사진: 로그인 시 업로드 → `getDownloadURL()` → playerStore / RTDB / Firestore에 URL 저장
- 음악 파일: 해당 경로 다운로드 URL → `MusicPlayer` `src`에 주입 (미연결)

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
interface ChatMessage {
  sessionId: string
  displayName: string
  photoURL?: string
  message: string
  timestamp: number
}

interface Bubble {
  message: string
  timestamp: number
}

interface Room {
  roomCode: string
  hostId: string
  hostName: string
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
  photoURL?: string
  score: number
  submitted: boolean
  answer?: number | null
}

// src/lib/firestore.ts
interface ScoreEntry {
  sessionId: string
  nickname: string
  photoURL?: string
  partId: string
  score: number
  total: number
  playedAt: number
}

// src/store/playerStore.ts
interface PlayerState {
  sessionId: string    // 자동 생성, localStorage persist
  nickname: string
  photoURL: string     // Firebase Storage URL, localStorage persist
  isAdmin: boolean
  currentRoomCode: string | null
}
```

---

## 디자인 시스템

- **콘셉트**: "Neon Stage" — K-POP 콘서트 스테이지, 드라마틱한 글로우 + 강렬한 타이포그래피
- **배경**: `radial-gradient(ellipse at 35% -20%, #3d0a6e 0%, #150528 40%, #060412 75%)` + 페이지별 컬러 광원 레이어
- **카드**: glassmorphism (`backdrop-blur` + `rgba` 배경) + **좌측 4px 컬러 accent bar** + 다중 `box-shadow`
- **포인트 컬러 (파트별)**:
  - Part.1 OPENING — 바이올렛 `#a855f7 → #6366f1`
  - Part.2 ENCORE — 시안 `#22d3ee → #3b82f6`
  - Part.3 SPOTLIGHT — 핑크 `#f472b6 → #f43f5e`
  - Part.4 FINALE — 앰버 `#fbbf24 → #f97316`
- **폰트**:
  - 헤딩/버튼: `Black Han Sans` (`--font-display`)
  - 숫자/코드/태그: `Barlow Condensed` (`--font-number`)
  - 본문/입력: `Noto Sans KR` (`--font-body`)
- **레이블**: `UPPERCASE + letter-spacing` 통일
- **애니메이션**: `badgePulse`, `cardFloat`, `fadeSlideUp`, `correctBurst`, `wrongShake`, `flashOverlay`, `resultPop`, `confetti0~11`, `nudgeShake`, `timerPulse`
- **입체감**: inset 하이라이트 + 컬러 글로우 그림자 + 좌측 accent bar

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

### 2단계 — 퀴즈 콘텐츠
- [x] 퀴즈 완료 시 점수 Firestore 저장 (최고 점수 유지)
- [x] 랭킹 Firestore 실데이터 연결
- [x] Firestore 퀴즈 데이터 로드 (mockData 교체) — `getPartQuestions`
- [x] Part.1 문제 50곡 임포트 (`scripts/importQuiz.mjs`)
- [ ] Part.2 / Part.3 / Part.4 문제 데이터 입력
- [ ] Firebase Storage 음악 업로드 + 플레이어 연결

### 3단계 — 멀티플레이어
- [x] 방 목록 화면 (Rooms.tsx) — 파트 표기 포함
- [x] 방 생성 / 입장 (realtimeDB.ts)
- [x] 실시간 플레이어 목록 동기화
- [x] 방 생성 시 파트/타이머 선택 (Create 화면)
- [x] MultiQuiz 퀴즈 진행 + 결과 화면
- [x] MultiQuiz 타이머 UI (카운트다운 바, 5초 이하 빨간 강조)
- [x] 재촉 기능 (RTDB nudges + 사이드 드로어 버튼 + 알림 애니메이션)
- [x] 사이드 드로어 참가자 패널 (MultiQuiz)
- [x] 프로필 사진 (Firebase Storage + RTDB + Firestore + 랭킹)
- [x] 로그인 후 랜딩 페이지 (방 생성 / 방 참여 분리)
- [x] 멀티플레이 종료 시 Firestore 점수 저장
- [x] 전체 UI 리뉴얼 (Neon Stage 콘셉트 — 디스플레이 폰트 + accent bar + 강화된 glow)
- [x] 실시간 채팅 (대기실 + 퀴즈 중 — 말풍선 + 채팅창 + 미읽음 배지)
- [x] 연대 제거 + 4파트 구조 전환 (2026-04-16)
- [ ] Security Rules 설정 (RTDB + Firestore + Storage)
