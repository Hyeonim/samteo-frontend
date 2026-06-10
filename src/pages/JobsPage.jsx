import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import './ExplorePages.css'

const RECOMMEND_TABS = [
  { id: 'all', label: '전체 추천' },
  { id: 'popular', label: '인기' },
  { id: 'closing', label: '마감 임박' },
  { id: 'commute', label: '출퇴근 편한' },
  { id: 'salary', label: '수입 좋은' },
]

function getRegionLabel(regionId, fallback) {
  const labels = {
    junggu: '대구 중구',
    donggu: '대구 동구',
    suseong: '대구 수성구',
    dalseo: '대구 달서구',
    bukgu: '대구 북구',
  }
  return labels[regionId] ?? fallback ?? regionId
}

function inferCityId(regionId) {
  if (['junggu', 'donggu', 'suseong', 'dalseo', 'bukgu'].includes(regionId)) return 'daegu'
  return regionId
}

function getCityLabel(cityId) {
  const labels = {
    daegu: '대구',
    seoul: '서울',
    busan: '부산',
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
  return labels[cityId] ?? cityId
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

function normalizeJob(job, index) {
  const salary = Number(job.monthlySalary ?? job.salary ?? 0)
  const commute = Number(job.commuteMinutes ?? 20 + index * 4)
  const tags = (job.tags ?? []).map(translateTag)
  const popularity = Number(job.popularity ?? job.viewCount ?? 92 - index * 7)
  const daysLeft = Number(job.daysLeft ?? (tags.includes('마감 임박') ? 1 : 3 + index))
  const regionId = job.regionId ?? 'junggu'
  const normalized = {
    ...job,
    name: job.name ?? job.title,
    title: job.title ?? job.name,
    regionId,
    cityId: job.cityId ?? inferCityId(regionId),
    region: getRegionLabel(regionId, job.region ?? job.district),
    type: translateCategory(job.type ?? job.category),
    salary,
    monthlySalary: salary,
    commute,
    commuteMinutes: commute,
    tags,
    popularity,
    daysLeft,
    priceLabel: salary ? `${salary.toLocaleString()}원` : '-',
    unit: job.unit === '/month' ? '/월' : (job.unit ?? '/월'),
    sub: job.sub === 'dummy job data' ? '샘플 일자리 데이터' : (job.sub ?? job.workingDays ?? ''),
    emoji: !job.emoji || job.emoji === 'JOB' ? jobEmoji(translateCategory(job.type ?? job.category)) : job.emoji,
  }
  return {
    ...normalized,
    recommendReason: buildReason(normalized),
  }
}

function buildReason(job) {
  if (job.tags.includes('숙소 연계')) return '숙소까지 함께 잡기 좋아 체류 플래너에 잘 맞아요.'
  if (job.daysLeft <= 2) return '마감이 가까워 지금 확인하면 좋은 공고예요.'
  if (job.commute <= 20) return '출퇴근 시간이 짧아 생활 리듬을 만들기 쉬워요.'
  if (job.salary >= 2400000) return '월 예상 수입이 높아 예산 여유를 만들기 좋아요.'
  return '근무 조건과 지역 접근성이 균형 잡힌 추천 공고예요.'
}

function sectionJobs(jobs, section) {
  if (section === 'popular') return [...jobs].sort((a, b) => b.popularity - a.popularity).slice(0, 3)
  if (section === 'closing') return [...jobs].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3)
  if (section === 'commute') return [...jobs].sort((a, b) => a.commute - b.commute).slice(0, 3)
  if (section === 'salary') return [...jobs].sort((a, b) => b.salary - a.salary).slice(0, 3)
  return jobs
}

export default function JobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('전체')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/planner/jobs')
      .then((res) => setJobs(unwrap(res).map(normalizeJob)))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const types = useMemo(() => ['전체', ...new Set(jobs.map((job) => job.type).filter(Boolean))], [jobs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const searched = jobs.filter((job) => {
      const body = `${job.name} ${job.company ?? ''} ${job.region} ${job.type} ${job.tags.join(' ')}`
      const matchType = type === '전체' || job.type === type
      return matchType && (!q || body.toLowerCase().includes(q))
    })
    return sectionJobs(searched, activeTab)
  }, [jobs, query, type, activeTab])

  const popularJobs = useMemo(() => sectionJobs(jobs, 'popular'), [jobs])
  const closingJobs = useMemo(() => sectionJobs(jobs, 'closing'), [jobs])

  function startAccommodationMatching(job) {
    navigate('/planner', {
      state: {
        startStep: 3,
        selectedCity: job.cityId,
        selectedCityName: getCityLabel(job.cityId),
        selectedRegion: job.regionId,
        selectedRegionName: getRegionLabel(job.regionId, job.region),
        selectedJob: job,
      },
    })
  }

  return (
    <main className="directory-page jobs-page">
      <div className="directory-shell">
        <header className="directory-head jobs-head">
          <div>
            <p className="directory-kicker">WORK RECOMMEND</p>
            <h1 className="directory-title">추천 일자리</h1>
            <p className="directory-desc">
              인기 공고, 마감 임박 공고, 출퇴근이 편한 일자리를 한 화면에서 비교해 보세요.
            </p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn primary" onClick={() => navigate('/planner')}>직접 플래너 만들기</button>
          </div>
        </header>

        {!loading && jobs.length > 0 && (
          <section className="job-highlight-grid">
            <div className="job-highlight">
              <span className="job-highlight__label">인기 급상승</span>
              <strong>{popularJobs[0]?.name}</strong>
              <p>{popularJobs[0]?.recommendReason}</p>
            </div>
            <div className="job-highlight urgent">
              <span className="job-highlight__label">마감 임박</span>
              <strong>{closingJobs[0]?.name}</strong>
              <p>{closingJobs[0]?.daysLeft}일 안에 확인하면 좋은 공고입니다.</p>
            </div>
          </section>
        )}

        <div className="job-recommend-tabs">
          {RECOMMEND_TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="directory-toolbar">
          <input
            className="directory-search"
            placeholder="직무, 회사, 지역, 태그 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="directory-select" value={type} onChange={(event) => setType(event.target.value)}>
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="directory-empty">추천 일자리를 불러오는 중입니다.</div>
        ) : filtered.length === 0 ? (
          <div className="directory-empty">조건에 맞는 추천 일자리가 없습니다.</div>
        ) : (
          <section className="job-recommend-list">
            {filtered.map((job) => (
              <article className="job-recommend-card" key={job.id}>
                <div className="job-rank">
                  <span>{job.popularity}</span>
                  <small>추천</small>
                </div>
                <div className="job-recommend-main">
                  <div className="directory-card-top">
                    <div>
                      <h2 className="directory-card-title">{job.name}</h2>
                      <p className="directory-card-sub">{job.company} · {job.region}</p>
                    </div>
                    <span className={`directory-badge${job.daysLeft <= 2 ? ' danger' : ''}`}>
                      {job.daysLeft <= 2 ? `D-${job.daysLeft}` : job.type}
                    </span>
                  </div>
                  <p className="job-reason">{job.recommendReason}</p>
                  <div className="directory-metrics compact">
                    <div className="directory-metric"><span>예상 급여</span><strong>{job.salary.toLocaleString()}원</strong></div>
                    <div className="directory-metric"><span>출퇴근</span><strong>{job.commute}분</strong></div>
                    <div className="directory-metric"><span>근무</span><strong>{job.workingDays ?? '-'}</strong></div>
                    <div className="directory-metric"><span>고용</span><strong>{job.employmentType ?? '단기'}</strong></div>
                  </div>
                  <div className="directory-tags">
                    {job.tags.map((tag) => <span className="directory-tag" key={tag}>{tag}</span>)}
                  </div>
                </div>
                <button className="job-card-action" onClick={() => startAccommodationMatching(job)}>숙소 매칭 시작</button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
