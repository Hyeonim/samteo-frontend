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

const REGION_IMAGES = {
  서울: '/regions/seoul.png',
  서울특별시: '/regions/seoul.png',
  인천: '/regions/incheon.png',
  인천광역시: '/regions/incheon.png',
  대전: '/regions/daejeon.png',
  대전광역시: '/regions/daejeon.png',
  대구: '/regions/daegu.png',
  대구광역시: '/regions/daegu.png',
  광주: '/regions/gwangju.png',
  광주광역시: '/regions/gwangju.png',
  부산: '/regions/busan.png',
  부산광역시: '/regions/busan.png',
  울산: '/regions/ulsan.png',
  울산광역시: '/regions/ulsan.png',
  세종: '/regions/sejong.png',
  세종특별자치시: '/regions/sejong.png',
  경기: '/regions/gyeonggi-map.png',
  경기도: '/regions/gyeonggi-map.png',
  강원: '/regions/gangwon-map.png',
  강원도: '/regions/gangwon-map.png',
  강원특별자치도: '/regions/gangwon-map.png',
  충북: '/regions/chungbuk-map.png',
  충청북도: '/regions/chungbuk-map.png',
  충남: '/regions/chungnam-map.png',
  충청남도: '/regions/chungnam-map.png',
  경북: '/regions/gyeongbuk-map.png',
  경상북도: '/regions/gyeongbuk-map.png',
  경남: '/regions/gyeongnam-map.png',
  경상남도: '/regions/gyeongnam-map.png',
  전북: '/regions/jeonbuk-map.png',
  전라북도: '/regions/jeonbuk-map.png',
  전북특별자치도: '/regions/jeonbuk-map.png',
  전남: '/regions/jeonnam-map.png',
  전라남도: '/regions/jeonnam-map.png',
  제주: '/regions/jeju-map.png',
  제주도: '/regions/jeju-map.png',
  제주특별자치도: '/regions/jeju-map.png',
}

function normalizeRegionName(name) {
  return String(name ?? '').replace(/\s/g, '')
}

function getRegionImage(name) {
  const normalizedName = normalizeRegionName(name)
  return REGION_IMAGES[normalizedName] ?? null
}

function getRegionCardStyle(region, index) {
  const image = getRegionImage(region.name)
  if (image) {
    return { backgroundImage: `url("${image}")` }
  }

  return { background: CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length] }
}

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
              <div className="rg-bg" style={getRegionCardStyle(region, index)} />
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
