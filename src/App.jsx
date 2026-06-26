import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import RegionExplorePage from './pages/RegionExplorePage'
import JobsPage from './pages/JobsPage'
import AccommodationsPage from './pages/AccommodationsPage'
import MyPlannerPage from './pages/MyPlannerPage'
import EventsPage from './pages/EventsPage'
import CommunityPage from './pages/CommunityPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/regions" element={<RegionExplorePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/accommodations" element={<AccommodationsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/my-planner" element={<MyPlannerPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
