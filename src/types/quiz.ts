export interface QuizOption {
  id: number
  text: string
}

export interface QuizQuestion {
  id: string
  lyrics: string        // '너는 (  ) 보자며 내 (  )을 끌었어'
  song: string          // 곡명 (한글 — UI 표시용)
  title: string         // 영문 곡 ID (Storage 파일명 키)
  artist: string        // 가수명
  options: QuizOption[] // 5개 선택지
  correctId: number     // 정답 option id
}

export interface QuizSet {
  partId: string
  questions: QuizQuestion[]
}
