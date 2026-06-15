import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingScreen from '../components/common/LoadingScreen'
import './ExplorePages.css'

function unwrap(res) {
  return res.data ?? res.result ?? res
}

export default function AccommodationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/planner/accommodations')
      .then((res) => setItems(unwrap(res)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => (
      `${item.name} ${item.district ?? ''} ${item.address ?? item.location ?? ''} ${(item.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(q)
    ))
  }, [items, query])

  return (
    <main className="directory-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">STAY</p>
            <h1 className="directory-title">숙소 찾기</h1>
            <p className="directory-desc">월세, 보증금, 출퇴근 시간을 비교하고 체류 예산에 맞는 숙소를 찾으세요.</p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn primary" onClick={() => navigate('/planner')}>숙소 포함 플래너 만들기</button>
          </div>
        </header>

        <div className="directory-toolbar">
          <input className="directory-search" placeholder="숙소명, 지역, 조건 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {loading ? (
          <LoadingScreen message="숙소 정보를 불러오는 중입니다" description="가격과 위치 정보를 정리하고 있습니다." />
        ) : filtered.length === 0 ? (
          <div className="directory-empty">검색 조건에 맞는 숙소가 없습니다.</div>
        ) : (
          <section className="directory-grid">
            {filtered.map((item) => (
              <article className="directory-card" key={item.id ?? item.name}>
                <div className="directory-card-top">
                  <div>
                    <h2 className="directory-card-title">{item.name}</h2>
                    <p className="directory-card-sub">{item.address ?? item.location} · {item.district}</p>
                  </div>
                  <span className="directory-badge">{item.commuteMinutes ?? '-'}분</span>
                </div>
                <div className="directory-metrics">
                  <div className="directory-metric"><span>월 비용</span><strong>{(item.monthlyPrice ?? item.price ?? 0).toLocaleString()}원</strong></div>
                  <div className="directory-metric"><span>보증금</span><strong>{(item.deposit ?? 0).toLocaleString()}원</strong></div>
                </div>
                <div className="directory-tags">
                  {(item.tags ?? []).map((tag) => <span className="directory-tag" key={tag}>{tag}</span>)}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
