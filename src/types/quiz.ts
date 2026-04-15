export interface QuizOption {
  id: number
  text: string
}

export interface QuizQuestion {
  id: string
  lyrics: string        // '너는 (  ) 보자며 내 (  )을 끌었어'
  song: string          // 곡명
  artist: string        // 가수명
  options: QuizOption[] // 5개 선택지
  correctId: number     // 정답 option id
}

export interface QuizSet {
  eraId: string
  partId: string
  questions: QuizQuestion[]
}
