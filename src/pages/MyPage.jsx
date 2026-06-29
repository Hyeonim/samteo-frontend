import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { communityApi } from '../api/communityApi'
import { userApi } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import './MyPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const TEXT = {
  kicker: 'MY PAGE',
  title: '마이페이지',
  desc: '내 프로필과 커뮤니티에 올린 워킹홀리데이 순간들을 한곳에서 확인합니다.',
  profileTitle: '회원정보',
  email: '이메일',
  name: '회원명',
  provider: '가입 방식',
  writePost: '새 게시글 작성',
  postTitle: '내 커뮤니티 게시글',
  noPosts: '아직 작성한 커뮤니티 게시글이 없습니다.',
  edit: '수정',
  cancel: '취소',
  save: '저장',
  delete: '삭제',
  loading: '불러오는 중입니다...',
  postSaved: '게시글이 수정되었습니다.',
  postDeleted: '게시글이 삭제되었습니다.',
  failed: '처리하지 못했습니다. 입력값과 로그인 상태를 확인해 주세요.',
  deleteConfirm: '이 게시글을 삭제할까요?',
}

function toAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return `${API_BASE_URL}${url}`
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function renderCaption(text) {
  return (text || '').split(/(\s+)/).map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return <span className="mypage-tag" key={`${part}-${index}`}>{part}</span>
    }
    return part
  })
}

function normalizePost(post) {
  return {
    id: post.id,
    content: post.content || '',
    images: (post.images || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => toAssetUrl(image.url)),
    likeCount: post.likeCount || 0,
    commentCount: post.commentCount || 0,
    createdAt: post.createdAt,
  }
}

function getProviderView(provider) {
  const normalized = (provider || '').toLowerCase()
  if (normalized === 'kakao') {
    return {
      label: '카카오 로그인',
      desc: '카카오 계정으로 가입한 회원입니다.',
      className: 'kakao',
      icon: 'K',
    }
  }
  if (normalized === 'local') {
    return {
      label: '이메일 로그인',
      desc: '이메일과 비밀번호로 가입한 회원입니다.',
      className: 'local',
      icon: 'E',
    }
  }
  if (normalized === 'google') {
    return {
      label: '구글 로그인',
      desc: '구글 계정으로 가입한 회원입니다.',
      className: 'google',
      icon: 'G',
    }
  }
  if (normalized === 'naver') {
    return {
      label: '네이버 로그인',
      desc: '네이버 계정으로 가입한 회원입니다.',
      className: 'naver',
      icon: 'N',
    }
  }
  return {
    label: provider || '가입 방식 미확인',
    desc: '가입 제공자 정보를 확인하고 있습니다.',
    className: 'default',
    icon: '?',
  }
}

function MyPostCard({ post, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const coverImage = post.images[0]

  const savePost = async () => {
    if (isSaving) return
    try {
      setIsSaving(true)
      const response = await communityApi.updatePost({ postId: post.id, content: draft })
      onUpdated(normalizePost(response), TEXT.postSaved)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const deletePost = async () => {
    if (!window.confirm(TEXT.deleteConfirm)) return
    await communityApi.deletePost(post.id)
    onDeleted(post.id, TEXT.postDeleted)
  }

  return (
    <article className="mypage-post-card">
      <div className="mypage-post-preview">
        {coverImage ? <img src={coverImage} alt="" /> : <div>텍스트 게시글</div>}
        {post.images.length > 1 && <span>{post.images.length}장</span>}
      </div>
      <div className="mypage-post-body">
        <div className="mypage-post-meta">
          <span>{formatDate(post.createdAt)}</span>
          <span>좋아요 {post.likeCount} · 댓글 {post.commentCount}</span>
        </div>
        {isEditing ? (
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={600} />
        ) : (
          <p>{post.content ? renderCaption(post.content) : '작성된 글이 없습니다.'}</p>
        )}
        <div className="mypage-post-actions">
          {isEditing ? (
            <>
              <button type="button" className="secondary" onClick={() => {
                setDraft(post.content)
                setIsEditing(false)
              }}>
                {TEXT.cancel}
              </button>
              <button type="button" onClick={savePost} disabled={isSaving}>{TEXT.save}</button>
            </>
          ) : (
            <>
              <button type="button" className="secondary" onClick={() => setIsEditing(true)}>{TEXT.edit}</button>
              <button type="button" className="danger" onClick={deletePost}>{TEXT.delete}</button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, sessionExpired, updateUser } = useAuth()
  const [profile, setProfile] = useState({ email: '', name: '', provider: '' })
  const [profileStats, setProfileStats] = useState({ postCount: 0, followerCount: 0, followingCount: 0 })
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const initial = useMemo(() => (profile.name || user?.name || '회').slice(0, 1), [profile.name, user?.name])
  const providerView = useMemo(() => getProviderView(profile.provider), [profile.provider])
  const stats = useMemo(() => {
    return {
      postCount: profileStats.postCount || posts.length,
      followerCount: profileStats.followerCount || 0,
      followingCount: profileStats.followingCount || 0,
    }
  }, [posts.length, profileStats])

  useEffect(() => {
    if (!isLoggedIn) {
      if (!sessionExpired) navigate('/login')
      return
    }

    async function loadMyPage() {
      try {
        setIsLoading(true)
        setError('')
        const me = await userApi.getMe()
        const [profileDetail, postPage] = await Promise.all([
          userApi.getProfile(me.userId),
          communityApi.getMyPosts({ page: 0, size: 30 }),
        ])
        setProfile({
          email: me.email || '',
          name: me.name || '',
          provider: me.provider || '',
        })
        setProfileStats({
          postCount: profileDetail.postCount || 0,
          followerCount: profileDetail.followerCount || 0,
          followingCount: profileDetail.followingCount || 0,
        })
        updateUser(me)
        setPosts((postPage.posts || []).map(normalizePost))
      } catch {
        setError(TEXT.failed)
      } finally {
        setIsLoading(false)
      }
    }

    loadMyPage()
  }, [isLoggedIn, navigate, sessionExpired, updateUser])

  const showMessage = (nextMessage) => {
    setMessage(nextMessage)
    setError('')
  }

  const handlePostUpdated = (updatedPost, nextMessage) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
    showMessage(nextMessage)
  }

  const handlePostDeleted = (postId, nextMessage) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    showMessage(nextMessage)
  }

  return (
    <main className="mypage-page">
      <div className="mypage-shell">
        <header className="mypage-head">
          <p>{TEXT.kicker}</p>
          <h1>{TEXT.title}</h1>
          <span>{TEXT.desc}</span>
        </header>

        {message && <p className="mypage-alert success">{message}</p>}
        {error && <p className="mypage-alert error">{error}</p>}

        {isLoading ? (
          <section className="mypage-loading">{TEXT.loading}</section>
        ) : (
          <>
            <section className="mypage-profile-hero">
              <div className="mypage-avatar large">{initial}</div>
              <div className="mypage-profile-main">
                <div className="mypage-profile-title-row">
                  <h2>{profile.name || '회원'}</h2>
                  <button type="button" onClick={() => navigate('/community/new')}>{TEXT.writePost}</button>
                </div>
                <p>{profile.email}</p>
                <div className="mypage-stats" aria-label="community stats">
                  <div><strong>{stats.postCount}</strong><span>게시글</span></div>
                  <div><strong>{stats.followingCount}</strong><span>팔로우</span></div>
                  <div><strong>{stats.followerCount}</strong><span>팔로워</span></div>
                </div>
                <div className="mypage-provider-line">
                  <span>{TEXT.provider}</span>
                  <div className={`mypage-provider-chip ${providerView.className}`}>
                    <i>{providerView.icon}</i>
                    <div>
                      <strong>{providerView.label}</strong>
                      <small>{providerView.desc}</small>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mypage-info-strip" aria-label={TEXT.profileTitle}>
              <div>
                <span>{TEXT.name}</span>
                <strong>{profile.name || '-'}</strong>
              </div>
              <div>
                <span>{TEXT.email}</span>
                <strong>{profile.email || '-'}</strong>
              </div>
              <div>
                <span>{TEXT.provider}</span>
                <strong>{providerView.label}</strong>
              </div>
            </section>

            <section className="mypage-panel mypage-posts-panel">
              <div className="mypage-section-head">
                <h2>{TEXT.postTitle}</h2>
                <span>{posts.length}개</span>
              </div>
              {posts.length > 0 ? (
                <div className="mypage-post-list">
                  {posts.map((post) => (
                    <MyPostCard
                      post={post}
                      key={post.id}
                      onUpdated={handlePostUpdated}
                      onDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="mypage-empty">{TEXT.noPosts}</div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
