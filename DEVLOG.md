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

---

## 2026-04-16

### 타이머 UI (MultiQuiz.tsx)
- 진행 바 아래에 카운트다운 바 추가 (`questionStartedAt` 기반 실시간 계산)
- 남은 시간 숫자 표시 + 바 너비 비례 감소
- 5초 이하 시 빨간색(`#f43f5e`)으로 전환 + `timerPulse` 깜빡임 애니메이션
- 타이머 만료 시 미제출 플레이어 자동 오답 처리 (`selected ?? -1` 제출)
- `index.css`에 `timerPulse` / `nudgeShake` 키프레임 추가

### 재촉(Nudge) 기능
- `realtimeDB.ts` — `sendNudge` / `subscribeToNudge` / `clearNudge` 추가
  - `nudges/{roomCode}/{targetSessionId}` 경로에 재촉 데이터 저장
- MultiQuiz — 재촉 구독: 수신 시 상단 핑크 토스트 알림 (`nudgeShake` 애니메이션)
- 방 생성 시 타이머 시간 선택 모달 (10 / 15 / 20 / 30초) — Rooms.tsx

### 사이드 드로어 참가자 패널 (MultiQuiz.tsx)
- 기존 가로 스크롤 점수판 → 우측 사이드 드로어로 교체
- 책갈피 탭: 인원 수 + "참가자" 세로 텍스트 + 화살표, 드로어 개폐 시 함께 이동
- 패널 내 플레이어 카드: 순위 메달 / 닉네임 / 점수 / 제출 상태 세로 배치
- 재촉 버튼: 본인 제출 완료 후 미제출 타인 카드 하단에 "👋 재촉하기" 노출
- 재촉 발신 피드백: 2초간 해당 카드 핑크 강조 + "👋 재촉함" 표시

### UX 흐름 전면 재설계
- 솔로 플레이 제거 — 방 만들어서 혼자 플레이 가능
- 새 랜딩 페이지 `Landing.tsx` (`/`) — 방 생성하기 / 방 참여하기 카드
- `Home.tsx` → `/create` 경로로 이동, 방 생성 플로우로 전환
  - 파트 선택 후 하단 CTA 등장 (선택 요약 + 타이머 선택 + 방 만들기 버튼)
  - 방 생성 시 `eraId` / `partId` / `timeLimit` 확정 후 `/room/:code`로 이동
- `Rooms.tsx` 방 생성 버튼 제거, 참여 전용 페이지로 변경
  - 각 방 카드에 시대 컬러 상단 바 + `eraId` · `partId` 뱃지 표시
  - 방이 없을 때 "방 만들러 가기" 버튼 노출
- `Room.tsx` 파트 선택 UI 제거
  - 생성 시 확정된 시대/파트/타이머 정보 배너로 표시
  - 참가자 목록 카드 (프로필 사진 + 닉네임 + 방장 표시)
- `App.tsx` 라우팅 변경: `/` → Landing, `/create` → Home, `/quiz` 라우트 제거

### 프로필 사진
- `Login.tsx` — 원형 아바타 클릭 → 파일 선택 → 미리보기
  - 로그인 완료 시 Firebase Storage `profiles/{sessionId}` 업로드 → URL 저장
  - 로그인 후 navigate 경로 `/rooms` → `/` 변경
- `playerStore.ts` — `photoURL: string` / `setPhotoURL` 추가 (localStorage persist)
- `realtimeDB.ts` — `Player` 인터페이스에 `photoURL?: string` 추가
  - `createRoom` / `joinRoom` 함수에 `photoURL` 파라미터 추가
- `firestore.ts` — `ScoreEntry`에 `photoURL?: string` 추가, `saveScore`에 파라미터 추가
- `Ranking.tsx` — 순위 메달 옆 원형 아바타 표시 (사진 없으면 🎤 아이콘)
- Firebase Storage Rules 설정 필요: `profiles/{sessionId}` read/write 허용

### 문서 업데이트
- `ARCHITECTURE.md` — 라우팅, 폴더 구조, RTDB/Firestore/Storage 설계, 데이터 타입, 로드맵 전면 업데이트
- `DEVLOG.md` — 현재 항목

### 멀티플레이 종료 시 Firestore 점수 저장

**`MultiQuiz.tsx`**
- `saveScore` import 추가 (`lib/firestore.ts`)
- `scoreSavedRef` (useRef) 추가 — 중복 저장 방지
- `room.status === 'result'` 감지 useEffect 추가
  - 각 플레이어가 자기 점수를 직접 저장 (`room.players[sessionId].score`)
  - `saveScore`의 최고 점수 유지 로직과 조합 → 기존 점수보다 낮으면 무시
  - `photoURL` playerStore에서 가져와서 함께 저장
- `nickname` / `photoURL` playerStore 구조분해 중복 제거

### 전체 UI 리뉴얼 (frontend-design 플러그인 적용)

**디자인 방향: "Neon Stage"** — K-POP 콘서트 스테이지 콘셉트. 더 강렬한 타이포그래피, 드라마틱한 글로우, 임팩트 있는 레이아웃.

**`src/index.css`**
- Google Fonts 임포트: `Black Han Sans` (한국어 디스플레이) + `Barlow Condensed` (숫자/영문) + `Noto Sans KR` (본문)
- CSS 변수 추가: `--font-display`, `--font-number`, `--font-body`, `--bg-main`, `--bg-accent`
- 배경 그라디언트 강화: `#3d0a6e` 베이스로 더 따뜻하고 레이어드된 퍼플

**모든 페이지 공통 변경**
- 헤딩/CTA 버튼: `Black Han Sans` 적용 → 훨씬 강한 임팩트
- 점수/방코드/타이머/연대 태그: `Barlow Condensed` 적용
- 본문/닉네임/레이블: `Noto Sans KR` 적용
- 카드 좌측 4px 컬러 accent bar 추가 → 입체감·방향성 강화
- 배경 레이어드 광원 (색상별 radial glow)
- 레이블: 소문자 → `UPPERCASE + letter-spacing` 통일

**페이지별 주요 변경**
- `Login.tsx` — 타이틀 `MUSIC QUIZ` 대형 디스플레이 폰트, 카드 상단 컬러 바, 아바타 glow
- `Landing.tsx` — accent bar 카드, 타이틀 glow 강화, 레이블 uppercase
- `Home.tsx` — 연대 카드 accent bar + 파트 버튼 accent bar, 숫자 Barlow Condensed
- `Rooms.tsx` — 방 카드 eraId 별 accent bar, 빈방 메시지 디스플레이 폰트
- `Room.tsx` — 대기실 배너 accent bar, 방코드 Barlow Condensed, 방장 카드 강조
- `Ranking.tsx` — 랭킹 카드 TOP3 accent bar, 점수/정답률 Barlow Condensed, 트로피 glow
- `MultiQuiz.tsx` — 가사 카드 accent bar, 선택지 accent bar, 결과 화면 개선

### 실시간 채팅 기능

**`realtimeDB.ts`**
- `push` / `query` / `limitToLast` import 추가
- `ChatMessage` 인터페이스 추가 (`sessionId`, `displayName`, `photoURL`, `message`, `timestamp`)
- `Bubble` 인터페이스 추가 (`message`, `timestamp`)
- `sendChatMessage()` — `rooms/{roomCode}/chat/{pushId}`에 `push()`로 메시지 저장 + `rooms/{roomCode}/bubbles/{sessionId}` 동시 업데이트
- `subscribeToChatMessages()` — `limitToLast(50)` 쿼리로 최근 50개 메시지 실시간 구독
- `subscribeToBubbles()` — 방 전체 플레이어의 최신 말풍선 메시지 구독

**`Room.tsx` (대기실)**
- `sendChatMessage` / `subscribeToChatMessages` / `subscribeToBubbles` 연결
- 1초 tick(`setInterval`) — 말풍선 5초 자동 소멸 판정용
- 참가자 카드: 최근 5초 이내 메시지 있으면 이름 아래 말풍선 스타일 말풍선 텍스트 표시
- 채팅 메시지 피드: 참가자 목록 아래 스크롤 가능한 채팅창 (내 메시지 오른쪽 버블, 타인 왼쪽 버블 + 아바타)
- 고정 채팅 입력창: 화면 하단 고정 (호스트는 게임 시작 버튼 위, 비호스트는 최하단)
- Enter 키 전송 지원

**`MultiQuiz.tsx` (퀴즈 중)**
- `sendChatMessage` / `subscribeToChatMessages` / `subscribeToBubbles` 연결
- 사이드 드로어 탭 추가: **👥 참가자 | 💬 채팅** 2탭 구조
- 참가자 탭: 기존 플레이어 카드 + 5초 말풍선 메시지 이름 아래 표시
- 채팅 탭: 스크롤 메시지 목록(flex) + 입력창(하단 고정)
- 미읽음 배지: 채팅 탭 외 상태에서 새 메시지 수신 시 드로어 토글 버튼 + 탭 버튼에 핑크 뱃지 노출
- 채팅 탭 열 때 미읽음 카운트 초기화 + 스크롤 최하단 이동

---

## 2026-04-16 (2차)

### 전체 구조 전환 — 연대 제거 + 4파트 체계

**배경**: 기존 `연대(2000s/2010s/2020s) × 파트(1/2/3) = 9그룹` 구조를 **파트(1/2/3/4) = 4그룹**으로 단순화. MySQL 원본 SQL 50곡을 Part.1에 임포트하고 파트 2~4는 자리만 마련.

**데이터 레이어**
- `src/lib/parts.ts` 신규 — 4개 파트 메타데이터(id/label/subtitle/컬러) 단일 소스
  - Part.1 OPENING (바이올렛) / Part.2 ENCORE (시안) / Part.3 SPOTLIGHT (핑크) / Part.4 FINALE (앰버)
- `src/lib/realtimeDB.ts` — `Room` 인터페이스에서 `eraId` 제거, `createRoom` / `updateRoomSelection` 시그니처 간소화
- `src/lib/firestore.ts`
  - `ScoreEntry` / `saveScore` / `getPartRanking`에서 `eraId` 제거 — docId: `${sessionId}_${partId}`
  - `getPartQuestions(partId)` 신규 — `quizzes/{partId}/questions` 서브컬렉션 로드
- `src/types/quiz.ts` — `QuizSet`에서 `eraId` 제거

**페이지 리팩토링**
- `Home.tsx` — 연대 아코디언 제거, 4개 파트 카드 수직 배치 (accent bar + 뱃지 글로우)
- `Rooms.tsx` — 방 카드 era 뱃지 → 파트 뱃지 (`Part.N` + 레이블)
- `Room.tsx` — 배너에서 era 표기 제거, `Part.N · {label}` 형태로 변경
- `Ranking.tsx` — 연대 탭 제거, 파트 4개 탭만 (P.1 ~ P.4)
- `MultiQuiz.tsx`
  - `MOCK_QUESTIONS` 제거 → `getPartQuestions(room.partId)`로 Firestore 로드
  - `ERA_COLORS` 제거 → `partMeta(room.partId)` 사용
  - 문제 없음 상태(`questionsLoaded && questions.length === 0`) 처리 — "준비 중" 화면 + 홈 버튼

**미사용 파일 정리**
- `src/pages/Quiz.tsx`, `src/pages/Lobby.tsx` 삭제
- `src/lib/mockQuizData.ts`, `src/lib/mockRankingData.ts`, `src/lib/testRTDB.ts` 삭제
- `src/main.tsx`에서 `testRTDB` 디버그 연결 제거

### Firestore 퀴즈 데이터 임포트 스크립트

`scripts/importQuiz.mjs` 신규:
- `.env.local`에서 `VITE_FIREBASE_*` 환경변수 수동 파싱
- Firebase 클라이언트 SDK로 `quizzes/1/questions/{songId}`에 50곡 업로드
- 원본 MySQL 50곡 데이터를 `QuizQuestion` 형식으로 변환 (answer → correctId 매핑 포함)
- 실행: `bun run scripts/importQuiz.mjs`

### 프로필 사진 업로드 에러 수정
- 원인: Firebase Storage 보안 규칙 만료 (2024-12-15 기반 조건문)
- Storage Rules를 `allow read, write: if true` (개발용)로 교체하도록 안내
- `Login.tsx` — 업로드 실패 시 원인 로그(`storage/unauthorized` 등) 표시

### 채팅 본인 판정 로직 변경
- `isMe = data.sessionId === sessionId` → `data.displayName === nickname`
- 이유: sessionId는 localStorage persist라 같은 브라우저에서 닉네임만 바꿔 재로그인 해도 값이 동일 → 테스트할 때 전부 "내 메시지"로 표시되는 문제
- 닉네임은 RTDB 트랜잭션으로 고유성 보장되므로 동일하게 안전

### 문서 업데이트
- `ARCHITECTURE.md`, `CLAUDE.md` — 연대 → 4파트 전환 반영, 폴더 구조 및 Firestore 구조 업데이트
- `DEVLOG.md` — 현재 항목

---

---

## 2026-04-16 (3차)

### Firestore Native 모드 전환 — Named Database `musicquizdb`

**문제**
- 임포트 스크립트 실행 시 에러: `FAILED_PRECONDITION: The Cloud Firestore API is not available for Firestore in Datastore Mode database`
- 원인: 기존 `(default)` 데이터베이스가 **Datastore 모드**로 생성되어 있어 Firebase Client SDK가 연결 불가
- Datastore ↔ Native 모드는 **전환 불가** → 삭제 후 재생성 필요

**조치**
- Google Cloud Console에서 기존 `(default)` 데이터베이스 삭제
- Firebase 콘솔에서 **Native 모드**로 새 데이터베이스 생성
- 데이터베이스 이름을 `musicquizdb` 로 지정 (기본 `(default)` 아님)
- 개발용 보안 규칙: `allow read, write: if request.time < timestamp.date(2026, 12, 16)`

**코드 수정**
- `src/lib/firebase.ts` — `getFirestore(app)` → `getFirestore(app, 'musicquizdb')` 로 변경
- `scripts/importQuiz.mjs` — 동일하게 변경
- `ARCHITECTURE.md` — Firestore 섹션에 데이터베이스 이름 명시

### 부차 이슈

**Firestore rules 만료 조건 관련**
- Firestore 신규 DB 생성 시 기본 규칙이 `request.time < timestamp.date(YYYY, MM, DD)` 형태로 30일 만료
- 현재 설정: 2026-12-16 만료 (약 8개월) — 개발 기간 충분

**로컬 네트워크 멀티플레이 테스트 방법 안내**
- Vite `bun run dev --host` 로 LAN 접속 가능
- 외부 테스트는 `ngrok http 5173` 권장 (HTTPS 제공)

---

> 다음 작업 예정
> - Firestore `musicquizdb`에 Part.1 50곡 업로드 실행 (`bun run scripts/importQuiz.mjs`)
> - 랭킹 첫 조회 시 복합 인덱스 생성 (`partId + score desc`)
> - Part.2 / Part.3 / Part.4 문제 데이터 추가
> - Firebase Storage 음악 업로드 + MusicPlayer 연결
> - Security Rules 설정 (RTDB + Firestore + Storage)
