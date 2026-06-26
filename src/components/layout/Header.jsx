import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const close = () => {
    setOpen(false)
    setProfileOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    close()
  }

  const go = (path) => {
    navigate(path)
    close()
  }

  useEffect(() => {
    if (!profileOpen) return undefined

    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [profileOpen])

  const links = [
    { to: '/jobs', label: '일자리' },
    { to: '/events', label: '이벤트' },
    ...(isLoggedIn ? [{ to: '/my-planner', label: '내 플래너' }] : []),
    { to: '/community', label: '커뮤니티' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: '관리자' }] : []),
  ]

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo" onClick={close}>
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
            <div className="nav-profile" ref={profileRef}>
              <button
                className="nav-profile-trigger"
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="nav-profile-avatar">{user.name?.slice(0, 1) || '회'}</span>
                <span className="nav-profile-name">{user.name}님</span>
              </button>
              {profileOpen && (
                <div className="nav-profile-menu" role="menu">
                  <div className="nav-profile-summary">
                    <span className="nav-profile-avatar">{user.name?.slice(0, 1) || '회'}</span>
                    <div>
                      <strong>{user.name}님</strong>
                      <p>{user.email || '삼터 회원'}</p>
                    </div>
                  </div>
                  <button type="button" role="menuitem" onClick={() => go('/mypage')}>마이페이지</button>
                  <button type="button" role="menuitem" onClick={handleLogout}>로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-btn-start" onClick={() => navigate('/login')}>로그인 / 회원가입</button>
          )}
        </div>

        <button
          className={`nav-hamburger${open ? ' is-open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="메뉴"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {open && (
        <>
          <div className="nav-mobile-menu">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`}
                onClick={close}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="nav-mobile-actions">
              {isLoggedIn ? (
                <>
                  <div className="nav-mobile-profile">
                    <span className="nav-profile-avatar">{user.name?.slice(0, 1) || '회'}</span>
                    <div>
                      <strong>{user.name}님</strong>
                      <p>{user.email || '삼터 회원'}</p>
                    </div>
                  </div>
                  <button className="nav-btn-login" onClick={() => go('/mypage')}>마이페이지</button>
                  <button className="nav-btn-login" onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <button className="nav-btn-start nav-btn-start--full" onClick={() => go('/login')}>
                  로그인 / 회원가입
                </button>
              )}
            </div>
          </div>
          <div className="nav-overlay" onClick={close} />
        </>
      )}
    </>
  )
}

export default Header
