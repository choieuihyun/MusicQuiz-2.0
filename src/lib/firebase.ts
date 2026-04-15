// TODO: Firebase 프로젝트 생성 후 .env.local에 값 채우기
// https://console.firebase.google.com/ → 프로젝트 생성 → 웹 앱 추가
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// TODO: Auth - 로그인/회원가입 방식 결정 (Google, 이메일 등)
export const auth = getAuth(app)

// TODO: Firestore - 퀴즈 데이터, 점수, 방 정보 저장
export const db = getFirestore(app)

// TODO: Storage - 음악 파일(미리듣기 클립 등) 저장
export const storage = getStorage(app)
