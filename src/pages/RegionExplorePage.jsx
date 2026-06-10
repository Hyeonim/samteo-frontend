import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import './ExplorePages.css'

function unwrap(res) {
  return res.data ?? res.result ?? res
}

export default function RegionExplorePage() {
  const navigate = useNavigate()
  const [regions, setRegions] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/regions')
      .then((res) => setRegions(unwrap(res)))
      .catch(() => setRegions([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((region) => (
      `${region.name} ${region.summary ?? region.desc ?? ''} ${(region.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(q)
    ))
  }, [regions, query])

  return (
    <main className="directory-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">REGION</p>
            <h1 className="directory-title">지역 탐색</h1>
            <p className="directory-desc">체류할 지역의 생활비, 핫플레이스, 추천 이유를 비교해 보세요.</p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn primary" onClick={() => navigate('/planner')}>플래너 시작</button>
          </div>
        </header>

        <div className="directory-toolbar">
          <input
            className="directory-search"
            placeholder="지역명, 특징, 태그 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="directory-empty">지역 정보를 불러오는 중입니다.</div>
        ) : filtered.length === 0 ? (
          <div className="directory-empty">표시할 지역 데이터가 없습니다.</div>
        ) : (
          <section className="directory-grid">
            {filtered.map((region) => (
              <article className="directory-card" key={region.id ?? region.name}>
                <div className="directory-card-top">
                  <div>
                    <h2 className="directory-card-title">{region.name}</h2>
                    <p className="directory-card-sub">{region.summary ?? region.desc}</p>
                  </div>
                  <span className="directory-badge">{region.badge ?? '추천'}</span>
                </div>
                <div className="directory-metrics">
                  <div className="directory-metric"><span>핫플 점수</span><strong>{region.hotPlaceScore ?? '-'}</strong></div>
                  <div className="directory-metric"><span>주거비 점수</span><strong>{region.housingCostScore ?? '-'}</strong></div>
                </div>
                <div className="directory-tags">
                  {(region.tags ?? region.recommendationReasons ?? []).slice(0, 5).map((tag) => (
                    <span className="directory-tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
