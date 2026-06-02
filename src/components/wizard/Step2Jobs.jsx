import { useState, useEffect, useMemo } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const BG_CYCLE = ['pi1', 'pi2', 'pi3']

export default function Step2Jobs({ region, selectedJobs, onToggle }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('전체')

  useEffect(() => {
    setLoading(true)
    setSearch('')
    setActiveType('전체')
    fetch(`${API_BASE}/api/planner/jobs?regionId=${encodeURIComponent(region)}`)
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? res.result ?? res
        setJobs(data.map((j) => ({
          ...j,
          lat: parseFloat(j.lat ?? j.latitude),
          lng: parseFloat(j.lng ?? j.longitude),
          salary: j.monthlySalary ?? j.salary,
        })))
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [region])

  const availableTypes = useMemo(
    () => ['전체', ...new Set(jobs.map((j) => j.type))],
    [jobs]
  )

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchType = activeType === '전체' || j.type === activeType
      const q = search.trim()
      const matchSearch = !q || j.name?.includes(q) || j.desc?.includes(q) || j.type?.includes(q)
      return matchType && matchSearch
    })
  }, [jobs, activeType, search])

  return (
    <div className="step-card">
      <div className="step-title">
        <span className="job-region-tag">{region}</span> 출퇴근 1시간 안의 알바 자리만 골라왔어요!
      </div>
      <div className="step-subtitle" style={{ color: '#ef4444', fontWeight: 600 }}>
        ⚠️ 자체 원둘레 필터링 및 대중교통 다익스트라 알고리즘 검증 완료
      </div>

      {selectedJobs.length > 0 && (
        <div className="job-selected-count">
          ✓ {selectedJobs.length}개 선택됨 · 중복 알바도 가능해요!
        </div>
      )}

      <div className="region-search-wrap" style={{ marginBottom: 14 }}>
        <span className="region-search-icon">🔍</span>
        <input
          className="region-search-input"
          type="text"
          placeholder={`${region} 내 일자리 검색  (예: 카페, 숙식제공)`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="region-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className="job-filter-bar">
        {availableTypes.map((t) => (
          <div
            key={t}
            className={`jchip ${activeType === t ? 'active' : 'def'}`}
            onClick={() => setActiveType(t)}
          >
            {t}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 700 }}>알바 목록 불러오는 중...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>다른 키워드나 업종으로 검색해 보세요</div>
        </div>
      ) : (
        <div className="pkg-grid">
          {filtered.map((job, idx) => {
            const isSelected = selectedJobs.some((j) => j.id === job.id)
            const bg = BG_CYCLE[idx % 3]
            return (
              <div
                key={job.id}
                className={`pkg-card${isSelected ? ' selected' : ''}`}
                onClick={() => onToggle(job)}
              >
                {job.best && <div className="pkg-best">⭐ BEST</div>}
                {isSelected && <div className="pkg-check-badge">✓</div>}
                <div className={`pkg-img ${bg}`}>
                  <div className="pkg-img-label">{job.emoji}</div>
                  <div className="pkg-img-overlay">
                    <div className="pkg-location">{job.location}</div>
                  </div>
                </div>
                <div className="pkg-body">
                  <div className="pkg-type">{job.type}</div>
                  <div className="pkg-name">{job.name}</div>
                  <div className="pkg-desc">{job.desc}</div>
                  <div className="pkg-tags">
                    {(job.tags ?? []).map((t) => (
                      <span key={t} className="ptag">{t}</span>
                    ))}
                  </div>
                  <div className="pkg-footer">
                    <div className="pkg-price">
                      <span className="amount">{job.priceLabel}</span>
                      <span className="unit">{job.unit}</span>
                      <span className="sub">{job.sub}</span>
                    </div>
                    <button
                      className={`pkg-btn${isSelected ? ' sel' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onToggle(job) }}
                    >
                      {isSelected ? '✓ 선택됨' : '선택하기'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
