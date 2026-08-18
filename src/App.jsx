import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ChapterPage from './pages/ChapterPage'
import QuizPage from './pages/QuizPage'
import RewardsPage from './pages/RewardsPage'
import { ParentModeToggle } from './components/ParentMode'
import ScrollToTop from './components/ScrollToTop'
import { FamilySyncProvider } from './utils/cloudSync'

export default function App() {
  return (
    <HashRouter>
      <FamilySyncProvider>
        <ScrollToTop />
        <div className="app-shell">
          <ParentModeToggle />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/chapter/:id" element={<ChapterPage />} />
            <Route path="/chapter/:id/quiz" element={<QuizPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </FamilySyncProvider>
    </HashRouter>
  )
}
