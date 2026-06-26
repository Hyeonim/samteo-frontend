import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { communityApi } from '../api/communityApi'
import { userApi } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import './MyPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const TEXT = {
  kicker: 'PROFILE',
  title: '프로필',
  desc: '커뮤니티에 올린 워킹홀리데이 순간들을 확인하고 팔로우할 수 있습니다.',
  provider: '가입 방식',
  loading: '불러오는 중입니다...',
  failed: '프로필 정보를 불러오지 못했습니다.',
  followFailed: '팔로우 상태를 변경하지 못했습니다. 로그인 상태를 확인해 주세요.',
  follow: '팔로우',
  following: '팔로잉',
  myPage: '마이페이지로 이동',
  postTitle: '커뮤니티 게시글',
  noPosts: '아직 공개된 커뮤니티 게시글이 없습니다.',
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

function PublicPostCard({ post }) {
  const coverImage = post.images[0]

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
        <p>{post.content ? renderCaption(post.content) : '작성된 글이 없습니다.'}</p>
      </div>
    </article>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [error, setError] = useState('')

  const initial = useMemo(() => (profile?.name || '회').slice(0, 1), [profile?.name])
  const providerView = useMemo(() => getProviderView(profile?.provider), [profile?.provider])

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)
        setError('')
        const [profileResponse, postPage] = await Promise.all([
          userApi.getProfile(userId),
          communityApi.getPostsByUser({ userId, page: 0, size: 30 }),
        ])
        setProfile(profileResponse)
        setPosts((postPage.posts || []).map(normalizePost))
      } catch {
        setError(TEXT.failed)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  const toggleFollow = async () => {
    if (!profile || isFollowLoading) return
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    try {
      setIsFollowLoading(true)
      setError('')
      const nextProfile = profile.followedByMe
        ? await userApi.unfollow(profile.userId)
        : await userApi.follow(profile.userId)
      setProfile(nextProfile)
    } catch {
      setError(TEXT.followFailed)
    } finally {
      setIsFollowLoading(false)
    }
  }

  return (
    <main className="mypage-page">
      <div className="mypage-shell">
        <header className="mypage-head">
          <p>{TEXT.kicker}</p>
          <h1>{TEXT.title}</h1>
          <span>{TEXT.desc}</span>
        </header>

        {error && <p className="mypage-alert error">{error}</p>}

        {isLoading ? (
          <section className="mypage-loading">{TEXT.loading}</section>
        ) : profile && (
          <>
            <section className="mypage-profile-hero">
              <div className="mypage-avatar large">{initial}</div>
              <div className="mypage-profile-main">
                <div className="mypage-profile-title-row">
                  <h2>{profile.name || '회원'}</h2>
                  {profile.me ? (
                    <button type="button" onClick={() => navigate('/mypage')}>{TEXT.myPage}</button>
                  ) : (
                    <button
                      type="button"
                      className={profile.followedByMe ? 'secondary' : ''}
                      onClick={toggleFollow}
                      disabled={isFollowLoading}
                    >
                      {profile.followedByMe ? TEXT.following : TEXT.follow}
                    </button>
                  )}
                </div>
                <p>{profile.email}</p>
                <div className="mypage-stats" aria-label="profile stats">
                  <div><strong>{profile.postCount || posts.length}</strong><span>게시글</span></div>
                  <div><strong>{profile.followingCount || 0}</strong><span>팔로우</span></div>
                  <div><strong>{profile.followerCount || 0}</strong><span>팔로워</span></div>
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

            <section className="mypage-panel mypage-posts-panel">
              <div className="mypage-section-head">
                <h2>{TEXT.postTitle}</h2>
                <span>{posts.length}개</span>
              </div>
              {posts.length > 0 ? (
                <div className="mypage-post-list">
                  {posts.map((post) => <PublicPostCard post={post} key={post.id} />)}
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
