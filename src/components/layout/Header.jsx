import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const links = [
    { to: '/jobs', label: '일자리' },
    { to: '/events', label: '이벤트' },
    ...(isLoggedIn ? [{ to: '/my-planner', label: '내 플래너' }] : []),
    { to: '/community', label: '커뮤니티' },
  ]

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect width="40" height="40" rx="12" fill="url(#navGrad)" />
          <defs>
            <linearGradient id="navGrad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="8" y="10" width="24" height="5" rx="2.5" fill="white" opacity="0.95" />
          <rect x="8" y="18" width="24" height="5" rx="2.5" fill="white" opacity="0.85" />
          <rect x="8" y="26" width="24" height="5" rx="2.5" fill="white" opacity="0.75" />
        </svg>
        <div className="nav-logo__text">
          <div className="nav-logo__name">삼터</div>
          <div className="nav-logo__sub">쉼터 · 일터 · 놀터</div>
        </div>
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
        {isLoggedIn ? (
          <>
            <span className="nav-user-name">{user.name}님</span>
            <button className="nav-btn-login" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <button className="nav-btn-login" onClick={() => navigate('/login')}>로그인</button>
        )}
        <button className="nav-btn-start" onClick={() => navigate('/planner')}>시작하기</button>
      </div>
    </nav>
  )
}

export default Header
