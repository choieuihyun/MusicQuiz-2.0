import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import Rooms from './pages/Rooms'
import Room from './pages/Room'
import MultiQuiz from './pages/MultiQuiz'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Home />} />
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
