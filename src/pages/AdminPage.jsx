import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import './AdminPage.css'

function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') navigate('/', { replace: true })
  }, [user, navigate])

  if (!user || user.role !== 'ADMIN') return null

  const navItems = [
    { key: 'dashboard',  icon: '📊', label: '대시보드' },
    { key: 'users',      icon: '👥', label: '회원 관리' },
    { key: 'jobs',       icon: '💼', label: '공고 관리' },
    { key: 'planners',   icon: '📋', label: '플래너 현황' },
  ]

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar__title">관리자</div>
        <nav className="adm-sidebar__nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`adm-nav-item${tab === item.key ? ' is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="adm-main">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users'     && <UsersTab currentUserId={user.userId} />}
        {tab === 'jobs'      && <JobsTab />}
        {tab === 'planners'  && <PlannersTab />}
      </main>
    </div>
  )
}

// ── 공통 유틸 ─────────────────────────────────────────────────────────────────

function AuthError({ onLogout }) {
  return (
    <div className="adm-auth-error">
      <div className="adm-auth-error__icon">🔒</div>
      <p>세션이 만료되었습니다.</p>
      <p className="adm-auth-error__sub">재로그인 후 다시 시도해주세요.</p>
      <button className="adm-btn adm-btn--promote" onClick={onLogout}>로그아웃</button>
    </div>
  )
}

function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return () => { logout(); navigate('/login') }
}

// ── 대시보드 ──────────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const doLogout = useLogout()

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => setError(err.status === 403 ? '403' : '오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  if (error === '403') return <AuthError onLogout={doLogout} />

  const cards = stats ? [
    { label: '전체 회원',    value: stats.totalUsers,          color: '#7C3AED', icon: '👤' },
    { label: '생성된 플래너', value: stats.totalPlanners,       color: '#2563EB', icon: '📋' },
    { label: '단기 공고',    value: stats.totalJobs,           color: '#059669', icon: '💼' },
    { label: 'TourAPI 숙소', value: stats.totalAccommodations, color: '#D97706', icon: '🏠' },
  ] : []

  return (
    <div className="adm-section">
      <h2 className="adm-section__title">대시보드</h2>
      {loading ? <p className="adm-loading">불러오는 중...</p> : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <div className="adm-stats-grid">
          {cards.map(card => (
            <div key={card.label} className="adm-stat-card" style={{ '--card-color': card.color }}>
              <div className="adm-stat-card__icon">{card.icon}</div>
              <div className="adm-stat-card__value">{card.value.toLocaleString()}</div>
              <div className="adm-stat-card__label">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 회원 관리 ─────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }) {
  const [users, setUsers]             = useState([])
  const [page, setPage]               = useState(0)
  const [totalPages, setTotalPages]   = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const doLogout = useLogout()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.get(`/api/admin/users?page=${page}&size=20`)
      .then(res => {
        setUsers(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      })
      .catch(err => setError(err.status === 403 ? '403' : '불러오기 실패'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId)
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole })
      load()
    } catch {
    } finally {
      setActionLoading(null)
    }
  }

  const providerLabel = p => p === 'local' ? '이메일' : p === 'kakao' ? '카카오' : p

  if (error === '403') return <AuthError onLogout={doLogout} />

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">회원 관리</h2>
        <span className="adm-section__count">총 {totalElements.toLocaleString()}명</span>
      </div>

      {loading ? <p className="adm-loading">불러오는 중...</p> : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th><th>이름</th><th>이메일</th><th>가입방법</th><th>권한</th><th>가입일</th><th>액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td className="adm-td-id">{u.userId}</td>
                    <td>{u.name}</td>
                    <td className="adm-td-email">{u.email}</td>
                    <td><span className={`adm-badge adm-badge--${u.provider}`}>{providerLabel(u.provider)}</span></td>
                    <td><span className={`adm-badge adm-badge--role-${u.role?.toLowerCase()}`}>{u.role === 'ADMIN' ? '관리자' : '일반'}</span></td>
                    <td className="adm-td-date">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                    <td>
                      {String(u.userId) === String(currentUserId) ? (
                        <span className="adm-td-self">본인</span>
                      ) : u.role === 'ADMIN' ? (
                        <button className="adm-btn adm-btn--demote" disabled={actionLoading === u.userId} onClick={() => changeRole(u.userId, 'USER')}>
                          {actionLoading === u.userId ? '...' : '권한 해제'}
                        </button>
                      ) : (
                        <button className="adm-btn adm-btn--promote" disabled={actionLoading === u.userId} onClick={() => changeRole(u.userId, 'ADMIN')}>
                          {actionLoading === u.userId ? '...' : '관리자 지정'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  )
}

// ── 공고 관리 (단기 공고 — DB 저장) ──────────────────────────────────────────

function JobsTab() {
  const [jobs, setJobs]             = useState([])
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [keyword, setKeyword]       = useState('')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const doLogout = useLogout()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const q = search ? `&keyword=${encodeURIComponent(search)}` : ''
    api.get(`/api/admin/jobs?page=${page}&size=20${q}`)
      .then(res => {
        setJobs(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      })
      .catch(err => setError(err.status === 403 ? '403' : '공고 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => { e.preventDefault(); setPage(0); setSearch(keyword) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/jobs/${deleteTarget.id}`)
      setDeleteTarget(null)
      load()
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  if (error === '403') return <AuthError onLogout={doLogout} />

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">공고 관리</h2>
        <span className="adm-section__count">총 {totalElements.toLocaleString()}건</span>
        <span className="adm-info-badge">단기 공고 (DB 저장)</span>
      </div>
      <p className="adm-section__desc">장기 공고(알리오 API)는 실시간 조회로 DB에 저장되지 않습니다.</p>

      <form className="adm-search-bar" onSubmit={handleSearch}>
        <input className="adm-search-input" placeholder="공고명, 회사명, 지역으로 검색" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <button className="adm-search-btn" type="submit">검색</button>
        {search && <button className="adm-search-reset" type="button" onClick={() => { setKeyword(''); setSearch(''); setPage(0) }}>초기화</button>}
      </form>

      {loading ? <p className="adm-loading">불러오는 중...</p> : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>공고명</th><th>회사</th><th>지역</th><th>직종</th><th>고용형태</th><th>월급(만원)</th><th>북마크</th><th>액션</th></tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr><td colSpan={8} className="adm-td-empty">등록된 단기 공고가 없습니다</td></tr>
                ) : jobs.map(j => (
                  <tr key={j.id}>
                    <td className="adm-td-title">{j.title}</td>
                    <td>{j.company}</td>
                    <td className="adm-td-sub">{j.cityName || j.district}</td>
                    <td className="adm-td-sub">{j.category}</td>
                    <td><span className="adm-badge adm-badge--type">{j.employmentType}</span></td>
                    <td className="adm-td-num">{j.monthlySalary > 0 ? j.monthlySalary.toLocaleString() : '-'}</td>
                    <td className="adm-td-num">{j.bookmarkCount}</td>
                    <td><button className="adm-btn adm-btn--delete" onClick={() => setDeleteTarget(j)}>삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}

      {deleteTarget && (
        <ConfirmModal message={`"${deleteTarget.title}" 공고를 삭제하시겠습니까?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </div>
  )
}

// ── 플래너 현황 ───────────────────────────────────────────────────────────────

function PlannersTab() {
  const [planners, setPlanners]         = useState([])
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const doLogout = useLogout()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.get(`/api/admin/planners?page=${page}&size=20`)
      .then(res => {
        setPlanners(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      })
      .catch(err => setError(err.status === 403 ? '403' : '불러오기 실패'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const typeLabel = t => {
    if (t === 'SHORT_TERM') return '단기'
    if (t === 'LONG_TERM')  return '장기'
    return t
  }

  if (error === '403') return <AuthError onLogout={doLogout} />

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">플래너 현황</h2>
        <span className="adm-section__count">총 {totalElements.toLocaleString()}건</span>
      </div>

      {loading ? <p className="adm-loading">불러오는 중...</p> : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>제목</th><th>회원</th><th>이메일</th><th>지역</th><th>유형</th><th>월급(만원)</th><th>생성일</th></tr>
              </thead>
              <tbody>
                {planners.length === 0 ? (
                  <tr><td colSpan={7} className="adm-td-empty">생성된 플래너가 없습니다</td></tr>
                ) : planners.map(p => (
                  <tr key={p.id}>
                    <td className="adm-td-title">{p.title}</td>
                    <td>{p.userName}</td>
                    <td className="adm-td-email">{p.userEmail}</td>
                    <td className="adm-td-sub">{p.regionName || '-'}</td>
                    <td><span className={`adm-badge adm-badge--type-${p.plannerType?.toLowerCase()}`}>{typeLabel(p.plannerType)}</span></td>
                    <td className="adm-td-num">{p.totalSalary ? p.totalSalary.toLocaleString() : '-'}</td>
                    <td className="adm-td-date">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  )
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</button>
      <span className="adm-page-info">{page + 1} / {totalPages}</span>
      <button className="adm-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음</button>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="adm-modal-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <p className="adm-modal__message">{message}</p>
        <div className="adm-modal__actions">
          <button className="adm-btn adm-btn--cancel" onClick={onCancel} disabled={loading}>취소</button>
          <button className="adm-btn adm-btn--confirm-delete" onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
