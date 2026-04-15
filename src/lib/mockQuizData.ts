// TODO: Firebase Firestore 연동 시 이 파일 제거하고 lib/quiz.ts로 교체
import { QuizQuestion } from '../types/quiz'

export const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    lyrics: '너는 (  ) 보자며 내 (  )을 끌었어',
    song: '별빛이 내린다',
    artist: '임창정',
    options: [
      { id: 1, text: '별을 / 손' },
      { id: 2, text: '달을 / 팔' },
      { id: 3, text: '별을 / 팔' },
      { id: 4, text: '달을 / 손' },
      { id: 5, text: '꽃을 / 발' },
    ],
    correctId: 1,
  },
  {
    id: 'q2',
    lyrics: '(  ) 그날의 (  )이 나를 흔들어',
    song: '사랑했잖아',
    artist: '버즈',
    options: [
      { id: 1, text: '아직도 / 기억' },
      { id: 2, text: '언제나 / 향기' },
      { id: 3, text: '아직도 / 향기' },
      { id: 4, text: '지금도 / 기억' },
      { id: 5, text: '언제나 / 기억' },
    ],
    correctId: 1,
  },
  {
    id: 'q3',
    lyrics: '(  )야 (  ) 이 노래가 끝나면',
    song: '사랑아',
    artist: '거미',
    options: [
      { id: 1, text: '사랑 / 제발' },
      { id: 2, text: '자기 / 우리' },
      { id: 3, text: '사랑 / 우리' },
      { id: 4, text: '자기 / 제발' },
      { id: 5, text: '그대 / 제발' },
    ],
    correctId: 1,
  },
]
