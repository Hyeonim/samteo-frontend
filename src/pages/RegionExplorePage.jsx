import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import './ExplorePages.css'

const FALLBACK_REGIONS = [
  {
    id: 'junggu',
    name: '대구 중구',
    summary: '동성로와 대구역 중심의 도심 생활권입니다.',
    hotPlaceScore: 96,
    housingCostScore: 62,
    tags: ['도심', '교통', '문화'],
    recommendationReasons: ['단기 일자리 접근성이 좋습니다.', '도보와 대중교통 생활에 적합합니다.'],
  },
  {
    id: 'donggu',
    name: '대구 동구',
    summary: '동대구역과 공항 접근성이 좋은 이동 중심 지역입니다.',
    hotPlaceScore: 88,
    housingCostScore: 70,
    tags: ['역세권', '관광', '교통'],
    recommendationReasons: ['관광 서비스 일자리와 잘 맞습니다.', '다른 지역 이동이 편합니다.'],
  },
]

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
      .catch(() => setRegions(FALLBACK_REGIONS))
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
          <div className="directory-empty">검색 조건에 맞는 지역이 없습니다.</div>
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
                  <div className="directory-metric"><span>핫플 점수</span><strong>{region.hotPlaceScore ?? '-'}점</strong></div>
                  <div className="directory-metric"><span>주거비 점수</span><strong>{region.housingCostScore ?? '-'}점</strong></div>
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
