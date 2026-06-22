import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'

const CARD_BACKGROUNDS = [
  'linear-gradient(160deg, #1e3a5f, #2d5a8e)',
  'linear-gradient(160deg, #0d4a3a, #1a7a5e)',
  'linear-gradient(160deg, #3b2800, #7c4d1a)',
  'linear-gradient(160deg, #2d1b69, #553c9a)',
  'linear-gradient(160deg, #4a1515, #8b2e2e)',
  'linear-gradient(160deg, #1a3320, #2d6040)',
]

function unwrap(res) {
  return res.data ?? res.result ?? res
}

export default function Step1Region({ selectedRegion, onSelect }) {
  const [search, setSearch] = useState('')
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/regions')
      .then((regionRes) => {
        setRegions(unwrap(regionRes)
          .map((region) => ({ id: String(region.id), name: region.name }))
          .sort((a, b) => Number(a.id) - Number(b.id)))
      })
      .catch(() => setRegions([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return regions
    return regions.filter((region) => region.name.includes(q))
  }, [regions, search])

  return (
    <div className="step-card">
      <div className="step-title">어디서 한 달 동안 체류하고 싶으신가요?</div>
      <div className="step-subtitle">
        지역 메타데이터를 기준으로 선택 가능한 시·도를 불러옵니다.
      </div>

      <div className="region-search-wrap">
        <span className="region-search-icon">🔎</span>
        <input
          className="region-search-input"
          type="text"
          placeholder="지역명을 검색하세요"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button className="region-search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {loading ? (
        <div className="region-empty">지역 데이터를 불러오는 중입니다.</div>
      ) : filtered.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>선택 가능한 지역이 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>meta_region 테이블의 지역 정보를 확인해 주세요.</div>
        </div>
      ) : (
        <div className="region-grid">
          {filtered.map((region, index) => (
            <div
              key={region.id}
              className={`region-card${selectedRegion === region.id ? ' selected' : ''}`}
              onClick={() => onSelect(region.id, region.name)}
            >
              <div className="rg-bg" style={{ background: CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length] }} />
              <div className="rg-overlay" />
              <div className="rg-badge rg-badge-blue">지역 선택</div>
              <div className="rg-info">
                <div className="rg-city">{region.name}</div>
                <div className="rg-desc">지역 메타데이터를 기준으로 플래너를 시작합니다.</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
