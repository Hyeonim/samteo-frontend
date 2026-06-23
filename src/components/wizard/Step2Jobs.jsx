import { useState, useEffect, useMemo } from 'react'
import { api } from '../../api'

const BG_CYCLE = ['pi1', 'pi2', 'pi3']
const PAGE_SIZE = 12
const PAGE_GROUP_SIZE = 5

function pageGroupStart(page) {
  return Math.floor((page - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1
}

function paginationPages(page, totalPages) {
  const start = pageGroupStart(page)
  const end = Math.min(start + PAGE_GROUP_SIZE - 1, totalPages)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}

function formatJobDetail(value) {
  const text = String(value ?? '').trim()
  if (!text) return ['상세 자격조건은 원문 공고에서 확인해 주세요.']
  return text
    .replace(/\s+(?=[□○※·])/g, '\n')
    .replace(/\s+(?=\d+[.)]\s)/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const CITY_LABELS = {
  seoul: '서울',
  busan: '부산',
  daegu: '대구',
  jeju: '제주',
  gangneung: '강릉',
  jeonju: '전주',
  gyeongju: '경주',
  incheon: '인천',
  yeosu: '여수',
  sokcho: '속초',
  gwangju: '광주',
  daejeon: '대전',
}

const DAEGU_REGION_LABELS = {
  junggu: '중구',
  donggu: '동구',
  suseong: '수성구',
  dalseo: '달서구',
  bukgu: '북구',
}

const DAEGU_DISTRICT_REGION_IDS = {
  중구: 'junggu',
  동구: 'donggu',
  수성구: 'suseong',
  달서구: 'dalseo',
  북구: 'bukgu',
}

const ENGLISH_DISTRICTS = {
  'Jung-gu': '중구',
  'Dong-gu': '동구',
  'Suseong-gu': '수성구',
  'Dalseo-gu': '달서구',
  'Buk-gu': '북구',
}

function translateCategory(value) {
  const labels = {
    'Food and Beverage': '카페·식음료',
    Accommodation: '숙박',
    Tourism: '관광',
    Store: '매장',
    'Food Service': '외식',
    Logistics: '물류',
    Event: '행사',
    Mobility: '이동서비스',
    Shopping: '판매',
  }
  return labels[value] ?? value ?? '추천'
}

function translateTag(value) {
  const labels = {
    cafe: '카페',
    beginner: '초보 가능',
    'day-shift': '주간',
    stay: '숙박업',
    cleaning: '객실관리',
    'guest-service': '고객응대',
    tourism: '관광',
    'language-plus': '외국어 우대',
    weekend: '주말',
    night: '야간',
    store: '매장',
    'short-term': '단기',
    'meal-support': '식사 제공',
    service: '서비스',
    'local-food': '로컬푸드',
    logistics: '물류',
    standing: '입식근무',
    event: '행사',
    'team-work': '팀근무',
    desk: '데스크',
    'driver-license-plus': '운전면허 우대',
    sales: '판매',
    morning: '오전',
    hotel: '호텔',
  }
  return labels[value] ?? value
}

function jobEmoji(category) {
  const labels = {
    '카페·식음료': '☕',
    숙박: '🏠',
    관광: '🧭',
    매장: '🏪',
    외식: '🍽',
    물류: '📦',
    행사: '🎪',
    이동서비스: '🚗',
    판매: '🛍',
  }
  return labels[category] ?? '💼'
}

function unwrap(res) {
  return res.data ?? res.result ?? res
}

function parseDistrict(text) {
  if (!text) return null

  for (const [english, korean] of Object.entries(ENGLISH_DISTRICTS)) {
    if (text.includes(english)) return korean
  }

  const compact = text.replace(/\s+/g, ' ')
  const match = compact.match(/([가-힣]+구|[가-힣]+군|[가-힣]+시)/)
  return match?.[1] ?? null
}

function inferCityId(job, addressText) {
  if (job.cityId) return job.cityId
  if (job.regionId && DAEGU_REGION_LABELS[job.regionId]) return 'daegu'
  if (!addressText) return null

  const cityMatchers = {
    seoul: ['서울', '서울특별시'],
    busan: ['부산', '부산광역시'],
    daegu: ['대구', '대구광역시'],
    jeju: ['제주', '제주특별자치도'],
    gangneung: ['강릉'],
    jeonju: ['전주'],
    gyeongju: ['경주'],
    incheon: ['인천', '인천광역시'],
    yeosu: ['여수'],
    sokcho: ['속초'],
    gwangju: ['광주', '광주광역시'],
    daejeon: ['대전', '대전광역시'],
  }

  return Object.entries(cityMatchers)
    .find(([, aliases]) => aliases.some((alias) => addressText.includes(alias)))?.[0] ?? null
}

function normalizeJob(job) {
  const addressText = [
    job.address,
    job.location,
    job.locationDesc,
    job.district,
    job.region,
  ].filter(Boolean).join(' ')

  const cityId = inferCityId(job, addressText)
  const district = DAEGU_REGION_LABELS[job.regionId] ?? parseDistrict(addressText)
  const districtRegionId = job.regionId ?? DAEGU_DISTRICT_REGION_IDS[district] ?? district
  const hourlyWage = Number(job.hourlyWage ?? job.wage ?? 10320)
  const salary = Number(job.monthlySalary ?? job.salary ?? hourlyWage * 209)
  const type = translateCategory(job.type ?? job.category)

  return {
    ...job,
    cityId,
    cityName: CITY_LABELS[cityId] ?? cityId,
    district,
    districtRegionId,
    name: job.name ?? job.title,
    title: job.title ?? job.name,
    type,
    lat: parseFloat(job.lat ?? job.latitude),
    lng: parseFloat(job.lng ?? job.longitude),
    salary,
    monthlySalary: salary,
    hourlyWage,
    priceLabel: `${hourlyWage.toLocaleString()}원`,
    unit: '/시간',
    sub: job.sub === 'dummy job data' ? '샘플 일자리 데이터' : (job.sub ?? job.workingDays ?? ''),
    desc: job.desc ?? job.company ?? addressText,
    location: job.location ?? addressText,
    tags: (job.tags ?? []).map(translateTag),
    emoji: !job.emoji || job.emoji === 'JOB' ? jobEmoji(type) : job.emoji,
  }
}

const MOBILE_INITIAL = 6

export default function Step2Jobs({
  plannerType = 'long',
  cityId,
  cityName = CITY_LABELS[cityId] ?? cityId,
  selectedDistrictId,
  selectedJobs,
  onDistrictSelect,
  onToggle,
}) {
  const isShortTerm = plannerType === 'short'

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('전체')
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [detailJob, setDetailJob] = useState(null)

  useEffect(() => {
    if (!cityId) return
    setLoading(true)
    setSearch('')
    setActiveType('전체')
    setShowAll(false)
    const typeParam = isShortTerm ? '&type=short' : ''
    api.get(`/api/planner/jobs/page?cityId=${encodeURIComponent(cityId)}&page=${page}&size=${PAGE_SIZE}${typeParam}`)
      .then((res) => {
        const data = unwrap(res)
        setJobs((data.items ?? []).map(normalizeJob))
        setTotalPages(Math.max(1, Number(data.totalPages ?? 1)))
        setTotalCount(Number(data.totalCount ?? 0))
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [cityId, page, isShortTerm])

  useEffect(() => { setPage(1) }, [cityId, isShortTerm])

  // 필터 바뀌면 더 보기 리셋
  useEffect(() => { setShowAll(false) }, [search, activeType, selectedDistrictId])

  const cityJobs = useMemo(() => jobs, [jobs])

  const districts = useMemo(() => {
    const map = new Map()
    cityJobs.forEach((job) => {
      if (!job.districtRegionId || !job.district) return
      map.set(job.districtRegionId, job.district)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [cityJobs])

  const availableTypes = useMemo(
    () => ['전체', ...new Set(cityJobs.map((j) => j.type).filter(Boolean))],
    [cityJobs]
  )

  const filtered = useMemo(() => {
    return cityJobs.filter((j) => {
      const matchDistrict = !selectedDistrictId || j.districtRegionId === selectedDistrictId
      const matchType = activeType === '전체' || j.type === activeType
      const q = search.trim()
      const body = `${j.name ?? ''} ${j.desc ?? ''} ${j.location ?? ''} ${j.type ?? ''} ${(j.tags ?? []).join(' ')}`
      const matchSearch = !q || body.includes(q)
      return matchDistrict && matchType && matchSearch
    })
  }, [cityJobs, selectedDistrictId, activeType, search])

  function selectJob(job) {
    if (!selectedDistrictId && job.districtRegionId) {
      onDistrictSelect(job.districtRegionId, job.district)
    }
    onToggle(job)
  }

  return (
    <div className="step-card">
      <div className="step-title">
        <span className="job-region-tag">{cityName}</span>
        {isShortTerm ? ' 단기 알바 일자리를 선택해요' : ' 일자리 주소를 검증했어요'}
      </div>
      {!isShortTerm && (
        <div className="step-subtitle" style={{ color: '#ef4444', fontWeight: 600 }}>
          실제 일자리 주소에서 도시와 구·군을 추출해 체류 지역을 좁혀갑니다.
        </div>
      )}
      <div className="step-subtitle">
        {isShortTerm
          ? `샘플 알바 일자리 ${totalCount}개 · 실제 시급은 플래너 완성 후 수정할 수 있습니다.`
          : `진행 중 공고 총 ${totalCount.toLocaleString()}건 · 시급은 플래너 완성 후 수정할 수 있습니다.`}
      </div>

      {selectedJobs.length > 0 && (
        <div className="job-selected-count">
          ✓ {selectedJobs.length}개 선택됨 · 선택한 일자리의 구·군을 기준으로 다음 단계를 진행합니다.
        </div>
      )}

      <div className="region-search-wrap" style={{ marginBottom: 14 }}>
        <span className="region-search-icon">🔍</span>
        <input
          className="region-search-input"
          type="text"
          placeholder={`${cityName} 일자리 검색  (예: 카페, 숙식제공, 구암로)`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="region-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {districts.length > 0 && (
        <div className="job-filter-bar">
          <div
            className={`jchip ${!selectedDistrictId ? 'active' : 'def'}`}
            onClick={() => onDistrictSelect(null, null)}
          >
            전체 구·군
          </div>
          {districts.map((district) => (
            <div
              key={district.id}
              className={`jchip ${selectedDistrictId === district.id ? 'active' : 'def'}`}
              onClick={() => onDistrictSelect(district.id, district.name)}
            >
              {district.name}
            </div>
          ))}
        </div>
      )}

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
          <div style={{ fontWeight: 700 }}>일자리 목록을 검증하는 중...</div>
        </div>
      ) : cityJobs.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{cityName}에서 검증된 일자리가 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>다른 도시를 선택하거나 일자리 데이터 수집 범위를 확인해 주세요</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>다른 키워드나 구·군으로 검색해 보세요</div>
        </div>
      ) : (
        <>
          <div className="pkg-grid">
            {filtered.map((job, idx) => {
              const isSelected = selectedJobs.some((j) => j.id === job.id)
              const bg = BG_CYCLE[idx % 3]
              return (
                <div
                  key={job.id}
                  className={`pkg-card${isSelected ? ' selected' : ''}`}
                  onClick={() => selectJob(job)}
                >
                  {job.best && <div className="pkg-best">⭐ BEST</div>}
                  {isSelected && <div className="pkg-check-badge">✓</div>}
                  <div className={`pkg-img ${bg}`}>
                    <div className="pkg-img-label">{job.emoji}</div>
                    <div className="pkg-img-overlay">
                      <div className="pkg-location">{job.district ? `${cityName} ${job.district}` : job.location}</div>
                    </div>
                  </div>
                  <div className="pkg-body">
                    <div className="pkg-type">{job.type}</div>
                    <div className="pkg-name">{job.name}</div>
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
                      <div className="pkg-actions">
                        <button className="pkg-btn detail" onClick={(e) => { e.stopPropagation(); setDetailJob(job) }}>자세히 보기</button>
                        <button
                          className={`pkg-btn${isSelected ? ' sel' : ''}`}
                          onClick={(e) => { e.stopPropagation(); selectJob(job) }}
                        >
                          {isSelected ? '✓ 선택됨' : '선택하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {!isShortTerm && (
            <nav className="event-pagination" aria-label="일자리 페이지 이동">
              <button className="directory-btn" disabled={pageGroupStart(page) === 1} onClick={() => setPage(Math.max(1, pageGroupStart(page) - PAGE_GROUP_SIZE))}>이전</button>
              <div className="event-page-numbers">
                {page > PAGE_GROUP_SIZE && <span>…</span>}
                {paginationPages(page, totalPages).map((number) => (
                  <button key={number} className={number === page ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>
                ))}
                {pageGroupStart(page) + PAGE_GROUP_SIZE <= totalPages && <span>…</span>}
              </div>
              <button className="directory-btn" disabled={pageGroupStart(page) + PAGE_GROUP_SIZE > totalPages} onClick={() => setPage(pageGroupStart(page) + PAGE_GROUP_SIZE)}>다음</button>
            </nav>
          )}
        </>
      )}

      {detailJob && (
        <div className="planner-modal-backdrop" onClick={() => setDetailJob(null)}>
          <section className="event-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="planner-day-modal-head">
              <div><p>{isShortTerm ? '단기 알바 상세' : 'ALIO 채용공고 상세'}</p><h2>{detailJob.title}</h2></div>
              <button type="button" onClick={() => setDetailJob(null)} aria-label="닫기">x</button>
            </div>
            <div className="job-detail-placeholder"><span>💼</span><strong>{detailJob.company}</strong><small>ALIO 채용공고는 별도 이미지를 제공하지 않습니다.</small></div>
            <div className="event-detail-location"><span>근무지역</span><strong>{detailJob.location || '-'}</strong></div>
            <div className="event-detail-overview job-detail-copy">
              {formatJobDetail(detailJob.desc).map((line, index) => <p key={`${index}-${line.slice(0, 20)}`}>{line}</p>)}
            </div>
            <div className="directory-tags">
              {(detailJob.tags ?? []).map((tag) => <span className="directory-tag" key={tag}>{tag}</span>)}
            </div>
            <div className="event-detail-actions">
              {detailJob.sourceUrl && <a className="directory-btn" href={detailJob.sourceUrl} target="_blank" rel="noreferrer">원문 공고 보기</a>}
              <button className="directory-btn primary" onClick={() => { selectJob(detailJob); setDetailJob(null) }}>{selectedJobs.some((job) => job.id === detailJob.id) ? '선택 해제' : '이 일자리 선택'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
