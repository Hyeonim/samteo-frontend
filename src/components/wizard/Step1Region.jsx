import { useState } from 'react'

const REGIONS = [
  {
    id: 'seoul',
    name: '서울',
    emoji: '🏙️',
    desc: '홍대 · 강남 · 이태원 · 카페·음식점 단기 알바',
    badge: '인기 1순위',
    badgeType: 'blue',
    bg: 'linear-gradient(160deg, #1e3a5f, #2d5a8e)',
  },
  {
    id: 'busan',
    name: '부산',
    emoji: '🌊',
    desc: '해운대 · 광안리 · 리조트·호텔 서비스',
    badge: '해변 추천',
    badgeType: 'green',
    bg: 'linear-gradient(160deg, #0d4a3a, #1a7a5e)',
  },
  {
    id: 'daegu',
    name: '대구',
    emoji: '🍎',
    desc: '동성로 · 팔공산 · 카페·관광안내 스태프',
    badge: '추천',
    badgeType: '',
    bg: 'linear-gradient(160deg, #3b2800, #7c4d1a)',
  },
  {
    id: 'jeju',
    name: '제주',
    emoji: '🍊',
    desc: '성산일출봉 · 애월 · 리조트·카페 시즌 알바',
    badge: '핫플',
    badgeType: 'blue',
    bg: 'linear-gradient(160deg, #0d4a3a, #2d7a3e)',
  },
  {
    id: 'gangneung',
    name: '강릉',
    emoji: '🌲',
    desc: '경포대 · 안목해변 · 카페·숙박 단기 알바',
    badge: '자연·힐링',
    badgeType: '',
    bg: 'linear-gradient(160deg, #1a3320, #2d6040)',
  },
  {
    id: 'jeonju',
    name: '전주',
    emoji: '🏯',
    desc: '한옥마을 · 전통음식 · 문화관광 스태프',
    badge: '전통·문화',
    badgeType: 'green',
    bg: 'linear-gradient(160deg, #4a2800, #8b5e2e)',
  },
  {
    id: 'gyeongju',
    name: '경주',
    emoji: '⛩️',
    desc: '불국사 · 첨성대 · 관광안내 스태프',
    badge: '역사·유산',
    badgeType: '',
    bg: 'linear-gradient(160deg, #2d1b69, #553c9a)',
  },
  {
    id: 'incheon',
    name: '인천',
    emoji: '✈️',
    desc: '송도 · 영종도 · 공항·물류 단기 알바',
    badge: '',
    badgeType: '',
    bg: 'linear-gradient(160deg, #1a2a5f, #2d4a9e)',
  },
  {
    id: 'yeosu',
    name: '여수',
    emoji: '🦑',
    desc: '여수밤바다 · 돌산도 · 수산·관광 스태프',
    badge: '바다·낭만',
    badgeType: '',
    bg: 'linear-gradient(160deg, #0d3a5f, #1a6a8e)',
  },
  {
    id: 'sokcho',
    name: '속초',
    emoji: '🏔️',
    desc: '설악산 · 청초호 · 리조트·게스트하우스',
    badge: '산·바다',
    badgeType: '',
    bg: 'linear-gradient(160deg, #1a3a20, #2d6a40)',
  },
  {
    id: 'gwangju',
    name: '광주',
    emoji: '🎨',
    desc: '5·18민주광장 · 국립아시아문화전당 · 문화예술',
    badge: '',
    badgeType: '',
    bg: 'linear-gradient(160deg, #4a1515, #8b2e2e)',
  },
  {
    id: 'daejeon',
    name: '대전',
    emoji: '🔬',
    desc: '엑스포 · 유성온천 · 연구·서비스 단기 알바',
    badge: '',
    badgeType: '',
    bg: 'linear-gradient(160deg, #2a1a5f, #4a3a9a)',
  },
]

export default function Step1Region({ selectedRegion, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? REGIONS.filter((r) => r.name.includes(search.trim()) || r.desc.includes(search.trim()))
    : REGIONS

  return (
    <div className="step-card">
      <div className="step-title">어디서 한 달 동안 체류하고 싶으신가요?</div>
      <div className="step-subtitle">
        관심 있는 지역을 선택하면 해당 지역 숙소·일자리를 바로 매칭합니다.
      </div>

      <div className="region-search-wrap">
        <span className="region-search-icon">🔍</span>
        <input
          className="region-search-input"
          type="text"
          placeholder="지역명을 검색하세요  (예: 제주, 강릉)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="region-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>다른 지역명으로 검색해 보세요</div>
        </div>
      ) : (
        <div className="region-grid">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`region-card${selectedRegion === r.name ? ' selected' : ''}`}
              onClick={() => onSelect(r.name)}
            >
              <div className="rg-bg" style={{ background: r.bg }} />
              <div className="rg-emoji">{r.emoji}</div>
              <div className="rg-overlay" />
              {r.badge && (
                <div
                  className={`rg-badge${r.badgeType === 'blue' ? ' rg-badge-blue' : r.badgeType === 'green' ? ' rg-badge-green' : ''}`}
                >
                  {r.badge}
                </div>
              )}
              <div className="rg-info">
                <div className="rg-city">{r.name}</div>
                <div className="rg-desc">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
