# MusicQuiz — 개발 일지

---

## 2026-04-15

### 초기 세팅
- Vite + React + TypeScript + Tailwind CSS (`@tailwindcss/vite`) 프로젝트 초기화
- Firebase (Auth / Firestore / Storage) 패키지 설치 및 `lib/firebase.ts` 초기화
- React Router v7, Zustand 설치
- WSL2 환경 HMR 이슈 해결 → `vite.config.ts`에 `server.watch.usePolling: true` 추가

### 홈 화면 (`Home.tsx`)
- 딥 퍼플/네이비 `radial-gradient` 배경
- 연대 3개 (2000s / 2010s / 2020s) 아코디언 카드
- glassmorphism 카드 + 상단 컬러 그라데이션 바 + 컬러 글로우 그림자
- 탭 시 Part.1 / 2 / 3 아코디언 펼침 (스프링 바운스 애니메이션)
- 뱃지 `badgePulse` 글로우 (3초), 열린 카드 `cardFloat` 부유 (4초)
- Part 클릭 → `/quiz/:eraId/:partId` 이동

### 퀴즈 화면 (`Quiz.tsx`)
- 상단 뒤로가기 버튼 + 진행률 바 + 문제 번호
- 가사 빈칸 `(  )` → `?` 박스로 강조 렌더링 (`renderLyrics`)
- 5개 객관식 선택지
- `mockQuizData.ts` 임시 문제 데이터 연결

### 타입 / 데이터
- `src/types/quiz.ts` — `QuizQuestion`, `QuizOption`, `QuizSet` 타입 정의
- `src/lib/mockQuizData.ts` — Firebase 연동 전 임시 문제 3개

### 문서
- `ARCHITECTURE.md` 생성 — 기술 스택, 폴더 구조, 라우팅, Firestore 설계, 로드맵
- `CLAUDE.md` 생성 — 프로젝트 설명, 기술 스택, ARCHITECTURE.md 업데이트 규칙, 코딩/디자인 규칙

### 랭킹 시스템
- `src/lib/mockRankingData.ts` — 연대/파트별 예제 랭킹 데이터 (9개 파트 × 최대 7명)
- `src/pages/Ranking.tsx` — 랭킹 페이지
  - 연대 탭 (2000s / 2010s / 2020s) + 파트 탭 (Part.1 / 2 / 3)
  - TOP 3 금/은/동 메달 + 컬러 글로우 강조
  - 점수 바 + 정답률 % 표시
- `App.tsx` — `/ranking` 라우트 추가
- `Home.tsx` — 우측 상단 🏆 랭킹 버튼 추가

### 뮤직 플레이어
- `src/components/MusicPlayer.tsx` 컴포넌트 생성
  - 재생 / 일시정지, 이전곡 / 다음곡 버튼
  - 시크 바 + 현재시간 / 전체시간 표시
  - 볼륨 슬라이더 (팝업 형태)
  - 재생 중 앨범 아이콘 회전 애니메이션
  - Firebase Storage URL 연결 전까지 `src: ''` 비활성화 상태 유지
- `Quiz.tsx` — 퀴즈 화면 상단에 플레이어 삽입, 트랙 목록은 문제 데이터 기반 자동 생성

### 정답 확인 애니메이션
- 퀴즈 UX 변경: 선택 즉시 공개 → **"정답 확인" 버튼** 누를 때 공개
- `index.css` 애니메이션 추가
  - `correctBurst` — 정답 카드 스케일 업 + 초록 글로우 링 확산
  - `wrongShake` — 오답 카드 좌우 흔들기
  - `flashOverlay` — 화면 전체 컬러 플래시 (정답: 초록 / 오답: 빨강)
  - `resultPop` — "🎉 정답!" / "😢 오답!" 팝업 바운스 등장
  - `confetti0~11` — 컨페티 파티클 12개 (정답 시 폭죽 연출)
- `Quiz.tsx` — `revealed` 상태 추가, 플래시 오버레이 / 컨페티 / 결과 팝업 렌더링

### 아키텍처 설계 확장
- 멀티플레이어 구조 논의 (4~10명 실시간 경쟁)
  - Firebase Realtime DB 기반 방 시스템으로 결정 (별도 서버 불필요)
  - `rooms/{roomId}` 구조: status / currentQuestion / questionStartedAt / players / answers
  - 타이머 동기화: `questionStartedAt` 서버 타임스탬프 기준
  - Security Rules로 시간 초과 제출 차단 / 호스트 권한 분리
- `ARCHITECTURE.md` 대폭 업데이트
  - Realtime DB / Storage 기술 스택 추가
  - 멀티플레이어 흐름 / Security Rules / Room 타입 추가
  - 로드맵 3단계로 재구성 (기반 → 솔로 완성 → 멀티플레이어)
- `DEVLOG.md` 생성 — 날짜별 작업 일지

### 버그 수정
- `types/quiz.ts`의 인터페이스를 `import { }` 로 가져오던 것을 `import type { }` 으로 수정
  - `mockQuizData.ts`, `Quiz.tsx` 두 곳 수정
  - 원인: TypeScript interface는 런타임에 사라지므로 Vite가 named export를 찾지 못함

---

## 2026-04-15 (2차)

### Firebase 연결
- `.env.local` 생성 — Firebase 프로젝트 환경변수 세팅 완료
- `firebase.ts` — 미사용 Auth 초기화 제거 (`CONFIGURATION_NOT_FOUND` 에러 해결)
- Firebase Realtime Database 보안 규칙 `.read / .write: true` 설정

### 멀티플레이어 전체 흐름 구현

**로그인 화면 (`Login.tsx`)**
- 닉네임만 입력 (비밀번호 없음) → `/rooms` 이동
- 하단 "관리자 로그인" 토글 → 관리자 코드 입력 시 어드민 권한 부여
- 어드민 코드: `MUSICQUIZ_ADMIN` (코드 내 상수로 관리)

**방 목록 화면 (`Rooms.tsx`)**
- Firebase RTDB `rooms/` 실시간 구독 — `waiting` 상태 방만 표시
- 방 만들기 버튼 → 방 생성 후 `/room/:roomCode` 이동
- 방 카드 클릭 → 참가 후 `/room/:roomCode` 이동
- 솔로 플레이 버튼 → `/` 이동
- 어드민 계정: 각 방 카드에 🗑️ 삭제 버튼 노출

**방 화면 (`Room.tsx`) 전면 재작성**
- 기존 대기실 UI → 현재 홈 화면(연대/파트 선택) UI로 교체
- 상단 참가자 칩 스트립 (👑 방장 / 🎤 참가자 구분)
- 방장: 연대 카드 → 파트 클릭 시 RTDB에 `eraId / partId` 저장 → 실시간 동기화
- 참가자: 방장 선택 내용 실시간 반영, 선택지 비활성화
- 방장 + 선택 완료 시 하단 고정 "게임 시작 (N명) →" 버튼 노출
- 게임 시작 → `status: playing` → 전원 `/multi/:roomCode` 자동 이동
- 방 코드 우상단 표시 / 나가기 버튼

### realtimeDB.ts 기능 추가
- `subscribeToRooms()` — 전체 방 목록 실시간 구독
- `updateRoomSelection()` — 방장의 연대/파트 선택 RTDB 반영
- `createRoom()` — `eraId / partId` 선택 선택사항으로 변경 (기본값 `''`)
- `Room` 인터페이스에 `hostName` 필드 추가 — 방장 퇴장 후에도 이름 유지

### playerStore.ts
- `isAdmin: boolean` 상태 추가 (로컬스토리지 persist 포함)
- `setAdmin()` 액션 추가

### App.tsx 라우트 추가
- `/login` → `Login`
- `/rooms` → `Rooms`
- 기존 `/lobby` 라우트 제거

### Home.tsx
- 멀티플레이 버튼 링크 `/lobby` → `/rooms` 변경

### 버그 수정
- `Object.entries(room.players)` — players가 빈 상태일 때 null/undefined 에러 → `?? {}` 처리 (`Room.tsx`, `MultiQuiz.tsx`, `realtimeDB.ts`)
- 방장 나가기 시 `deleteRoom` 호출하던 로직 제거 → 방 유지되도록 수정

---

---

## 2026-04-15 (3차)

### 닉네임 중복 방지 (RTDB 트랜잭션)

**`realtimeDB.ts`**
- `registerNickname(nickname, sessionId)` 추가 — Firebase RTDB `runTransaction` 으로 원자적 중복 체크
  - `nicknames/{nickname}` 경로에 다른 sessionId가 이미 있으면 `'taken'` 반환
  - 없거나 본인 세션이면 `sessionId` + `updatedAt` 기록 후 `'ok'` 반환
- `releaseNickname(nickname)` 추가 — 닉네임 변경 시 기존 닉네임 RTDB에서 삭제

**`Login.tsx`**
- `handleSubmit` 을 async로 변경 — `registerNickname` 호출 후 결과에 따라 에러 메시지 표시
- 닉네임 변경 시 이전 닉네임 자동 해제 (`releaseNickname(prevNickname)`)

### Firebase 서비스 구조 정리

Firebase 3개 서비스 역할 분담:
| 서비스 | 역할 |
|--------|------|
| **Firestore** | 솔로/멀티 최종 점수 저장, 파트별 랭킹 쿼리 |
| **Realtime Database** | 멀티플레이어 방 실시간 동기화 (방 상태, 플레이어 목록, 정답 등) |
| **Storage** | 음악 파일(.mp3) 저장 |

### Firestore 점수/랭킹 시스템 구현

**`src/lib/firestore.ts` 신규 생성**
- `ScoreEntry` 인터페이스 정의 (`sessionId`, `nickname`, `eraId`, `partId`, `score`, `total`, `playedAt`)
- `saveScore()` — 점수 저장 (동일 유저+파트의 기존 점수보다 높을 때만 덮어씀)
  - docId: `${sessionId}_${eraId}_${partId}` (유저별·파트별 단일 문서)
- `getPartRanking()` — 파트별 상위 10명 조회
  - `where('eraId', '==', ...) + where('partId', '==', ...) + orderBy('score', 'desc') + limit(10)`
  - 첫 쿼리 실행 시 콘솔에 복합 인덱스 생성 링크 출력 → 클릭하여 생성 필요

**`Quiz.tsx`**
- `usePlayerStore`에서 `sessionId`, `nickname` 가져오기
- 퀴즈 완료(`finished === true`) 시 `saveScore` 자동 호출 (useEffect)

**`Ranking.tsx`**
- mock 데이터 제거 → Firestore `getPartRanking` 실데이터 연결
- 연대/파트 탭 전환 시 Firestore 재조회
- 로딩 상태 ("불러오는 중...") + 빈 데이터 ("아직 기록이 없어요") 처리

### Firestore 설정 안내 (사용자 직접 진행 필요)
- Firebase 콘솔 → Firestore Database → 데이터베이스 만들기 (테스트 모드, asia-northeast3)
- 보안 규칙: `allow read, write: if true` (개발 단계)
- 랭킹 첫 조회 시 콘솔에 뜨는 링크 클릭 → 복합 인덱스 생성 (`eraId`, `partId`, `score desc`)

### ARCHITECTURE.md 전면 업데이트
- 인증 방식: Firebase Auth → 닉네임 전용 (비밀번호 없음)
- RTDB 구조에 `nicknames/{nickname}` 경로 추가
- `Room` 인터페이스에 `hostName` 필드 추가
- Firestore 구조: `uid` → `sessionId`, `displayName` → `nickname` 으로 변경
- `PlayerState` 타입 (`sessionId`, `nickname`, `isAdmin`, `currentRoomCode`) 문서화
- 실제 파일 구조에 맞게 폴더 트리 및 라우팅 표 업데이트
- 로드맵 체크박스 최신화

---

> 다음 작업 예정
> - MultiQuiz 타이머 UI (questionStartedAt 기반 카운트다운)
> - 멀티플레이 종료 시 Firestore 점수 저장 (MultiQuiz.tsx)
> - Firestore 퀴즈 데이터 로드 (mockData 교체)
> - Firebase Storage 음악 업로드 + MusicPlayer 연결
> - RTDB / Firestore 보안 규칙 강화
