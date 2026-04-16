# MusicQuiz App — Claude 지침

## 프로젝트 개요

한국 가요 가사 빈칸 맞추기 퀴즈 앱. **4개 파트**(Part.1 ~ Part.4)로 나뉜 문제를 풀고, 유저별 점수를 Firestore에 저장해 파트별 랭킹을 제공한다.

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | Vite + React + TypeScript | React 18 |
| 스타일링 | Tailwind CSS (`@tailwindcss/vite` 플러그인) | v4 |
| 라우팅 | React Router | v7 |
| 상태관리 | Zustand | 최신 |
| 인증 | Firebase Auth (Google 로그인) | v11 |
| DB | Firebase Firestore | v11 |
| 런타임 | Node.js v24 / npm 11 | — |
| 환경 | WSL2 (Linux) + Windows | — |

---

## 개발 환경

- 개발 서버: `npm run dev` → `http://localhost:5173`
- WSL 환경에서 HMR이 작동하려면 `vite.config.ts`에 `server.watch.usePolling: true` 필요
- 환경변수: `.env.local` (Firebase 설정값, git 제외)

---

## 아키텍처 문서 관리 규칙

**아래 사항이 변경될 때는 반드시 [@ARCHITECTURE.md](ARCHITECTURE.md) 도 함께 업데이트한다:**

- 라우팅 경로 추가/변경/삭제
- Firestore 컬렉션/문서 구조 변경
- 새로운 페이지 또는 주요 컴포넌트 추가
- 기술 스택 변경 (라이브러리 추가/제거/버전 변경)
- 폴더 구조 변경
- 데이터 타입(`src/types/`) 변경
- 로드맵 항목 완료 또는 추가

---

## 코딩 규칙

- 컴포넌트는 함수형 + TypeScript로 작성
- 스타일은 Tailwind 유틸리티 클래스 사용 (별도 CSS 파일 지양)
- 전역 상태는 Zustand 스토어로 관리 (`src/store/`)
- Firebase 관련 함수는 `src/lib/firestore.ts`에 모아서 관리
- 페이지 컴포넌트는 `src/pages/`, 재사용 UI는 `src/components/`

## 디자인 규칙

- 배경: 딥 퍼플/네이비 `radial-gradient` 유지
- 카드: glassmorphism (`backdrop-blur` + `rgba` + 다중 `box-shadow`)
- 포인트 컬러 (파트별): Part.1 `#a855f7` / Part.2 `#22d3ee` / Part.3 `#f472b6` / Part.4 `#fbbf24`
- 비주얼이 풍부한 스타일 선호 — "모던하고 깔끔하게"라고 해도 입체감과 글로우 유지
- 새 UI 추가 시 기존 디자인 톤 맞출 것
