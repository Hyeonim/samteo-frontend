import { useState } from 'react'
import './ExplorePages.css'

const INITIAL_POSTS = [
  {
    id: 1,
    title: '중구에서 카페 일자리와 숙소를 같이 잡은 후기',
    author: 'Planner Demo',
    body: '출퇴근 20분 안쪽 숙소를 먼저 고르고 일자리를 비교하니 예산 계산이 훨씬 쉬웠습니다.',
    tags: ['대구 중구', '숙소', '일자리'],
  },
  {
    id: 2,
    title: '처음 플래너 만들 때 확인하면 좋은 것',
    author: '삼터 운영',
    body: '월세, 고정 생활비, 출퇴근 시간을 함께 보면 실제로 남는 금액이 더 선명해집니다.',
    tags: ['플래너', '예산'],
  },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [draft, setDraft] = useState({ title: '', body: '' })

  const submit = (event) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.body.trim()) return
    setPosts((prev) => [
      {
        id: Date.now(),
        title: draft.title.trim(),
        author: 'Planner Demo',
        body: draft.body.trim(),
        tags: ['새 글'],
      },
      ...prev,
    ])
    setDraft({ title: '', body: '' })
  }

  return (
    <main className="directory-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">COMMUNITY</p>
            <h1 className="directory-title">커뮤니티</h1>
            <p className="directory-desc">지역 체류, 일자리, 숙소 경험을 공유하는 공간입니다.</p>
          </div>
        </header>

        <section className="planner-detail-panel" style={{ marginBottom: 18 }}>
          <form className="planner-form" onSubmit={submit}>
            <label>
              제목
              <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="공유할 이야기를 적어주세요." />
            </label>
            <label>
              내용
              <textarea value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} placeholder="지역, 일자리, 숙소 팁을 남길 수 있습니다." />
            </label>
            <div className="directory-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="directory-btn primary" type="submit">글 등록</button>
            </div>
          </form>
        </section>

        <section className="community-list">
          {posts.map((post) => (
            <article className="directory-card" key={post.id}>
              <div className="directory-card-top">
                <div>
                  <h2 className="directory-card-title">{post.title}</h2>
                  <p className="directory-card-sub">{post.author}</p>
                </div>
                <span className="directory-badge">게시글</span>
              </div>
              <p className="directory-desc">{post.body}</p>
              <div className="directory-tags">
                {post.tags.map((tag) => <span className="directory-tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
