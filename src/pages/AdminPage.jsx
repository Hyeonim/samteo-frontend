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
    { key: 'community',  icon: '💬', label: '커뮤니티 관리' },
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
        {tab === 'community' && <CommunityTab />}
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
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const doLogout = useLogout()

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/api/admin/stats?days=${days}`)
      .then(res => setStats(res.data))
      .catch(err => setError(err.status === 403 ? '403' : '오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [days])

  if (error === '403') return <AuthError onLogout={doLogout} />

  const dailyStats = stats?.dailyStats || []
  const sumMetric = key => dailyStats.reduce((sum, item) => sum + Number(item[key] || 0), 0)
  const cards = stats ? [
    { key: 'users', label: '전체 회원', value: stats.totalUsers, period: sumMetric('users'), color: '#7c3aed', icon: '👤' },
    { key: 'planners', label: '생성된 플래너', value: stats.totalPlanners, period: sumMetric('planners'), color: '#2563eb', icon: '📋' },
    { key: 'communityPosts', label: '커뮤니티 게시글', value: stats.totalCommunityPosts, period: sumMetric('communityPosts'), color: '#059669', icon: '💬' },
  ] : []
  const maxDailyValue = Math.max(1, ...dailyStats.flatMap(item => [
    Number(item.users || 0),
    Number(item.planners || 0),
    Number(item.communityPosts || 0),
  ]))
  const chartMetrics = [
    { key: 'users', label: '회원 가입', color: '#7c3aed' },
    { key: 'planners', label: '플래너 생성', color: '#2563eb' },
    { key: 'communityPosts', label: '게시글 작성', color: '#059669' },
  ]

  return (
    <div className="adm-section">
      <div className="adm-dashboard-head">
        <div>
          <h2 className="adm-section__title">대시보드</h2>
          <p>서비스의 누적 현황과 최근 활동 흐름을 확인합니다.</p>
        </div>
        <div className="adm-dashboard-range" aria-label="조회 기간">
          {[7, 14, 30].map(option => (
            <button
              type="button"
              className={days === option ? 'active' : ''}
              onClick={() => setDays(option)}
              key={option}
            >
              {option}일
            </button>
          ))}
        </div>
      </div>
      {loading ? <p className="adm-loading">불러오는 중...</p> : error ? (
        <p className="adm-error">{error}</p>
      ) : (
        <>
          <div className="adm-stats-grid adm-stats-grid--primary">
            {cards.map(card => (
              <div key={card.key} className="adm-stat-card" style={{ '--card-color': card.color }}>
                <div className="adm-stat-card__top">
                  <span>{card.label}</span>
                  <i>{card.icon}</i>
                </div>
                <div className="adm-stat-card__value">{Number(card.value || 0).toLocaleString()}</div>
                <div className="adm-stat-card__change">
                  <strong>+{card.period.toLocaleString()}</strong>
                  <span>최근 {days}일</span>
                </div>
              </div>
            ))}
          </div>

          <section className="adm-chart-panel">
            <div className="adm-chart-head">
              <div>
                <h3>일자별 서비스 활동</h3>
                <p>회원 가입, 플래너 생성, 커뮤니티 게시글 작성 수를 비교합니다.</p>
              </div>
              <div className="adm-chart-legend">
                {chartMetrics.map(metric => (
                  <span key={metric.key}><i style={{ background: metric.color }} />{metric.label}</span>
                ))}
              </div>
            </div>

            <div className="adm-chart-scroll">
              <div className="adm-chart-body" style={{ minWidth: `${Math.max(720, dailyStats.length * 34)}px` }}>
                <div className="adm-chart-yaxis">
                  <span>{maxDailyValue}</span>
                  <span>{Math.ceil(maxDailyValue / 2)}</span>
                  <span>0</span>
                </div>
                <div className="adm-chart-plot">
                  <div className="adm-chart-grid-line top" />
                  <div className="adm-chart-grid-line middle" />
                  <div className="adm-chart-grid-line bottom" />
                  <div
                    className="adm-chart-columns"
                    style={{ gridTemplateColumns: `repeat(${dailyStats.length}, minmax(20px, 1fr))` }}
                  >
                    {dailyStats.map((item, index) => {
                      const date = new Date(`${item.date}T00:00:00`)
                      const showLabel = days <= 14 || index % 5 === 0 || index === dailyStats.length - 1
                      return (
                        <div className="adm-chart-day" key={item.date}>
                          <div className="adm-chart-bars">
                            {chartMetrics.map(metric => {
                              const value = Number(item[metric.key] || 0)
                              return (
                                <i
                                  key={metric.key}
                                  title={`${item.date} ${metric.label} ${value}건`}
                                  style={{
                                    '--bar-color': metric.color,
                                    height: `${value === 0 ? 2 : Math.max(5, (value / maxDailyValue) * 100)}%`,
                                  }}
                                />
                              )
                            })}
                          </div>
                          <span>{showLabel ? `${date.getMonth() + 1}.${date.getDate()}` : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="adm-dashboard-secondary">
            <div><span>등록된 단기 공고</span><strong>{Number(stats.totalJobs || 0).toLocaleString()}</strong></div>
            <div><span>조회 가능한 숙소</span><strong>{Number(stats.totalAccommodations || 0).toLocaleString()}</strong></div>
          </section>
        </>
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

// ── 커뮤니티 관리 ─────────────────────────────────────────────────────────────

const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL || ''

function toAdminAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return `${ADMIN_API_BASE_URL}${url}`
}

function AdminChevronIcon({ direction }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points={points} />
    </svg>
  )
}

function CommunityTab() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [previewTarget, setPreviewTarget] = useState(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const doLogout = useLogout()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const query = search ? `&keyword=${encodeURIComponent(search)}` : ''
    api.get(`/api/admin/community/posts?page=${page}&size=20${query}`)
      .then(res => {
        setPosts(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
      })
      .catch(err => setError(err.status === 403 ? '403' : '게시글 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = event => {
    event.preventDefault()
    setPage(0)
    setSearch(keyword.trim())
  }

  const saveEdit = async () => {
    if (!editTarget || actionLoading) return
    setActionLoading(true)
    try {
      await api.put(`/api/admin/community/posts/${editTarget.postId}`, { content: editTarget.content })
      setEditTarget(null)
      load()
    } catch (requestError) {
      setError(requestError.message || '게시글을 수정하지 못했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const deletePost = async () => {
    if (!deleteTarget || actionLoading) return
    setActionLoading(true)
    try {
      await api.delete(`/api/admin/community/posts/${deleteTarget.postId}`)
      setDeleteTarget(null)
      load()
    } catch (requestError) {
      setError(requestError.message || '게시글을 삭제하지 못했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  if (error === '403') return <AuthError onLogout={doLogout} />

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">커뮤니티 관리</h2>
        <span className="adm-section__count">총 {totalElements.toLocaleString()}건</span>
      </div>
      <p className="adm-section__desc">
        작성자와 게시물 내용을 확인하고, 운영 정책에 따라 수정하거나 삭제합니다.
      </p>

      <form className="adm-search-bar" onSubmit={handleSearch}>
        <input
          className="adm-search-input"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="본문, 회원명, 이메일 검색"
        />
        <button className="adm-search-btn" type="submit">검색</button>
        {search && (
          <button className="adm-search-reset" type="button" onClick={() => {
            setKeyword('')
            setSearch('')
            setPage(0)
          }}>
            초기화
          </button>
        )}
      </form>

      {error && <p className="adm-error">{error}</p>}
      {loading ? <p className="adm-loading">불러오는 중...</p> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table adm-community-table">
              <thead>
                <tr>
                  <th>미리보기</th>
                  <th>게시글</th>
                  <th>작성자</th>
                  <th>반응</th>
                  <th>작성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr><td colSpan={6} className="adm-td-empty">조회된 게시글이 없습니다.</td></tr>
                ) : posts.map(post => (
                  <tr key={post.postId}>
                    <td>
                      <div className="adm-community-thumb">
                        {post.thumbnailUrl ? (
                          <img src={toAdminAssetUrl(post.thumbnailUrl)} alt="" />
                        ) : (
                          <span>글</span>
                        )}
                        {post.imageCount > 1 && <b>+{post.imageCount - 1}</b>}
                      </div>
                    </td>
                    <td>
                      <div className="adm-community-content" title={post.content || ''}>
                        {post.content || '이미지 게시글'}
                      </div>
                      <small className="adm-community-id">#{post.postId}</small>
                    </td>
                    <td>
                      <strong className="adm-community-author">{post.authorName}</strong>
                      <small>{post.authorEmail}</small>
                    </td>
                    <td className="adm-community-reactions">
                      <span>♥ {post.likeCount}</span>
                      <span>댓글 {post.commentCount}</span>
                    </td>
                    <td className="adm-td-date">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : '-'}
                    </td>
                    <td>
                      <div className="adm-community-actions">
                        <button className="adm-btn adm-btn--preview" type="button" onClick={() => {
                          setPreviewTarget(post)
                          setPreviewImageIndex(0)
                        }}>미리보기</button>
                        <button className="adm-btn adm-btn--edit" type="button" onClick={() => setEditTarget({ ...post })}>수정</button>
                        <button className="adm-btn adm-btn--delete" type="button" onClick={() => setDeleteTarget(post)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}

      {editTarget && (
        <div className="adm-modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="adm-modal adm-community-edit-modal" onClick={event => event.stopPropagation()}>
            <div className="adm-community-edit-head">
              <div>
                <strong>게시글 수정</strong>
                <span>{editTarget.authorName} · #{editTarget.postId}</span>
              </div>
              <button type="button" onClick={() => setEditTarget(null)} aria-label="닫기">×</button>
            </div>
            <textarea
              className="adm-community-editor"
              value={editTarget.content || ''}
              maxLength={600}
              onChange={event => setEditTarget(current => ({ ...current, content: event.target.value }))}
            />
            <div className="adm-community-edit-foot">
              <span>{(editTarget.content || '').length}/600</span>
              <div className="adm-modal__actions">
                <button className="adm-btn adm-btn--cancel" type="button" onClick={() => setEditTarget(null)} disabled={actionLoading}>취소</button>
                <button className="adm-btn adm-btn--save" type="button" onClick={saveEdit} disabled={actionLoading}>
                  {actionLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewTarget && (
        <div className="adm-modal-overlay" onClick={() => setPreviewTarget(null)}>
          <div className="adm-modal adm-community-preview-modal" onClick={event => event.stopPropagation()}>
            <div className="adm-community-preview-head">
              <div className="adm-community-preview-avatar">{previewTarget.authorName?.slice(0, 1) || '?'}</div>
              <div>
                <strong>{previewTarget.authorName}</strong>
                <span>{previewTarget.createdAt ? new Date(previewTarget.createdAt).toLocaleString('ko-KR') : ''}</span>
              </div>
              <button type="button" onClick={() => setPreviewTarget(null)} aria-label="닫기">×</button>
            </div>

            {(previewTarget.imageUrls || []).length > 0 && (
              <div className="adm-community-preview-media">
                <img src={toAdminAssetUrl(previewTarget.imageUrls[previewImageIndex])} alt="" />
                {previewTarget.imageUrls.length > 1 && (
                  <>
                    <button
                      className="adm-community-preview-nav prev"
                      type="button"
                      aria-label="이전 이미지"
                      disabled={previewImageIndex === 0}
                      onClick={() => setPreviewImageIndex(index => Math.max(0, index - 1))}
                    >
                      <AdminChevronIcon direction="prev" />
                    </button>
                    <button
                      className="adm-community-preview-nav next"
                      type="button"
                      aria-label="다음 이미지"
                      disabled={previewImageIndex === previewTarget.imageUrls.length - 1}
                      onClick={() => setPreviewImageIndex(index => Math.min(previewTarget.imageUrls.length - 1, index + 1))}
                    >
                      <AdminChevronIcon direction="next" />
                    </button>
                  </>
                )}
              </div>
            )}

            {(previewTarget.imageUrls || []).length > 1 && (
              <div className="adm-community-preview-dots" aria-label="이미지 목록">
                {previewTarget.imageUrls.map((url, index) => (
                  <button
                    type="button"
                    className={previewImageIndex === index ? 'active' : ''}
                    onClick={() => setPreviewImageIndex(index)}
                    aria-label={`${index + 1}번째 이미지`}
                    key={`${url}-${index}`}
                  />
                ))}
              </div>
            )}

            <div className="adm-community-preview-copy">
              <div className="adm-community-preview-stats">
                <span>♥ 좋아요 {previewTarget.likeCount}</span>
                <span>댓글 {previewTarget.commentCount}</span>
              </div>
              <p><strong>{previewTarget.authorName}</strong> {previewTarget.content || '이미지 게시글'}</p>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`#${deleteTarget.postId} 게시글을 삭제하시겠습니까?`}
          onConfirm={deletePost}
          onCancel={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
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
