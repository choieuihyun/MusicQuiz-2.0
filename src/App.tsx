import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import Rooms from './pages/Rooms'
import Room from './pages/Room'
import MultiQuiz from './pages/MultiQuiz'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:eraId/:partId" element={<Quiz />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room/:roomCode" element={<Room />} />
        <Route path="/multi/:roomCode" element={<MultiQuiz />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
