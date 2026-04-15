import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// DEV: RTDB 테스트용 (브라우저 콘솔에서 testRTDB.testWrite() 등으로 실행)
import * as testRTDB from './lib/testRTDB'
;(window as unknown as { testRTDB: typeof testRTDB }).testRTDB = testRTDB

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
