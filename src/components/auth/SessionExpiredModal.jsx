import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './SessionExpiredModal.css'

export default function SessionExpiredModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionExpired, acknowledgeSessionExpired } = useAuth()

  if (!sessionExpired || location.pathname === '/login') return null

  const currentPath = `${location.pathname}${location.search}${location.hash}`

  const goToLogin = () => {
    sessionStorage.setItem('auth_return_to', currentPath)
    acknowledgeSessionExpired()
    navigate('/login', { state: { from: currentPath } })
  }

  const goHome = () => {
    acknowledgeSessionExpired()
    navigate('/')
  }

  return (
    <div className="session-expired-backdrop" role="presentation">
      <section className="session-expired-modal" role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
        <span className="session-expired-label">SESSION EXPIRED</span>
        <h2 id="session-expired-title">로그인 시간이 만료되었습니다</h2>
        <p>안전한 이용을 위해 로그인이 종료되었습니다.<br />다시 로그인하면 보던 화면으로 돌아갑니다.</p>
        <div className="session-expired-actions">
          <button type="button" className="secondary" onClick={goHome}>홈으로</button>
          <button type="button" className="primary" onClick={goToLogin}>다시 로그인</button>
        </div>
      </section>
    </div>
  )
}
