import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingScreen from '../components/common/LoadingScreen'
import { getStoredPlanners, saveStoredPlanner } from '../utils/plannerStorage'
import { createWorkScheduleId } from '../utils/plannerSchedule'
import './ExplorePages.css'

const CATEGORIES = [
  { id: 'festivals', label: '축제' },
  { id: 'attractions', label: '관광지' },
  { id: 'restaurants', label: '식당' },
]
const CATEGORY_CONFIG = {
  festivals: { endpoint: '/api/festivals', label: '축제' },
  attractions: { endpoint: '/api/attractions', label: '관광지' },
  restaurants: { endpoint: '/api/restaurants', label: '식당' },
}
const PAGE_SIZE = 20
const PAGE_GROUP_SIZE = 5

function pageGroupStart(currentPage) {
  return Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1
}

function unwrap(res) {
  return res.data ?? res.result ?? res
}

function paginationPages(currentPage, lastPage) {
  const startPage = pageGroupStart(currentPage)
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, lastPage ?? Number.MAX_SAFE_INTEGER)
  return Array.from(
    { length: Math.max(0, endPage - startPage + 1) },
    (_, index) => startPage + index,
  )
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDate(value) {
  const date = parseDate(value)
  if (!date) return value ?? '-'
  return `${date.getMonth() + 1}.${date.getDate()}`
}

function parseDate(value) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function dateRange(startValue, endValue) {
  const start = parseDate(startValue)
  const end = parseDate(endValue) ?? start
  if (!start || !end) return []

  const dates = []
  const cursor = new Date(start)
  while (cursor <= end && dates.length < 31) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function scheduleDayFromDate(date) {
  const nativeDay = date.getDay()
  return nativeDay === 0 ? 6 : nativeDay - 1
}

function regionTokens(value) {
  return String(value ?? '')
    .split(/\s+/)
    .map((token) => token.replace(/(특별자치도|특별자치시|특별시|광역시|자치시|자치도)$/g, ''))
    .map((token) => (token.length > 2 ? token.replace(/(시|도|군|구)$/g, '') : token))
    .map((token) => token.trim())
    .filter(Boolean)
}

function plannerRegion(planner) {
  return planner?.cityName ?? planner?.regionName ?? ''
}

function matchesRegion(festival, region) {
  if (!region) return true
  const targetTokens = regionTokens(region)
  const sourceTokens = regionTokens(festival.location)
  return targetTokens.some((target) => (
    sourceTokens.some((source) => source.includes(target) || target.includes(source))
  ))
}

function isDisplayableRegion(region) {
  const value = String(region ?? '').trim()
  return Boolean(value) && !/^\d+$/.test(value)
}

function sanitizeFestival(festival) {
  return isDisplayableRegion(festival.location)
    ? festival
    : { ...festival, location: null }
}

function EventVisual({ imageUrl, title, category = '행사' }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (imageUrl && !imageFailed) {
    return (
      <img
        className="event-thumbnail"
        src={imageUrl}
        alt={`${title} 대표 이미지`}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <div className="event-image-placeholder" aria-label={`${title} 이미지 미제공`}>
      <span aria-hidden="true">▧</span>
      <strong>이미지 미제공</strong>
      <small>{category}</small>
    </div>
  )
}

function DetailImage({ imageUrl, title }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (imageUrl && !imageFailed) {
    return (
      <img
        className="event-detail-image"
        src={imageUrl}
        alt={`${title} 대표 이미지`}
        onError={() => setImageFailed(true)}
      />
    )
  }
  return (
    <div className="event-detail-image-placeholder">
      <span aria-hidden="true">▧</span>
      <strong>이미지 미제공</strong>
    </div>
  )
}

const DETAIL_FIELD_LABELS = {
  infocenter: '문의 및 안내',
  restdate: '휴무일',
  usetime: '이용시간',
  parking: '주차',
  chkpet: '반려동물 동반',
  expguide: '체험 안내',
  eventplace: '행사 장소',
  playtime: '공연 시간',
  sponsor1: '주최자',
  sponsor1tel: '주최자 연락처',
  sponsor2: '주관사',
  sponsor2tel: '주관사 연락처',
  usetimefestival: '이용요금',
  spendtimefestival: '관람 소요시간',
  bookingplace: '예매처',
  firstmenu: '대표 메뉴',
  opentimefood: '영업시간',
  restdatefood: '휴무일',
  parkingfood: '주차',
  treatmenu: '취급 메뉴',
  reservationfood: '예약 안내',
  packing: '포장 가능',
  smoking: '흡연 가능 여부',
  infocenterfood: '문의 및 안내',
}

function stripHtml(value) {
  if (!value) return ''
  const documentValue = new DOMParser().parseFromString(String(value), 'text/html')
  return documentValue.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function detailFields(intro) {
  return Object.entries(intro ?? {})
    .filter(([key, value]) => value && DETAIL_FIELD_LABELS[key] && !/date/i.test(key))
    .map(([key, value]) => ({ label: DETAIL_FIELD_LABELS[key], value: stripHtml(value) }))
}

function ContentLocationMap({ latitude, longitude, title }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

    const renderMap = () => {
      if (!containerRef.current || !window.kakao?.maps) return
      window.kakao.maps.load(() => {
        if (!containerRef.current) return
        const position = new window.kakao.maps.LatLng(lat, lng)
        const map = new window.kakao.maps.Map(containerRef.current, { center: position, level: 4 })
        new window.kakao.maps.Marker({ map, position, title })
      })
    }

    if (window.kakao?.maps) {
      renderMap()
    } else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]')
      script?.addEventListener('load', renderMap)
      return () => script?.removeEventListener('load', renderMap)
    }
    return undefined
  }, [latitude, longitude, title])

  return <div className="event-detail-map" ref={containerRef} aria-label={`${title} 위치 지도`} />
}

function buildWorkSchedule(planner) {
  return (planner.jobs ?? []).flatMap((job, jobIndex) => [0, 1, 2, 3, 4].map((day) => ({
    id: createWorkScheduleId(planner.id, job.id ?? jobIndex, day),
    title: job.name ?? job.title ?? '근무',
    type: 'work',
    day,
    start: '09:00',
    end: '16:00',
    color: '#ef7f72',
    memo: job.company ?? job.type ?? '자동 생성된 근무 일정',
    locked: true,
  })))
}

function mergeSchedule(planner, events) {
  const saved = Array.isArray(planner.schedule) ? planner.schedule : []
  const base = saved.length > 0 ? saved : buildWorkSchedule(planner)
  return [...base, ...events]
}

export default function EventsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialPlanners = getStoredPlanners()
  const [category, setCategory] = useState('festivals')
  const [festivals, setFestivals] = useState([])
  const [attractions, setAttractions] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [lastPage, setLastPage] = useState(null)
  const [planners, setPlanners] = useState(() => initialPlanners)
  const [selectedPlannerId, setSelectedPlannerId] = useState(location.state?.plannerId ?? initialPlanners[0]?.id ?? '')
  const [regionFilter, setRegionFilter] = useState('all')
  const [selectedRegions, setSelectedRegions] = useState([])
  const [regionMenuOpen, setRegionMenuOpen] = useState(false)
  const [selectedFestival, setSelectedFestival] = useState(null)
  const [detailContent, setDetailContent] = useState(null)
  const [detailData, setDetailData] = useState({ common: null, intro: {}, loading: false, error: '' })
  const [selectedDate, setSelectedDate] = useState('')
  const [mode, setMode] = useState('single')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('20:00')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLoading(true)
    const endpoint = CATEGORY_CONFIG[category].endpoint
    api.get(`${endpoint}?numOfRows=${PAGE_SIZE}&pageNo=${page}`)
      .then((result) => {
        const rawItems = unwrap(result)
        const pageItems = rawItems.slice(0, PAGE_SIZE)
        const unique = new Map()
        pageItems.map(sanitizeFestival).forEach((item) => {
          const key = item.id ?? `${item.title}-${item.location}-${item.address}`
          unique.set(key, item)
        })
        const items = [...unique.values()]
        if (category === 'attractions') setAttractions(items)
        else if (category === 'restaurants') setRestaurants(items)
        else setFestivals(items)
        setHasNextPage(rawItems.length >= PAGE_SIZE)
        if (rawItems.length < PAGE_SIZE) setLastPage(page)
      })
      .catch(() => {
        if (category === 'attractions') setAttractions([])
        else if (category === 'restaurants') setRestaurants([])
        else setFestivals([])
        setHasNextPage(false)
      })
      .finally(() => setLoading(false))
  }, [category, page])

  const activeContents = category === 'attractions'
    ? attractions
    : category === 'restaurants'
      ? restaurants
      : festivals
  const activeCategoryLabel = CATEGORY_CONFIG[category].label

  const selectedPlanner = useMemo(
    () => planners.find((planner) => planner.id === selectedPlannerId) ?? null,
    [planners, selectedPlannerId]
  )

  const recommendedRegion = plannerRegion(selectedPlanner)
  const availableRegions = useMemo(() => (
    [...new Set(activeContents.map((item) => item.location).filter(isDisplayableRegion))]
      .sort((a, b) => a.localeCompare(b, 'ko'))
  ), [activeContents])

  const visibleContents = useMemo(() => {
    if (regionFilter === 'all') {
      if (selectedRegions.length === 0) return activeContents
      return activeContents.filter((item) => selectedRegions.some((region) => matchesRegion(item, region)))
    }
    const region = regionFilter === 'planner' ? recommendedRegion : regionFilter
    return activeContents.filter((item) => matchesRegion(item, region))
  }, [activeContents, regionFilter, recommendedRegion, selectedRegions])

  const activeRegionLabel = regionFilter === 'all'
    ? (selectedRegions.length > 0 ? `${selectedRegions.length}개 지역` : '전체 지역')
    : regionFilter === 'planner'
      ? (recommendedRegion || '플래너 지역')
      : regionFilter

  const selectableRegions = useMemo(() => (
    availableRegions.filter((region) => !selectedRegions.includes(region))
  ), [availableRegions, selectedRegions])

  const festivalDates = useMemo(() => (
    selectedFestival ? dateRange(selectedFestival.startDate, selectedFestival.endDate) : []
  ), [selectedFestival])

  const openAddModal = (festival) => {
    const dates = dateRange(festival.startDate, festival.endDate)
    setSelectedFestival(festival)
    setSelectedDate(dates[0] ? toDateKey(dates[0]) : toDateKey(new Date()))
    setMode('single')
    setNotice('')
  }

  const openDetailModal = async (content) => {
    setDetailContent(content)
    setDetailData({ common: null, intro: {}, loading: true, error: '' })
    const [commonResult, introResult] = await Promise.allSettled([
      api.get(`/api/tour/detail/common?contentId=${encodeURIComponent(content.id)}`),
      api.get(`/api/tour/detail/intro?contentId=${encodeURIComponent(content.id)}&contentTypeId=${content.contentTypeId}`),
    ])
    setDetailData({
      common: commonResult.status === 'fulfilled' ? unwrap(commonResult.value) : null,
      intro: introResult.status === 'fulfilled' ? unwrap(introResult.value) : {},
      loading: false,
      error: commonResult.status === 'rejected' && introResult.status === 'rejected'
        ? '상세 정보를 불러오지 못했습니다.'
        : '',
    })
  }

  const addRegionFilter = (region) => {
    if (!region) return
    setRegionFilter('all')
    setRegionMenuOpen(false)
    if (region === 'all') {
      setSelectedRegions([])
      return
    }
    setSelectedRegions((prev) => (prev.includes(region) ? prev : [...prev, region]))
  }

  const removeRegionFilter = (region) => {
    setSelectedRegions((prev) => prev.filter((item) => item !== region))
  }

  const addToPlanner = () => {
    if (!selectedPlanner || !selectedFestival) return
    const dates = mode === 'all' ? festivalDates : dateRange(selectedDate, selectedDate)
    if (dates.length === 0) return

    const createdAt = Date.now()
    const events = dates.map((date, index) => ({
      id: `event-${selectedFestival.title}-${toDateKey(date)}-${createdAt}-${index}`,
      title: selectedFestival.title,
      type: selectedFestival.contentTypeId === 12
        ? 'attraction'
        : selectedFestival.contentTypeId === 39
          ? 'restaurant'
          : 'event',
      day: scheduleDayFromDate(date),
      dateKey: toDateKey(date),
      start: startTime,
      end: endTime,
      color: '#8b5cf6',
      memo: `${selectedFestival.location ?? ''} ${selectedFestival.address ?? ''}`.trim(),
    }))

    const saved = saveStoredPlanner({
      ...selectedPlanner,
      schedule: mergeSchedule(selectedPlanner, events),
    })
    const next = getStoredPlanners()
    setPlanners(next)
    setSelectedPlannerId(saved.id)
    setNotice('플래너에 이벤트를 담았습니다.')
  }

  const detailCommon = detailData.common ?? {}
  const detailImage = detailCommon.firstImage || detailCommon.firstImage2 || detailContent?.imageUrl
  const detailAddress = [detailCommon.addr1, detailCommon.addr2].filter(Boolean).join(' ')
    || detailContent?.address
    || '상세 위치 미제공'
  const detailLatitude = detailCommon.mapy ?? detailContent?.latitude
  const detailLongitude = detailCommon.mapx ?? detailContent?.longitude
  const availableDetailFields = detailFields(detailData.intro)

  return (
    <main className="directory-page events-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">EVENTS</p>
            <h1 className="directory-title">이벤트</h1>
            <p className="directory-desc">
              일하는 지역 근처의 축제, 관광지와 식당을 살펴보고 플래너에 바로 담아보세요.
            </p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn" onClick={() => navigate('/my-planner')}>내 플래너로</button>
          </div>
        </header>

        <section className="event-hero-panel" aria-label="이벤트 추천 기준">
          <div className="event-hero-main">
            <span className="event-region-pill">{activeRegionLabel}</span>
            <h2>
              {regionFilter === 'planner'
                ? '일자리·숙소 근처 추천'
                : selectedRegions.length > 0
                  ? '선택 지역 이벤트 보기'
                  : '전체 지역 이벤트 보기'}
            </h2>
            <p>
              {regionFilter === 'planner'
                ? selectedPlanner
                  ? `${selectedPlanner.title}의 일자리와 숙소 위치를 기준으로 가까운 이벤트를 먼저 보여드려요.`
                  : '저장된 플래너가 없으면 전체 지역에서 탐색할 수 있습니다.'
                : selectedRegions.length > 0
                  ? `${selectedRegions.join(', ')} 지역의 이벤트를 모아 보여드려요.`
                  : '보고 싶은 지역을 담아 여러 지역의 이벤트를 한 번에 비교할 수 있습니다.'}
            </p>
          </div>
          <div className="event-hero-stats">
            <div>
              <span>표시 중</span>
              <strong>{loading ? '-' : `${visibleContents.length}건`}</strong>
            </div>
            <div>
              <span>수집 범위</span>
              <strong>{activeCategoryLabel} 전체</strong>
            </div>
          </div>
        </section>

        <section className="event-controls" aria-label="이벤트 필터">
          <div className="event-quick-filters">
            <button
              className={regionFilter === 'planner' ? 'active' : ''}
              onClick={() => {
                setRegionFilter('planner')
                setRegionMenuOpen(false)
              }}
              aria-pressed={regionFilter === 'planner'}
            >
              일자리·숙소 근처
            </button>
            <button
              className={regionFilter !== 'planner' ? 'active' : ''}
              onClick={() => {
                setRegionFilter('all')
                setRegionMenuOpen(false)
              }}
              aria-pressed={regionFilter !== 'planner'}
            >
              전체 보기
            </button>
          </div>
          {regionFilter !== 'planner' && (
            <div className="event-region-picker">
              <div className="event-region-picker__select">
                <span>지역 담기</span>
                <button
                  type="button"
                  className={`event-region-select${regionMenuOpen ? ' open' : ''}`}
                  onClick={() => setRegionMenuOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={regionMenuOpen}
                >
                  <span>{selectedRegions.length === 0 ? '전체 지역' : '지역 추가하기'}</span>
                  <span className="event-region-select__arrow" aria-hidden="true">⌄</span>
                </button>
                {regionMenuOpen && (
                  <div className="event-region-menu" role="listbox">
                    <button
                      type="button"
                      className={selectedRegions.length === 0 ? 'active' : ''}
                      onClick={() => addRegionFilter('all')}
                    >
                      전체 지역
                    </button>
                    {selectableRegions.map((region) => (
                      <button type="button" key={region} onClick={() => addRegionFilter(region)}>
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="event-region-tray" aria-label="선택한 지역">
                {selectedRegions.length === 0 ? (
                  <span className="event-region-empty">전체 지역</span>
                ) : (
                  selectedRegions.map((region) => (
                    <span className="event-region-chip" key={region}>
                      {region}
                      <button type="button" onClick={() => removeRegionFilter(region)} aria-label={`${region} 제거`}>x</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <div className="event-category-tabs" role="tablist" aria-label="이벤트 유형">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              className={category === item.id ? 'active' : ''}
              onClick={() => {
                setCategory(item.id)
                setPage(1)
                setLastPage(null)
              }}
              aria-pressed={category === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingScreen message={`${activeCategoryLabel} 정보를 불러오는 중입니다`} description="관광 API 데이터를 확인하고 있습니다." />
        ) : activeContents.length === 0 ? (
          <div className="directory-empty">표시할 {activeCategoryLabel} 데이터가 없습니다. 관광 API 응답을 확인해 주세요.</div>
        ) : visibleContents.length === 0 ? (
          <div className="directory-empty">
            {recommendedRegion ? `${recommendedRegion} 근처 ${activeCategoryLabel}가 없습니다. 전체 보기로 다른 지역을 확인해 보세요.` : `선택한 지역의 ${activeCategoryLabel}가 없습니다.`}
          </div>
        ) : (
          <section className="event-grid" aria-label={`${activeRegionLabel} ${activeCategoryLabel} 목록`}>
            {visibleContents.map((content) => (
              <article className="event-card" key={`${content.contentTypeId}-${content.id ?? `${content.title}-${content.location}`}`}>
                <EventVisual imageUrl={content.imageUrl} title={content.title} category={content.category} />
                <div className="event-card-body">
                  <span className="directory-badge">{content.category ?? activeCategoryLabel}</span>
                  <h2>{content.title}</h2>
                  <p>{content.location ?? '지역 정보 없음'}</p>
                  <div className="event-meta"><span>{content.address ?? '상세 위치 미제공'}</span></div>
                </div>
                <div className="event-card-actions">
                  <button className="directory-btn" onClick={() => openDetailModal(content)}>자세히 보기</button>
                  <button className="directory-btn primary" onClick={() => openAddModal(content)}>플래너에 담기</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && (activeContents.length > 0 || page > 1) && (
          <nav className="event-pagination" aria-label={`${activeCategoryLabel} 페이지 이동`}>
            <button
              className="directory-btn"
              disabled={pageGroupStart(page) === 1}
              onClick={() => setPage((current) => Math.max(1, pageGroupStart(current) - PAGE_GROUP_SIZE))}
            >
              이전
            </button>
            <div className="event-page-numbers">
              {page > PAGE_GROUP_SIZE && <span>…</span>}
              {paginationPages(page, lastPage).map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={pageNumber === page ? 'active' : ''}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              {hasNextPage && <span>…</span>}
            </div>
            <button
              className="directory-btn"
              disabled={!hasNextPage || (lastPage != null && pageGroupStart(page) + PAGE_GROUP_SIZE > lastPage)}
              onClick={() => setPage((current) => pageGroupStart(current) + PAGE_GROUP_SIZE)}
            >
              다음
            </button>
          </nav>
        )}

        {detailContent && (
          <div className="planner-modal-backdrop" onClick={() => setDetailContent(null)}>
            <section className="event-detail-modal" onClick={(event) => event.stopPropagation()} aria-label={`${detailContent.title} 상세정보`}>
              <div className="planner-day-modal-head">
                <div>
                  <p>{detailContent.category ?? '관광정보'} 상세</p>
                  <h2>{detailCommon.title || detailContent.title}</h2>
                </div>
                <button type="button" onClick={() => setDetailContent(null)} aria-label="닫기">x</button>
              </div>

              {detailData.loading ? (
                <LoadingScreen message="상세 정보를 불러오는 중입니다" description="이미지와 위치 정보를 확인하고 있습니다." />
              ) : (
                <>
                  <DetailImage imageUrl={detailImage} title={detailContent.title} />

                  {detailData.error && <div className="event-detail-error">{detailData.error}</div>}

                  <div className="event-detail-location">
                    <span>위치</span>
                    <strong>{detailAddress}</strong>
                    {(detailCommon.tel || detailContent.tel) && <small>문의 {detailCommon.tel || detailContent.tel}</small>}
                  </div>

                  {detailCommon.overview && (
                    <section className="event-detail-section">
                      <h3>소개</h3>
                      <p>{stripHtml(detailCommon.overview)}</p>
                    </section>
                  )}

                  {availableDetailFields.length > 0 && (
                    <dl className="event-detail-fields">
                      {availableDetailFields.map((field) => (
                        <div key={field.label}>
                          <dt>{field.label}</dt>
                          <dd>{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {detailLatitude != null && detailLongitude != null ? (
                    <ContentLocationMap
                      latitude={detailLatitude}
                      longitude={detailLongitude}
                      title={detailContent.title}
                    />
                  ) : (
                    <div className="event-map-unavailable">지도 위치정보가 제공되지 않았습니다.</div>
                  )}

                  <div className="directory-actions editor-actions">
                    <button className="directory-btn primary" onClick={() => {
                      setDetailContent(null)
                      openAddModal(detailContent)
                    }}>플래너에 담기</button>
                    <button className="directory-btn" onClick={() => setDetailContent(null)}>닫기</button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {selectedFestival && (
          <div className="planner-modal-backdrop" onClick={() => setSelectedFestival(null)}>
            <section className="event-add-modal" onClick={(event) => event.stopPropagation()} aria-label={`${selectedFestival.category ?? '이벤트'} 플래너 담기`}>
              <div className="planner-day-modal-head">
                <div>
                  <p>{selectedFestival.category ?? '이벤트'} 담기</p>
                  <h2>{selectedFestival.title}</h2>
                </div>
                <button type="button" onClick={() => setSelectedFestival(null)} aria-label="닫기">x</button>
              </div>

              <label>
                플래너
                <select value={selectedPlannerId} onChange={(event) => setSelectedPlannerId(event.target.value)}>
                  {planners.map((planner) => <option key={planner.id} value={planner.id}>{planner.title}</option>)}
                </select>
              </label>

              {festivalDates.length > 0 && (
                <div className="event-mode-row">
                  <button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>하루만 담기</button>
                  <button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}>전체 기간 담기</button>
                </div>
              )}

              {mode === 'single' && festivalDates.length > 0 && (
                <label>
                  날짜
                  <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                    {festivalDates.map((date) => {
                      const key = toDateKey(date)
                      return <option key={key} value={key}>{key}</option>
                    })}
                  </select>
                </label>
              )}

              {festivalDates.length === 0 && (
                <label>
                  플래너에 담을 날짜
                  <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                </label>
              )}

              <div className="editor-time-row">
                <label>
                  시작
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </label>
                <label>
                  종료
                  <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </label>
              </div>

              {notice && <div className="event-notice">{notice}</div>}

              <div className="directory-actions editor-actions">
                <button className="directory-btn primary" disabled={!selectedPlanner} onClick={addToPlanner}>담기</button>
                <button className="directory-btn" onClick={() => setSelectedFestival(null)}>닫기</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
