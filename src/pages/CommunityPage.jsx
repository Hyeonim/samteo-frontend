import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { communityApi } from '../api/communityApi'
import './ExplorePages.css'

const PAGE_SIZE = 9
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const TEXT = {
  kicker: '\uCEE4\uBBA4\uB2C8\uD2F0',
  title: '\uC6CC\uD0B9\uD640\uB9AC\uB370\uC774 \uC21C\uAC04\uC744 \uACF5\uC720\uD574\uC694',
  desc: '\uC77C\uC790\uB9AC, \uC219\uC18C, \uB3D9\uB124 \uC0B0\uCC45, \uC624\uB298\uC758 \uBC1C\uACAC\uAE4C\uC9C0 \uC0AC\uB78C\uB4E4\uC774 \uC9C1\uC811 \uC62C\uB9AC\uB294 \uD53C\uB4DC\uC785\uB2C8\uB2E4.',
  newPost: '\uAC8C\uC2DC\uAE00 \uB9CC\uB4E4\uAE30',
  viewLabel: '\uBCF4\uAE30 \uBC29\uC2DD',
  singleView: '\uD53C\uB4DC\uD615',
  gridView: '\uAC24\uB7EC\uB9AC\uD615',
  emptyTitle: '\uC544\uC9C1 \uC62C\uB77C\uC628 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4',
  emptyDesc: '\uCCAB \uBC88\uC9F8 \uC6CC\uD0B9\uD640\uB9AC\uB370\uC774 \uC21C\uAC04\uC744 \uB0A8\uACA8\uBCF4\uC138\uC694.',
  loading: '\uB354 \uB9CE\uC740 \uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uB294 \uC911...',
  caughtUp: '\uBAA8\uB4E0 \uAC8C\uC2DC\uAE00\uC744 \uBD24\uC2B5\uB2C8\uB2E4.',
  error: '\uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.',
  menu: '\uAC8C\uC2DC\uAE00 \uBA54\uB274',
  like: '\uC88B\uC544\uC694',
  comment: '\uB313\uAE00',
  likeCount: '\uC88B\uC544\uC694',
  commentCount: '\uB313\uAE00',
  prevImage: '\uC774\uC804 \uC774\uBBF8\uC9C0',
  nextImage: '\uB2E4\uC74C \uC774\uBBF8\uC9C0',
  commentPlaceholder: '\uB313\uAE00\uC744 \uB0A8\uACA8\uBCF4\uC138\uC694.',
  commentSubmit: '\uB4F1\uB85D',
  commentsEmpty: '\uC544\uC9C1 \uB313\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  actionFailed: '\uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.',
}

function toAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return `${API_BASE_URL}${url}`
}

function formatElapsed(value) {
  if (!value) return ''
  const created = new Date(value)
  if (Number.isNaN(created.getTime())) return ''

  const diffMs = Date.now() - created.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMinutes < 1) return '\uBC29\uAE08'
  if (diffMinutes < 60) return `${diffMinutes}\uBD84 \uC804`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}\uC2DC\uAC04 \uC804`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}\uC77C \uC804`

  return created.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function mapCommunityPost(post) {
  const images = (post.images || [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => toAssetUrl(image.url))

  return {
    id: post.id,
    author: post.authorName || '\uD68C\uC6D0',
    elapsed: formatElapsed(post.createdAt),
    caption: post.content || '',
    images,
    imageCountText: images.length > 0 ? `${images.length}\uC7A5` : '\uC774\uBBF8\uC9C0 \uC5C6\uC74C',
    likes: post.likeCount || 0,
    comments: post.commentCount || 0,
    liked: Boolean(post.liked),
  }
}

function mapCommunityComment(comment) {
  return {
    id: comment.id,
    author: comment.authorName || '\uD68C\uC6D0',
    content: comment.content || '',
    elapsed: formatElapsed(comment.createdAt),
  }
}

function renderCaption(text) {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return <span className="community-inline-tag" key={`${part}-${index}`}>{part}</span>
    }
    return part
  })
}

function ChevronIcon({ direction }) {
  const points = direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points={points} />
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.8 4.6c-2-2-5.2-2-7.2 0L12 6.2l-1.6-1.6c-2-2-5.2-2-7.2 0s-2 5.2 0 7.2L12 20.6l8.8-8.8c2-2 2-5.2 0-7.2Z"
        className={filled ? 'filled' : ''}
      />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 20.5l1.6-4.7A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  )
}

function FeedCard({ post, compact, onPostUpdated, onCommentCreated }) {
  const hasImages = post.images.length > 0
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const hasMultipleImages = post.images.length > 1

  const showPrevImage = () => {
    setActiveImageIndex((index) => Math.max(0, index - 1))
  }

  const showNextImage = () => {
    setActiveImageIndex((index) => Math.min(post.images.length - 1, index + 1))
  }

  const toggleLike = async () => {
    if (isLikeLoading) return

    try {
      setIsLikeLoading(true)
      setActionError('')
      const response = post.liked
        ? await communityApi.unlikePost(post.id)
        : await communityApi.likePost(post.id)
      onPostUpdated(mapCommunityPost(response))
    } catch {
      setActionError(TEXT.actionFailed)
    } finally {
      setIsLikeLoading(false)
    }
  }

  const loadComments = async () => {
    if (commentsLoaded || isCommentLoading) return

    try {
      setIsCommentLoading(true)
      setActionError('')
      const response = await communityApi.getComments({ postId: post.id, page: 0, size: 30 })
      setComments((response.comments || []).map(mapCommunityComment))
      setCommentsLoaded(true)
    } catch {
      setActionError(TEXT.actionFailed)
    } finally {
      setIsCommentLoading(false)
    }
  }

  const toggleComments = async () => {
    const nextOpen = !commentsOpen
    setCommentsOpen(nextOpen)
    if (nextOpen) {
      await loadComments()
    }
  }

  const submitComment = async (event) => {
    event.preventDefault()
    const content = commentText.trim()
    if (!content || isCommentLoading) return

    try {
      setIsCommentLoading(true)
      setActionError('')
      const response = await communityApi.createComment({ postId: post.id, content })
      setComments((prev) => [...prev, mapCommunityComment(response)])
      setCommentsLoaded(true)
      setCommentText('')
      onCommentCreated(post.id)
    } catch {
      setActionError(TEXT.actionFailed)
    } finally {
      setIsCommentLoading(false)
    }
  }

  return (
    <article className={`community-feed-card${compact ? ' compact' : ''}`}>
      <header className="community-card-head">
        <div className="community-avatar">{post.author.slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="community-author-row">
            <strong>{post.author}</strong>
            <span>{post.elapsed}</span>
          </div>
          <p>{post.imageCountText}</p>
        </div>
        <button type="button" aria-label={TEXT.menu}>...</button>
      </header>

      {hasImages && (
        <div
          className="community-photo has-image"
          style={{ backgroundImage: `url(${post.images[activeImageIndex]})` }}
        >
          {hasMultipleImages && (
            <>
              <button
                className="community-photo-nav prev"
                type="button"
                onClick={showPrevImage}
                aria-label={TEXT.prevImage}
                disabled={activeImageIndex === 0}
              >
                <ChevronIcon direction="prev" />
              </button>
              <button
                className="community-photo-nav next"
                type="button"
                onClick={showNextImage}
                aria-label={TEXT.nextImage}
                disabled={activeImageIndex === post.images.length - 1}
              >
                <ChevronIcon direction="next" />
              </button>
            </>
          )}
        </div>
      )}

      {hasMultipleImages && (
        <div className="community-feed-dots" aria-label="uploaded images">
          {post.images.map((image, index) => (
            <button
              type="button"
              className={activeImageIndex === index ? 'active' : ''}
              onClick={() => setActiveImageIndex(index)}
              aria-label={`${index + 1}`}
              key={`${post.id}-${image}-${index}`}
            />
          ))}
        </div>
      )}

      <div className="community-card-actions">
        <div>
          <button
            type="button"
            className={post.liked ? 'active' : ''}
            onClick={toggleLike}
            aria-label={TEXT.like}
            disabled={isLikeLoading}
          >
            <HeartIcon filled={post.liked} />
          </button>
          <button type="button" onClick={toggleComments} aria-label={TEXT.comment}>
            <CommentIcon />
          </button>
        </div>
      </div>

      <div className="community-card-copy">
        <p className="community-metrics">
          {TEXT.likeCount} {post.likes.toLocaleString()} - {TEXT.commentCount} {post.comments}
        </p>
        <p><strong>{post.author}</strong> {renderCaption(post.caption)}</p>
      </div>

      {commentsOpen && (
        <section className="community-comments" aria-label={TEXT.comment}>
          {actionError && <p className="community-action-error">{actionError}</p>}
          <div className="community-comments-list">
            {isCommentLoading && comments.length === 0 ? (
              <p className="community-comments-empty">{TEXT.loading}</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <article className="community-comment" key={comment.id}>
                  <div className="community-comment-avatar">{comment.author.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <p>
                      <strong>{comment.author}</strong>
                      <span>{comment.elapsed}</span>
                    </p>
                    <div>{renderCaption(comment.content)}</div>
                  </div>
                </article>
              ))
            ) : (
              <p className="community-comments-empty">{TEXT.commentsEmpty}</p>
            )}
          </div>
          <form className="community-comment-form" onSubmit={submitComment}>
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={TEXT.commentPlaceholder}
            />
            <button type="submit" disabled={!commentText.trim() || isCommentLoading}>
              {TEXT.commentSubmit}
            </button>
          </form>
        </section>
      )}
    </article>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [viewMode, setViewMode] = useState('single')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const loadMoreRef = useRef(null)

  const loadPosts = useCallback(async (nextPage = 0, replace = false) => {
    if (isLoading) return

    try {
      setIsLoading(true)
      setError('')
      const response = await communityApi.getPosts({ page: nextPage, size: PAGE_SIZE })
      const nextPosts = (response.posts || []).map(mapCommunityPost)
      setPosts((prev) => (replace ? nextPosts : [...prev, ...nextPosts]))
      setPage(response.page ?? nextPage)
      setHasNext(Boolean(response.hasNext))
    } catch {
      setError(TEXT.error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  useEffect(() => {
    loadPosts(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNext && !isLoading) {
        loadPosts(page + 1)
      }
    }, { rootMargin: '360px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasNext, isLoading, loadPosts, page])

  const updatePost = useCallback((updatedPost) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }, [])

  const increaseCommentCount = useCallback((postId) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    )))
  }, [])

  return (
    <main className="community-page">
      <div className="community-shell">
        <header className="community-hero">
          <div>
            <p>{TEXT.kicker}</p>
            <h1>{TEXT.title}</h1>
            <span>{TEXT.desc}</span>
          </div>
          <button className="community-create-btn" type="button" onClick={() => navigate('/community/new')}>
            {TEXT.newPost}
          </button>
        </header>

        <section className="community-toolbar" aria-label={TEXT.viewLabel}>
          <span>{TEXT.viewLabel}</span>
          <div>
            <button
              type="button"
              className={viewMode === 'single' ? 'active' : ''}
              onClick={() => setViewMode('single')}
              aria-label={TEXT.singleView}
              title={TEXT.singleView}
            >
              <span className="community-view-icon list" aria-hidden="true">
                <i className="thumb" />
                <i className="line long" />
                <i className="line" />
              </span>
            </button>
            <button
              type="button"
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              aria-label={TEXT.gridView}
              title={TEXT.gridView}
            >
              <span className="community-view-icon grid" aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </span>
            </button>
          </div>
        </section>

        {error && <p className="community-submit-error">{error}</p>}

        {posts.length > 0 ? (
          <section className={`community-feed ${viewMode === 'grid' ? 'three-col' : 'single-col'}`} aria-label="community posts">
            {posts.map((post) => (
              <FeedCard
                post={post}
                key={post.id}
                compact={viewMode === 'grid'}
                onPostUpdated={updatePost}
                onCommentCreated={increaseCommentCount}
              />
            ))}
          </section>
        ) : !isLoading && (
          <section className="community-empty">
            <h2>{TEXT.emptyTitle}</h2>
            <p>{TEXT.emptyDesc}</p>
            <button type="button" onClick={() => navigate('/community/new')}>{TEXT.newPost}</button>
          </section>
        )}

        {(posts.length > 0 || isLoading) && (
          <div className="community-load" ref={loadMoreRef}>
            {isLoading ? TEXT.loading : hasNext ? TEXT.loading : TEXT.caughtUp}
          </div>
        )}
      </div>
    </main>
  )
}
