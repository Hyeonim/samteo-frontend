import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingScreen from '../components/common/LoadingScreen'
import { getStoredPlanners, saveStoredPlanner } from '../utils/plannerStorage'
import { createWorkScheduleId } from '../utils/plannerSchedule'
import './ExplorePages.css'

const CATEGORIES = [
  { id: 'festivals', label: '축제' },
  { id: 'attractions', label: '관광지' },
]

function unwrap(res) {
  return res.data ?? res.result ?? res
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
  const [loading, setLoading] = useState(true)
  const [planners, setPlanners] = useState(() => initialPlanners)
  const [selectedPlannerId, setSelectedPlannerId] = useState(location.state?.plannerId ?? initialPlanners[0]?.id ?? '')
  const [regionFilter, setRegionFilter] = useState('all')
  const [selectedRegions, setSelectedRegions] = useState([])
  const [regionMenuOpen, setRegionMenuOpen] = useState(false)
  const [selectedFestival, setSelectedFestival] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [mode, setMode] = useState('single')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('20:00')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api.get('/api/festivals')
      .then((result) => {
        const items = unwrap(result)
        const unique = new Map()
        items.map(sanitizeFestival).forEach((item) => {
          const key = item.id ?? `${item.title}-${item.location}-${item.address}`
          unique.set(key, item)
        })
        setFestivals([...unique.values()])
      })
      .catch(() => setFestivals([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedPlanner = useMemo(
    () => planners.find((planner) => planner.id === selectedPlannerId) ?? null,
    [planners, selectedPlannerId]
  )

  const recommendedRegion = plannerRegion(selectedPlanner)
  const availableRegions = useMemo(() => (
    [...new Set(festivals.map((festival) => festival.location).filter(isDisplayableRegion))]
      .sort((a, b) => a.localeCompare(b, 'ko'))
  ), [festivals])

  const visibleFestivals = useMemo(() => {
    if (regionFilter === 'all') {
      if (selectedRegions.length === 0) return festivals
      return festivals.filter((festival) => selectedRegions.some((region) => matchesRegion(festival, region)))
    }
    const region = regionFilter === 'planner' ? recommendedRegion : regionFilter
    return festivals.filter((festival) => matchesRegion(festival, region))
  }, [festivals, regionFilter, recommendedRegion, selectedRegions])

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
      type: 'event',
      day: scheduleDayFromDate(date),
      dateKey: toDateKey(date),
      start: startTime,
      end: endTime,
      color: '#8b5cf6',
      memo: `${selectedFestival.location ?? ''} ${selectedFestival.startDate ?? ''}~${selectedFestival.endDate ?? ''}`.trim(),
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

  return (
    <main className="directory-page events-page">
      <div className="directory-shell">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">EVENTS</p>
            <h1 className="directory-title">이벤트</h1>
            <p className="directory-desc">
              일하는 지역 근처에서 갈 만한 축제와 관광지를 플래너에 바로 담아보세요.
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
              <strong>{loading ? '-' : `${visibleFestivals.length}건`}</strong>
            </div>
            <div>
              <span>수집 범위</span>
              <strong>전체 행사</strong>
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
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        {category === 'attractions' ? (
          <div className="directory-empty">관광지 데이터 API가 연결되면 지역별 운영시간과 휴무일을 확인하고 플래너에 담을 수 있습니다.</div>
        ) : loading ? (
          <LoadingScreen message="축제 정보를 불러오는 중입니다" description="적재된 이벤트 데이터를 확인하고 있습니다." />
        ) : festivals.length === 0 ? (
          <div className="directory-empty">표시할 축제 데이터가 없습니다. 적재 데이터 또는 백엔드 응답을 확인해 주세요.</div>
        ) : visibleFestivals.length === 0 ? (
          <div className="directory-empty">
            {recommendedRegion ? `${recommendedRegion} 근처 축제가 없습니다. 전체 보기로 다른 지역 이벤트를 확인해 보세요.` : '선택한 지역의 축제가 없습니다.'}
          </div>
        ) : (
          <section className="event-grid" aria-label={`${activeRegionLabel} 축제 목록`}>
            {visibleFestivals.map((festival) => (
              <article className="event-card" key={festival.id ?? `${festival.title}-${festival.location}`}>
                <div className="event-date-card">
                  <span>행사</span>
                  <strong>일정 미제공</strong>
                </div>
                <div className="event-card-body">
                  <span className="directory-badge">축제</span>
                  <h2>{festival.title}</h2>
                  <p>{festival.location ?? '지역 정보 없음'}</p>
                  <div className="event-meta"><span>{festival.address ?? '상세 위치 미제공'}</span></div>
                </div>
                <button className="directory-btn primary" onClick={() => openAddModal(festival)}>플래너에 담기</button>
              </article>
            ))}
          </section>
        )}

        {selectedFestival && (
          <div className="planner-modal-backdrop" onClick={() => setSelectedFestival(null)}>
            <section className="event-add-modal" onClick={(event) => event.stopPropagation()} aria-label="축제 플래너 담기">
              <div className="planner-day-modal-head">
                <div>
                  <p>축제 담기</p>
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
