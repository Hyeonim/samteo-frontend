import { useState } from 'react'
import './ExplorePages.css'

export default function CommunityPage() {
  const [posts, setPosts] = useState([])
  const [draft, setDraft] = useState({ title: '', body: '' })

  const submit = (event) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.body.trim()) return
    setPosts((prev) => [
      {
        id: Date.now(),
        title: draft.title.trim(),
        author: '작성자',
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
              <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="공유할 이야기를 적어주세요" />
            </label>
            <label>
              내용
              <textarea value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} placeholder="지역, 일자리, 숙소 경험을 남길 수 있습니다." />
            </label>
            <div className="directory-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="directory-btn primary" type="submit">글 등록</button>
            </div>
          </form>
        </section>

        {posts.length === 0 ? (
          <div className="directory-empty">등록된 게시글이 없습니다.</div>
        ) : (
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
        )}
      </div>
    </main>
  )
}
