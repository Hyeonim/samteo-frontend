import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './ExplorePages.css'

const PAGE_SIZE = 9

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
  menu: '\uAC8C\uC2DC\uAE00 \uBA54\uB274',
  like: '\uC88B\uC544\uC694',
  comment: '\uB313\uAE00',
  share: '\uACF5\uC720',
  save: '\uC800\uC7A5',
  likeCount: '\uC88B\uC544\uC694',
  commentCount: '\uB313\uAE00',
}

function renderCaption(text) {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return <span className="community-inline-tag" key={`${part}-${index}`}>{part}</span>
    }
    return part
  })
}

function FeedCard({ post, compact }) {
  const hasImages = post.images.length > 0

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
          style={{ backgroundImage: `url(${post.images[0]})` }}
        >
          {post.images.length > 1 && <span>{post.images.length}</span>}
        </div>
      )}

      {post.images.length > 1 && !compact && (
        <div className="community-image-strip">
          {post.images.slice(0, 4).map((image, index) => (
            <img src={image} alt="" key={`${post.id}-${index}`} />
          ))}
        </div>
      )}

      <div className="community-card-actions">
        <div>
          <button type="button" aria-label={TEXT.like}>{TEXT.like}</button>
          <button type="button" aria-label={TEXT.comment}>{TEXT.comment}</button>
          <button type="button" aria-label={TEXT.share}>{TEXT.share}</button>
        </div>
        <button type="button" aria-label={TEXT.save}>{TEXT.save}</button>
      </div>

      <div className="community-card-copy">
        <p className="community-metrics">
          {TEXT.likeCount} {post.likes.toLocaleString()} - {TEXT.commentCount} {post.comments}
        </p>
        <p><strong>{post.author}</strong> {renderCaption(post.caption)}</p>
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [viewMode, setViewMode] = useState('single')
  const loadMoreRef = useRef(null)
  const consumedPostIdRef = useRef(null)
  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount])
  const canLoadMore = visibleCount < posts.length

  useEffect(() => {
    const newPost = location.state?.newPost
    if (!newPost || consumedPostIdRef.current === newPost.id) return

    consumedPostIdRef.current = newPost.id
    setPosts((prev) => [newPost, ...prev])
    setVisibleCount((count) => Math.max(count + 1, PAGE_SIZE))
    navigate('/community', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, posts.length))
      }
    }, { rootMargin: '360px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [posts.length])

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

        {visiblePosts.length > 0 ? (
          <section className={`community-feed ${viewMode === 'grid' ? 'three-col' : 'single-col'}`} aria-label="community posts">
            {visiblePosts.map((post) => (
              <FeedCard post={post} key={post.id} compact={viewMode === 'grid'} />
            ))}
          </section>
        ) : (
          <section className="community-empty">
            <h2>{TEXT.emptyTitle}</h2>
            <p>{TEXT.emptyDesc}</p>
            <button type="button" onClick={() => navigate('/community/new')}>{TEXT.newPost}</button>
          </section>
        )}

        {posts.length > 0 && (
          <div className="community-load" ref={loadMoreRef}>
            {canLoadMore ? TEXT.loading : TEXT.caughtUp}
          </div>
        )}
      </div>
    </main>
  )
}
