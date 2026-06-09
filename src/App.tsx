import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Weather from './pages/Weather'
import Oura from './pages/Oura'
import Withings from './pages/Withings'
import Habits from './pages/Habits'
import Settings from './pages/Settings'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/oura" element={<Oura />} />
          <Route path="/withings" element={<Withings />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  )
}
