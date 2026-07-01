import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { notificationApi } from '../../api/notificationApi'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const NOTIFICATION_REFRESH_MS = 30_000

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  return `${Math.floor(minutes / 60)}시간 전`
}

function notificationSymbol(type) {
  if (type === 'COMMUNITY_LIKE') return '♥'
  if (type === 'COMMUNITY_COMMENT') return '●'
  if (type === 'NEW_FOLLOWER') return '＋'
  if (type === 'COMMUNITY_POST_CREATED') return '▣'
  return '✓'
}

function notificationPath(notification) {
  if (notification.targetType === 'COMMUNITY_POST') return '/community'
  if (notification.targetType === 'USER_PROFILE' && notification.targetId) {
    return `/users/${notification.targetId}`
  }
  if (notification.targetType === 'PLANNER') return '/my-planner'
  return null
}

function Header() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)

  const close = () => {
    setOpen(false)
    setProfileOpen(false)
    setNotificationOpen(false)
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

  const loadNotifications = useCallback(async () => {
    if (!isLoggedIn) return
    setNotificationLoading(true)
    try {
      const response = await notificationApi.getNotifications()
      setNotifications(response?.notifications || [])
    } catch {
      // Authentication expiry is handled by the shared API client.
    } finally {
      setNotificationLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    const initialTimer = window.setTimeout(loadNotifications, 0)
    const timer = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS)
    const handleFocus = () => loadNotifications()
    const handleRefresh = () => loadNotifications()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('samteo:notifications-refresh', handleRefresh)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('samteo:notifications-refresh', handleRefresh)
    }
  }, [isLoggedIn, loadNotifications])

  useEffect(() => {
    if (!profileOpen && !notificationOpen) return undefined

    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [profileOpen, notificationOpen])

  const unreadCount = notifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0
  )

  const toggleNotifications = () => {
    setProfileOpen(false)
    setNotificationOpen((value) => !value)
    if (!notificationOpen) loadNotifications()
  }

  const markAllNotifications = async () => {
    if (unreadCount < 1) return
    try {
      await notificationApi.markAllAsRead()
      setNotifications((items) => items.map((item) => ({ ...item, read: true })))
    } catch {
      // Keep the current list when the request fails.
    }
  }

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.notificationId)
        setNotifications((items) => items.map((item) => (
          item.notificationId === notification.notificationId ? { ...item, read: true } : item
        )))
      } catch {
        return
      }
    }

    setNotificationOpen(false)
    const path = notificationPath(notification)
    if (path) navigate(path)
  }

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
          <img className="nav-logo__mark" src="/samteo-favicon.png" alt="" />
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

        <div className="nav-right">
          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <div className="nav-notification" ref={notificationRef}>
                  <button
                    className="nav-notification-trigger"
                    type="button"
                    onClick={toggleNotifications}
                    aria-label={unreadCount > 0 ? '새 알림 있음' : '알림'}
                    aria-haspopup="true"
                    aria-expanded={notificationOpen}
                  >
                    <BellIcon />
                    {unreadCount > 0 && <span className="nav-notification-new">N</span>}
                  </button>
                  {notificationOpen && (
                    <section className="nav-notification-menu" aria-label="알림 목록">
                      <header className="nav-notification-head">
                        <div>
                          <strong>알림</strong>
                          {unreadCount > 0 && <span>새 알림 {unreadCount}개</span>}
                        </div>
                        <button
                          type="button"
                          onClick={markAllNotifications}
                          disabled={unreadCount < 1}
                        >
                          모두 읽음
                        </button>
                      </header>
                      <div className="nav-notification-list">
                        {notificationLoading && notifications.length === 0 ? (
                          <p className="nav-notification-empty">알림을 불러오는 중입니다.</p>
                        ) : notifications.length === 0 ? (
                          <p className="nav-notification-empty">최근 24시간 동안 새 알림이 없습니다.</p>
                        ) : notifications.map((notification) => (
                          <button
                            className={`nav-notification-item ${notification.read ? 'read' : 'unread'}`}
                            type="button"
                            key={notification.notificationId}
                            onClick={() => openNotification(notification)}
                          >
                            <span className={`nav-notification-symbol type-${notification.type.toLowerCase()}`}>
                              {notificationSymbol(notification.type)}
                            </span>
                            <span className="nav-notification-copy">
                              <span className="nav-notification-title-row">
                                <strong>{notification.title}</strong>
                                {!notification.read && <i aria-label="확인하지 않은 알림" />}
                              </span>
                              <span>{notification.message}</span>
                              <time dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt)}</time>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
                <div className="nav-profile" ref={profileRef}>
              <button
                className="nav-profile-trigger"
                type="button"
                onClick={() => {
                  setNotificationOpen(false)
                  setProfileOpen((value) => !value)
                }}
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
              </>
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
        </div>
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
