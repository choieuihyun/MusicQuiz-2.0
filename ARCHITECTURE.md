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
| 상태관리 | Zustand |
| 인증 | Firebase Auth (Google 로그인) |
| 솔로 점수/랭킹 DB | Firebase Firestore |
| 멀티플레이어 실시간 동기화 | Firebase Realtime Database |
| 음악 파일 저장 | Firebase Storage |
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
│   ├── Ranking.tsx          # 파트별 랭킹 화면 ✅
│   ├── Login.tsx            # Google 로그인 화면 (예정)
│   ├── Lobby.tsx            # 멀티플레이어 방 생성/입장 화면 (예정)
│   └── MultiQuiz.tsx        # 멀티플레이어 퀴즈 화면 (예정)
│
├── components/
│   └── MusicPlayer.tsx      # 음악 플레이어 컴포넌트 ✅
│
├── store/                   # Zustand 스토어 (예정)
│   ├── authStore.ts         # 유저 인증 상태
│   └── quizStore.ts         # 퀴즈 진행 상태
│
├── hooks/                   # 커스텀 훅 (예정)
│   ├── useQuiz.ts
│   ├── useRoom.ts           # 멀티플레이어 방 상태 구독
│   └── useRanking.ts
│
├── lib/
│   ├── firebase.ts          # Firebase 초기화 (Firestore + Realtime DB + Storage)
│   ├── firestore.ts         # Firestore CRUD 함수 (예정)
│   ├── realtimeDB.ts        # Realtime DB 방 관련 함수 (예정)
│   ├── mockQuizData.ts      # Firebase 연동 전 임시 퀴즈 데이터
│   └── mockRankingData.ts   # Firebase 연동 전 임시 랭킹 데이터
│
└── types/
    ├── quiz.ts              # QuizQuestion, QuizOption, QuizSet 타입
    └── room.ts              # Room, Player, RoomStatus 타입 (예정)
```

---

## 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Home | 연대/파트 선택 |
| `/quiz/:eraId/:partId` | Quiz | 솔로 퀴즈 진행 |
| `/ranking` | Ranking | 파트별 랭킹 (연대/파트 탭 내장) ✅ |
| `/login` | Login | Google 로그인 (예정) |
| `/lobby` | Lobby | 방 생성 또는 코드 입력 입장 (예정) |
| `/room/:roomId` | MultiQuiz | 멀티플레이어 퀴즈 진행 (예정) |

---

## Firebase 설계

### Authentication
- Google 로그인 단일 방식
- `uid`, `displayName`, `photoURL` 사용

---

### Firestore — 솔로 점수 / 랭킹

```
users/{uid}
  ├─ displayName: string
  └─ photoURL: string

scores/{uid}_{eraId}_{partId}
  ├─ uid: string
  ├─ displayName: string
  ├─ eraId: string          # "2000s" | "2010s" | "2020s"
  ├─ partId: string         # "1" | "2" | "3"
  ├─ score: number          # 맞힌 문제 수
  ├─ total: number          # 전체 문제 수
  └─ playedAt: Timestamp

quizzes/{eraId}_{partId}
  └─ questions: QuizQuestion[]
```

**파트별 랭킹 쿼리**
```ts
db.collection("scores")
  .where("eraId", "==", eraId)
  .where("partId", "==", partId)
  .orderBy("score", "desc")
  .limit(10)
```

---

### Realtime Database — 멀티플레이어 방

```
rooms/{roomId}
  ├─ hostUid: string
  ├─ eraId: string
  ├─ partId: string
  ├─ status: "waiting" | "playing" | "result" | "finished"
  ├─ currentQuestion: number
  ├─ questionStartedAt: number    # 서버 타임스탬프 — 모든 클라이언트 타이머 기준
  ├─ timeLimit: number            # 문제당 제한 시간 (초)
  │
  ├─ players/{uid}
  │   ├─ displayName: string
  │   ├─ score: number
  │   └─ submitted: boolean       # 현재 문제 제출 여부
  │
  └─ answers/{questionIdx}/{uid}
      ├─ optionId: number
      └─ correct: boolean
```

**멀티플레이어 흐름**
```
호스트 방 생성 → 6자리 roomId 공유
→ 참가자 입장 (최대 10명)
→ 호스트 시작
→ 전원 questionStartedAt 기준 동일한 타이머로 카운트다운
→ 각자 답 제출 (submitted: true)
→ 전원 제출 or 시간 초과 → 정답 공개 + 점수 갱신
→ 호스트가 다음 문제로 진행
→ 종료 시 Firestore scores에 최종 점수 저장
```

**Security Rules 핵심**
- `questionStartedAt + timeLimit` 초과 후 answers write 거부 (늦은 제출 차단)
- `players` write는 본인 uid만 가능
- `currentQuestion`, `status` 변경은 hostUid만 가능

---

### Firebase Storage — 음악 파일

```
music/{eraId}/{partId}/{songTitle}.mp3
```
- 플레이어에서 해당 경로의 다운로드 URL을 가져와 `MusicPlayer` `src`에 주입

---

## 데이터 타입

```ts
interface QuizQuestion {
  id: string
  lyrics: string      // 빈칸은 (  ) 표기
  song: string
  artist: string
  options: { id: number; text: string }[]  // 5개
  correctId: number
}

interface Room {
  hostUid: string
  eraId: string
  partId: string
  status: 'waiting' | 'playing' | 'result' | 'finished'
  currentQuestion: number
  questionStartedAt: number
  timeLimit: number
  players: Record<string, Player>
}

interface Player {
  displayName: string
  score: number
  submitted: boolean
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
- [x] 파트별 랭킹 화면 (mock 데이터)
- [ ] Firebase `.env.local` 세팅 및 연결
- [ ] Google 로그인

### 2단계 — 솔로 모드 완성
- [ ] Firestore 퀴즈 데이터 로드 (mockData 교체)
- [ ] Firebase Storage 음악 업로드 + 플레이어 연결
- [ ] 퀴즈 완료 시 점수 Firestore 저장
- [ ] 랭킹 Firestore 실데이터 연결
- [ ] 실제 퀴즈 문제 데이터 입력

### 3단계 — 멀티플레이어
- [ ] Realtime DB 방 생성 / 입장 (Lobby 화면)
- [ ] 실시간 플레이어 목록 동기화
- [ ] 동기화된 타이머 + 문제 진행
- [ ] 실시간 점수판
- [ ] 게임 종료 시 Firestore 점수 저장
- [ ] Security Rules 설정 (제출 시간 제한, 권한 분리)
