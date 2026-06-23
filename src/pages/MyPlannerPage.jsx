import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { myPlannerApi } from '../api/myPlannerApi'
import { createJobSchedule } from '../utils/plannerSchedule'
import './ExplorePages.css'

const CALENDAR_DAYS = [
  { label: '일', value: 6, weekend: 'sun' },
  { label: '월', value: 0 },
  { label: '화', value: 1 },
  { label: '수', value: 2 },
  { label: '목', value: 3 },
  { label: '금', value: 4 },
  { label: '토', value: 5, weekend: 'sat' },
]
const HOURS = Array.from({ length: 18 }, (_, index) => index + 6)
const COLORS = ['#ef7f72', '#6b9ee8', '#9ac768', '#6ec7bd', '#f3bf58', '#9b7ae5', '#f59e73']
const VIEW_LABELS = { day: '일간', week: '주간', month: '월간' }
const DEFAULT_EVENT_TYPES = [
  { value: 'personal', label: '개인 일정', color: '#f59e73' },
  { value: 'study', label: '준비/학습', color: '#9ac768' },
  { value: 'rest', label: '휴식', color: '#6ec7bd' },
  { value: 'work', label: '근무', color: '#ef7f72' },
  { value: 'event', label: '행사/이벤트', color: '#8b5cf6' },
]
const CUSTOM_OPTION = { value: 'custom', label: '직접 입력', color: '#6b9ee8' }
const EVENT_TYPES = [...DEFAULT_EVENT_TYPES, CUSTOM_OPTION]
const COLOR_SWATCHES = ['#ef7f72', '#f59e73', '#f3bf58', '#9ac768', '#6ec7bd', '#6b9ee8', '#8b5cf6', '#475569']

function getEventTypeMeta(type) {
  return EVENT_TYPES.find((item) => item.value === type) ?? EVENT_TYPES[0]
}

function createCustomTypeValue(label) {
  return `custom-${label.trim().toLowerCase().replace(/\s+/g, '-')}`
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function toMinutes(value, fallback) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/)
  if (!match) return fallback
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesToTime(value) {
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateKey(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return `${month}월 ${day}일`
}

function dayFromDateKey(value, fallback = 0) {
  const [year, month, day] = String(value ?? '').split('-').map(Number)
  if (!year || !month || !day) return fallback
  const nativeDay = new Date(year, month - 1, day).getDay()
  return nativeDay === 0 ? 6 : nativeDay - 1
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}


function normalizeWorkColors(schedule) {
  const workColorByTitle = new Map()
  let nextColorIndex = 0

  return schedule.map((event) => {
    if (event.type !== 'work' && !event.locked) return event
    const key = event.title ?? event.id

    if (!workColorByTitle.has(key)) {
      workColorByTitle.set(key, COLORS[nextColorIndex % COLORS.length])
      nextColorIndex += 1
    }

    return { ...event, color: workColorByTitle.get(key) }
  })
}

function getSchedule(planner) {
  const generated = createJobSchedule(planner ?? {})
  const saved = Array.isArray(planner?.schedule) ? planner.schedule : []
  const savedIds = new Set(saved.map((event) => event.id))
  const generatedOnly = generated.filter((event) => !savedIds.has(event.id))

  return normalizeWorkColors([...generatedOnly, ...saved])
}

function getMonthDays() {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const offset = first.getDay()
  const cells = []

  for (let index = 0; index < offset; index += 1) {
    cells.push(null)
  }
  for (let date = 1; date <= last.getDate(); date += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), date)
    const nativeDay = day.getDay()
    const scheduleDay = nativeDay === 0 ? 6 : nativeDay - 1
    cells.push({
      date,
      dateKey: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(date)}`,
      day: scheduleDay,
      weekend: nativeDay === 0 ? 'sun' : nativeDay === 6 ? 'sat' : null,
      holiday: null,
    })
  }
  return { label: `${today.getFullYear()}년 ${today.getMonth() + 1}월`, cells }
}

function ScheduleBlock({ event, compact = false, onClick }) {
  const start = toMinutes(event.start, 540)
  const end = toMinutes(event.end, start + 60)
  const top = ((start - 360) / 60) * 56
  const height = Math.max(38, ((end - start) / 60) * 56 - 4)

  return (
    <button
      type="button"
      className={`schedule-block ${event.type}${compact ? ' compact' : ''}`}
      style={{ top, height, background: event.color ?? '#6b9ee8' }}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        onClick(event)
      }}
    >
      <strong>{event.title}</strong>
      {!compact && <span>{event.start} - {event.end}</span>}
    </button>
  )
}

export default function MyPlannerPage() {
  const navigate = useNavigate()
  const [planners, setPlanners] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [plannerFilter, setPlannerFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('week')
  const [selectedDay, setSelectedDay] = useState(0)
  const activePlanner = useMemo(
    () => planners.find((planner) => planner.id === activeId) ?? null,
    [planners, activeId]
  )
  const filteredPlanners = useMemo(() => {
    if (plannerFilter === 'all') return planners
    return planners.filter((p) => (p.plannerType ?? 'long') === plannerFilter)
  }, [planners, plannerFilter])
  const [title, setTitle] = useState(() => activePlanner?.title ?? '')
  const [memo, setMemo] = useState(() => activePlanner?.memo ?? '')
  const [editingId, setEditingId] = useState(null)
  const [monthDetail, setMonthDetail] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [eventTypes, setEventTypes] = useState([...DEFAULT_EVENT_TYPES])
  const [form, setForm] = useState({
    title: '',
    day: 0,
    start: '18:00',
    end: '19:00',
    type: 'personal',
    typeLabel: getEventTypeMeta('personal').label,
    color: getEventTypeMeta('personal').color,
    memo: '',
    dateKey: null,
    repeatMode: 'weekly',
  })

  useEffect(() => {
    myPlannerApi.getAll()
      .then((res) => {
        const data = res?.data ?? []
        setPlanners(data)
        if (data.length > 0) {
          const first = data[0]
          setActiveId(first.id)
          setTitle(first.title ?? '')
          setMemo(first.memo ?? '')
          setEventTypes(first.eventTypes ?? [...DEFAULT_EVENT_TYPES])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const schedule = useMemo(() => getSchedule(activePlanner), [activePlanner])
  const recurringSchedule = useMemo(() => schedule.filter((event) => !event.dateKey), [schedule])
  const dayEvents = recurringSchedule.filter((event) => event.day === selectedDay)
  const month = useMemo(() => getMonthDays(), [])
  const eventTypeOptions = useMemo(() => (
    [...eventTypes, CUSTOM_OPTION]
  ), [eventTypes])
  const selectedEditableType = useMemo(
    () => eventTypes.find((type) => type.value === form.type) ?? null,
    [eventTypes, form.type]
  )

  const getDefaultDateKey = (day = selectedDay) => (
    month.cells.find((cell) => cell?.day === Number(day))?.dateKey ?? toDateKey(new Date())
  )

  const setDateScope = () => {
    setForm((prev) => ({
      ...prev,
      repeatMode: 'date',
      dateKey: prev.dateKey ?? getDefaultDateKey(prev.day),
    }))
  }

  const setWeeklyScope = () => {
    setForm((prev) => ({ ...prev, repeatMode: 'weekly' }))
  }

  const updateFormDay = (day) => {
    setForm((prev) => ({
      ...prev,
      day,
      dateKey: prev.repeatMode === 'date' ? getDefaultDateKey(day) : prev.dateKey,
    }))
  }

  const updateFormDate = (dateKey) => {
    setForm((prev) => ({
      ...prev,
      dateKey,
      repeatMode: 'date',
      day: dayFromDateKey(dateKey, prev.day),
    }))
  }

  const saveCustomEventType = () => {
    const label = form.typeLabel.trim()
    if (!activePlanner || !label) return

    const editingType = selectedEditableType
    let nextType
    let nextTypes
    let nextSchedule = schedule

    if (editingType) {
      nextType = { ...editingType, label, color: form.color || editingType.color }
      nextTypes = eventTypes.map((item) => (item.value === editingType.value ? nextType : item))
      nextSchedule = schedule.map((event) => (
        event.type === editingType.value
          ? { ...event, typeLabel: label, color: form.color || editingType.color }
          : event
      ))
    } else {
      const existing = eventTypes.find((item) => item.label === label)
      nextType = existing ?? { value: createCustomTypeValue(label), label, color: form.color || CUSTOM_OPTION.color }
      nextTypes = existing ? eventTypes : [...eventTypes, nextType]
    }

    setEventTypes(nextTypes)
    myPlannerApi.update(activePlanner.id, { ...activePlanner, schedule: nextSchedule, eventTypes: nextTypes })
      .then((res) => refresh(res?.data))
      .catch(() => {})
    setForm((prev) => ({
      ...prev,
      type: nextType.value,
      typeLabel: nextType.label,
      color: form.color || nextType.color,
    }))
  }

  const deleteCustomEventType = (typeValue = form.type) => {
    if (!activePlanner) return
    const target = eventTypes.find((item) => item.value === typeValue)
    if (!target) return
    const nextTypes = eventTypes.filter((item) => item.value !== target.value)
    const fallback = nextTypes[0] ?? CUSTOM_OPTION
    const nextSchedule = schedule.map((event) => (
      event.type === target.value
        ? { ...event, type: fallback.value, typeLabel: fallback.label, color: fallback.color }
        : event
    ))

    setEventTypes(nextTypes)
    myPlannerApi.update(activePlanner.id, { ...activePlanner, schedule: nextSchedule, eventTypes: nextTypes })
      .then((res) => refresh(res?.data))
      .catch(() => {})
    setForm((prev) => (
      prev.type === target.value
        ? { ...prev, type: fallback.value, typeLabel: fallback.label, color: fallback.color }
        : prev
    ))
  }

  const refresh = (saved) => {
    if (!saved) return
    setPlanners((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
  }

  const persistPlanner = (patch) => {
    if (!activePlanner) return
    myPlannerApi.update(activePlanner.id, { ...activePlanner, schedule, eventTypes, ...patch })
      .then((res) => refresh(res?.data))
      .catch(() => {})
  }

  const selectPlanner = (planner) => {
    setActiveId(planner.id)
    setTitle(planner.title ?? '')
    setMemo(planner.memo ?? '')
    setEventTypes(planner.eventTypes ?? [...DEFAULT_EVENT_TYPES, ...(planner.customEventTypes ?? [])])
    setEditingId(null)
  }

  const saveSummary = () => {
    persistPlanner({ title, memo })
  }

  const updateJobWage = (jobId, field, value) => {
    const num = Math.max(0, Number(value) || 0)
    const hourlyWage = field === 'hourly' ? num : Math.round(num / 209)
    const salary = field === 'salary' ? num : hourlyWage * 209
    const jobs = (activePlanner.jobs ?? []).map((job) => job.id === jobId
      ? { ...job, hourlyWage, salary }
      : job)
    const totalSalary = jobs.reduce((sum, job) => sum + Number(job.salary ?? 0), 0)
    const accommodationCost = Number(activePlanner.accommodationCost ?? activePlanner.accommodation?.price ?? 0)
    persistPlanner({
      jobs,
      totalSalary,
      disposableIncome: Math.max(0, totalSalary - accommodationCost - Number(activePlanner.fixedExpense ?? 0)),
    })
  }

  const updateAccommodationCost = (value) => {
    const accommodationCost = Math.max(0, Number(value) || 0)
    const totalSalary = Number(activePlanner.totalSalary ?? 0)
    persistPlanner({
      accommodation: { ...activePlanner.accommodation, price: accommodationCost },
      accommodationCost,
      disposableIncome: Math.max(0, totalSalary - accommodationCost - Number(activePlanner.fixedExpense ?? 0)),
    })
  }

  const removePlanner = async () => {
    if (!activePlanner) return
    try { await myPlannerApi.remove(activePlanner.id) } catch { return }
    const next = planners.filter((p) => p.id !== activePlanner.id)
    const nextActive = next[0] ?? null
    setPlanners(next)
    setActiveId(nextActive?.id ?? null)
    setTitle(nextActive?.title ?? '')
    setMemo(nextActive?.memo ?? '')
    setEventTypes(nextActive?.eventTypes ?? [...DEFAULT_EVENT_TYPES])
    setDeleteTarget(null)
  }

  const startCreate = (day = selectedDay, startTime = '18:00', dateKey = null) => {
    const start = toMinutes(startTime, 18 * 60)
    setEditingId(null)
    setForm({
      title: '',
      day,
      start: minutesToTime(start),
      end: minutesToTime(start + 60),
      type: 'personal',
      typeLabel: getEventTypeMeta('personal').label,
      color: getEventTypeMeta('personal').color,
      memo: '',
      dateKey,
      repeatMode: dateKey ? 'date' : 'weekly',
    })
  }

  const startEdit = (event) => {
    const typeMeta = getEventTypeMeta(event.type)
    if (event.locked) {
      setForm({
        ...event,
        typeLabel: event.typeLabel ?? typeMeta.label,
        color: event.color ?? typeMeta.color,
        memo: event.memo ?? '',
        repeatMode: event.dateKey ? 'date' : 'weekly',
      })
      setEditingId(event.id)
      return
    }
    setEditingId(event.id)
    setForm({
      title: event.title,
      day: event.day,
      start: event.start,
      end: event.end,
      type: event.type,
      typeLabel: event.typeLabel ?? typeMeta.label,
      color: event.color ?? typeMeta.color,
      memo: event.memo ?? '',
      dateKey: event.dateKey ?? null,
      repeatMode: event.dateKey ? 'date' : 'weekly',
    })
  }

  const saveEvent = () => {
    if (!activePlanner || !form.title.trim()) return
    const start = toMinutes(form.start, 0)
    const end = toMinutes(form.end, start + 60)
    const matchingWorkColor = schedule.find((event) => (
      event.type === 'work' && event.title === form.title.trim()
    ))?.color
    const typeMeta = getEventTypeMeta(form.type)
    const normalized = {
      ...form,
      title: form.title.trim(),
      typeLabel: form.typeLabel.trim() || typeMeta.label,
      day: Number(form.day),
      end: minutesToTime(Math.max(end, start + 30)),
      dateKey: form.repeatMode === 'date' ? form.dateKey : null,
      color: form.type === 'work' && !form.color ? (matchingWorkColor ?? COLORS[0]) : (form.color || typeMeta.color),
      locked: false,
    }
    const nextSchedule = editingId
      ? schedule.map((event) => (event.id === editingId ? { ...event, ...normalized } : event))
      : [...schedule, { ...normalized, id: `event-${Date.now()}` }]
    persistPlanner({ schedule: nextSchedule })
    setEditingId(null)
    startCreate(Number(form.day))
  }

  const deleteEvent = () => {
    if (!editingId || !activePlanner) return
    const target = schedule.find((event) => event.id === editingId)
    if (target?.locked) return
    persistPlanner({ schedule: schedule.filter((event) => event.id !== editingId) })
    setEditingId(null)
    startCreate()
  }

  const goToEvents = () => {
    if (!activePlanner) return
    navigate('/events', { state: { plannerId: activePlanner.id } })
  }

  const startCreateAtSlot = (event, day) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const hourOffset = clamp(Math.floor((event.clientY - rect.top) / 56), 0, HOURS.length - 1)
    const start = (HOURS[0] + hourOffset) * 60
    setSelectedDay(day)
    setEditingId(null)
    setForm({
      title: '',
      day,
      start: minutesToTime(start),
      end: minutesToTime(start + 60),
      type: 'personal',
      typeLabel: getEventTypeMeta('personal').label,
      color: getEventTypeMeta('personal').color,
      memo: '',
      dateKey: null,
      repeatMode: 'weekly',
    })
  }

  const startCreateFromMonth = (cell) => {
    if (!cell) return
    const events = schedule.filter((event) => (event.dateKey ? event.dateKey === cell.dateKey : event.day === cell.day))
    const latestEnd = events.reduce((latest, event) => Math.max(latest, toMinutes(event.end, latest)), 8 * 60)
    const start = clamp(Math.ceil(latestEnd / 60) * 60, HOURS[0] * 60, (HOURS[HOURS.length - 1]) * 60)

    setSelectedDay(cell.day)
    setViewMode('day')
    startCreate(cell.day, minutesToTime(start), cell.dateKey)
    setMonthDetail(null)
  }

  const openMonthDetail = (cell) => {
    if (!cell) return
    setSelectedDay(cell.day)
    setMonthDetail({
      ...cell,
      events: schedule.filter((event) => (event.dateKey ? event.dateKey === cell.dateKey : event.day === cell.day)),
    })
  }

  if (loading) {
    return (
      <main className="directory-page">
        <div className="directory-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <p style={{ color: '#94a3b8' }}>플래너를 불러오는 중...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="directory-page">
      <div className="directory-shell planner-shell-wide">
        <header className="directory-head">
          <div>
            <p className="directory-kicker">MY PLANNER</p>
            <h1 className="directory-title">내 플래너</h1>
            <p className="directory-desc">여러 지역과 일자리 계획을 저장하고, 자동 생성된 근무 시간표 위에 개인 일정을 직접 관리합니다.</p>
          </div>
          <div className="directory-actions">
            <button className="directory-btn primary" onClick={() => navigate('/planner')}>새 플래너 만들기</button>
          </div>
        </header>

        {planners.length === 0 ? (
          <div className="directory-empty">
            저장된 플래너가 없습니다. 플래너 만들기를 완료하면 이곳에서 시간표를 관리할 수 있습니다.
          </div>
        ) : (
          <section className="planner-workbench">
            <aside className="planner-list-panel">
              <div className="planner-panel-title">플래너 목록</div>
              <div className="planner-type-filter">
                {[['all', '전체'], ['short', '단기'], ['long', '장기']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`ptf-btn${plannerFilter === val ? ' active' : ''} ptf-${val}`}
                    onClick={() => setPlannerFilter(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredPlanners.length === 0 && (
                <p className="planner-filter-empty">해당 유형의 플래너가 없습니다.</p>
              )}
              {filteredPlanners.map((planner) => {
                const isShort = (planner.plannerType ?? 'long') === 'short'
                return (
                  <button
                    className={`planner-item${planner.id === activeId ? ' active' : ''}`}
                    key={planner.id}
                    onClick={() => selectPlanner(planner)}
                  >
                    <div className="planner-item-header">
                      <span className={`planner-type-badge ${isShort ? 'ptb-short' : 'ptb-long'}`}>
                        {isShort ? '단기' : '장기'}
                      </span>
                      <h2 className="directory-card-title">{planner.title}</h2>
                    </div>
                    <p className="directory-card-sub">{planner.regionName} · {planner.jobs?.length ?? 0}개 일자리</p>
                    <p className="directory-card-sub">수정 {formatDate(planner.updatedAt ?? planner.createdAt)}</p>
                  </button>
                )
              })}
            </aside>

            <article className="planner-detail-panel timetable-panel">
              {activePlanner && (
                <>
                  <div className="planner-topbar">
                    <div className="planner-form inline">
                      <label>
                        플래너 제목
                        <input value={title} onChange={(event) => setTitle(event.target.value)} />
                      </label>
                      <label>
                        메모
                        <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="기억할 내용을 적어두세요" />
                      </label>
                    </div>
                    <div className="planner-top-actions">
                      <button className="directory-btn primary" onClick={saveSummary}>저장</button>
                      <button className="directory-btn" onClick={() => setDeleteTarget(activePlanner)}>삭제</button>
                    </div>
                  </div>

                  <div className="directory-metrics compact planner-summary-strip">
                    <div className="directory-metric"><span>지역</span><strong>{activePlanner.regionName}</strong></div>
                    <div className="directory-metric"><span>숙소</span><strong>{activePlanner.accommodation?.name ?? '-'}</strong></div>
                    <div className="directory-metric"><span>예상 급여</span><strong>{(activePlanner.totalSalary ?? 0).toLocaleString()}원</strong></div>
                    <div className="directory-metric"><span>월 잔액</span><strong>{(activePlanner.disposableIncome ?? 0).toLocaleString()}원</strong></div>
                  </div>

                  <section className="planner-finance-editor">
                    <div>
                      <h3>일자리 급여 수정</h3>
                      {(activePlanner.jobs ?? []).map((job) => (
                        <div key={job.id} className="pfe-job-row">
                          <span className="pfe-job-name">{job.name}</span>
                          <div className="pfe-wage-inputs">
                            <label>
                              <small>시급</small>
                              <input
                                type="number" min="0" step="10"
                                key={`hourly-${job.id}-${job.hourlyWage}`}
                                defaultValue={job.hourlyWage ?? 10320}
                                onBlur={(event) => updateJobWage(job.id, 'hourly', event.target.value)}
                              />
                              <small>원/시간</small>
                            </label>
                            <span className="pfe-wage-sep">·</span>
                            <label>
                              <small>월급</small>
                              <input
                                type="number" min="0" step="10000"
                                key={`salary-${job.id}-${job.salary}`}
                                defaultValue={job.salary ?? (job.hourlyWage ?? 10320) * 209}
                                onBlur={(event) => updateJobWage(job.id, 'salary', event.target.value)}
                              />
                              <small>원/월</small>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3>월 숙박비 수정</h3>
                      <label>
                        <span>{activePlanner.accommodation?.name ?? '선택 숙소'}</span>
                        <input type="number" min="0" step="10000" defaultValue={activePlanner.accommodationCost || ''} placeholder="월 숙박비" onBlur={(event) => updateAccommodationCost(event.target.value)} />
                        <small>원/월</small>
                      </label>
                    </div>
                  </section>

                  <div className="planner-scheduler">
                    <section className="scheduler-main">
                      <div className="scheduler-toolbar">
                        <div>
                          <h2>시간표</h2>
                          <p>{VIEW_LABELS[viewMode]} 보기 · 근무 일정은 자동으로 채워지고 빈 시간은 직접 추가할 수 있습니다.</p>
                        </div>
                        <div className="scheduler-tabs">
                          {Object.entries(VIEW_LABELS).map(([value, label]) => (
                            <button
                              key={value}
                              className={viewMode === value ? 'active' : ''}
                              onClick={() => setViewMode(value)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {viewMode === 'day' && (
                        <div className="day-view">
                          <div className="day-picker">
                            {CALENDAR_DAYS.map((day) => (
                              <button
                                key={day.label}
                                className={`${selectedDay === day.value ? 'active' : ''}${day.weekend ? ` ${day.weekend}` : ''}`}
                                onClick={() => setSelectedDay(day.value)}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                          <div className="timetable day-only">
                            <div className="time-rail">
                              {HOURS.map((hour) => <span key={hour}>{hour}</span>)}
                            </div>
                            <div className="day-column" onClick={(event) => startCreateAtSlot(event, selectedDay)}>
                              {dayEvents.map((event) => (
                                <ScheduleBlock key={event.id} event={event} onClick={startEdit} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {viewMode === 'week' && (
                        <div className="week-view">
                          <div className="week-head">
                            <span />
                            {CALENDAR_DAYS.map((day) => (
                              <button
                                key={day.label}
                                className={day.weekend ?? ''}
                                onClick={() => { setSelectedDay(day.value); startCreate(day.value) }}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                          <div className="timetable">
                            <div className="time-rail">
                              {HOURS.map((hour) => <span key={hour}>{hour}</span>)}
                            </div>
                            {CALENDAR_DAYS.map((day) => (
                              <div
                                className={`day-column ${day.weekend ?? ''}`}
                                key={day.label}
                                onClick={(event) => startCreateAtSlot(event, day.value)}
                              >
                                {recurringSchedule.filter((event) => event.day === day.value).map((event) => (
                                  <ScheduleBlock key={event.id} event={event} compact onClick={startEdit} />
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {viewMode === 'month' && (
                        <div className="month-view">
                          <div className="month-title">{month.label}</div>
                          <div className="month-grid">
                            {CALENDAR_DAYS.map((day) => (
                              <div className={`month-weekday ${day.weekend ?? ''}`} key={day.label}>{day.label}</div>
                            ))}
                            {month.cells.map((cell, index) => {
                              const events = cell ? schedule.filter((event) => (event.dateKey ? event.dateKey === cell.dateKey : event.day === cell.day)) : []
                              return (
                                <button
                                  className={`month-cell${cell?.day === selectedDay ? ' active' : ''}${cell?.weekend ? ` ${cell.weekend}` : ''}${cell?.holiday ? ' holiday' : ''}`}
                                  key={`${cell?.date ?? 'blank'}-${index}`}
                                  disabled={!cell}
                                  onClick={() => openMonthDetail(cell)}
                                >
                                  {cell && <strong>{cell.date}</strong>}
                                  {cell?.holiday && <small>{cell.holiday}</small>}
                                  {events.slice(0, 3).map((event) => (
                                    <span key={event.id} style={{ background: event.color ?? '#6b9ee8' }}>{event.title}</span>
                                  ))}
                                  {events.length > 3 && <em>+{events.length - 3}</em>}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </section>

                    <aside className="schedule-editor">
                      <div className="planner-panel-title">{editingId ? '일정 수정' : '일정 추가'}</div>
                      {!editingId && (
                        <div className="schedule-event-finder">
                          <div>
                            <strong>빈 시간에 갈 곳을 찾고 있나요?</strong>
                            <p>현재 플래너 지역 기준 축제를 추천받아 일정에 담을 수 있어요.</p>
                          </div>
                          <button type="button" className="directory-btn" onClick={goToEvents}>이벤트 찾기</button>
                        </div>
                      )}
                      <label>
                        제목
                        <input
                          value={form.title}
                          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="예: 운동, 면접 준비"
                          disabled={form.locked}
                        />
                      </label>
                      <label>
                        적용
                        <div className="editor-choice-grid scope" role="group" aria-label="일정 적용 방식 선택">
                          <button
                            type="button"
                            className={`editor-choice-pill scope${form.repeatMode === 'date' ? ' active' : ''}`}
                            onClick={setDateScope}
                            disabled={form.locked}
                            aria-pressed={form.repeatMode === 'date'}
                          >
                            {form.dateKey ? `${formatDateKey(form.dateKey)}만` : '선택 날짜만'}
                          </button>
                          <button
                            type="button"
                            className={`editor-choice-pill scope${form.repeatMode === 'weekly' ? ' active' : ''}`}
                            onClick={setWeeklyScope}
                            disabled={form.locked}
                            aria-pressed={form.repeatMode === 'weekly'}
                          >
                            매주 반복
                          </button>
                        </div>
                      </label>
                      <label>
                        날짜
                        <input
                          type="date"
                          value={form.dateKey ?? getDefaultDateKey(form.day)}
                          onChange={(event) => updateFormDate(event.target.value)}
                          onFocus={setDateScope}
                          disabled={form.locked}
                        />
                      </label>
                      <label>
                        요일
                        <div className="editor-choice-grid days" role="group" aria-label="요일 선택">
                          {CALENDAR_DAYS.map((day) => (
                            <button
                              type="button"
                              className={`editor-choice-pill${Number(form.day) === day.value ? ' active' : ''}${day.weekend ? ` ${day.weekend}` : ''}`}
                              key={day.label}
                              onClick={() => updateFormDay(day.value)}
                              disabled={form.locked}
                              aria-pressed={Number(form.day) === day.value}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </label>
                      <div className="editor-time-row">
                        <label>
                          시작
                          <input type="time" value={form.start} onChange={(event) => setForm((prev) => ({ ...prev, start: event.target.value }))} disabled={form.locked} />
                        </label>
                        <label>
                          종료
                          <input type="time" value={form.end} onChange={(event) => setForm((prev) => ({ ...prev, end: event.target.value }))} disabled={form.locked} />
                        </label>
                      </div>
                      <label>
                        구분
                        <div className="editor-choice-grid types" role="group" aria-label="일정 구분 선택">
                          {eventTypeOptions.map((type) => {
                            const isEditable = type.value !== 'custom'
                            return (
                              <button
                                type="button"
                                className={`editor-choice-pill type${form.type === type.value ? ' active' : ''}${isEditable ? ' saved' : ''}`}
                                key={type.value}
                                onClick={() => setForm((prev) => ({
                                  ...prev,
                                  type: type.value,
                                  typeLabel: type.value === 'custom' ? '' : type.label,
                                  color: type.color,
                                }))}
                                disabled={form.locked}
                                aria-pressed={form.type === type.value}
                                style={{ '--choice-color': type.color }}
                              >
                                <span />
                                {type.label}
                                {isEditable && (
                                  <em
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${type.label} 구분 삭제`}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      deleteCustomEventType(type.value)
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        deleteCustomEventType(type.value)
                                      }
                                    }}
                                  >
                                    ×
                                  </em>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </label>
                      <label>
                        {form.type === 'custom' ? '직접 구분명' : '구분 수정'}
                        <div className="editor-inline-create">
                          <input
                            value={form.typeLabel}
                            onChange={(event) => setForm((prev) => ({
                              ...prev,
                              typeLabel: event.target.value.slice(0, 6),
                            }))}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                saveCustomEventType()
                              }
                            }}
                            placeholder="예: 운동, 식사, 면접"
                            maxLength={6}
                            disabled={form.locked}
                          />
                          <button
                            type="button"
                            className="directory-btn"
                            onClick={saveCustomEventType}
                            disabled={form.locked || !form.typeLabel.trim()}
                          >
                            {form.type === 'custom' ? '추가' : '수정'}
                          </button>
                          <button
                            type="button"
                            className="directory-btn danger"
                            onClick={() => selectedEditableType && deleteCustomEventType(selectedEditableType.value)}
                            disabled={form.locked || !selectedEditableType}
                          >
                            삭제
                          </button>
                        </div>
                        {form.typeLabel.length === 6 && (
                          <p className="type-label-error">최대 6자까지 입력할 수 있습니다.</p>
                        )}
                      </label>
                      <label>
                        색상
                        <div className="editor-color-grid" role="group" aria-label="일정 색상 선택">
                          {COLOR_SWATCHES.map((color) => (
                            <button
                              type="button"
                              className={`editor-color-swatch${form.color === color ? ' active' : ''}`}
                              key={color}
                              onClick={() => setForm((prev) => ({ ...prev, color }))}
                              disabled={form.locked}
                              aria-label={`${color} 색상`}
                              aria-pressed={form.color === color}
                              style={{ '--swatch-color': color }}
                            />
                          ))}
                        </div>
                      </label>
                      <label>
                        메모
                        <textarea value={form.memo} onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))} disabled={form.locked} />
                      </label>
                      {form.locked && <p className="editor-hint">자동 생성된 근무 일정입니다. 실제 근무시간 수정 기능은 이후 일자리 상세 편집으로 확장할 수 있습니다.</p>}
                      <div className="directory-actions editor-actions">
                        <button className="directory-btn primary" onClick={saveEvent} disabled={form.locked}>일정 저장</button>
                        <button className="directory-btn" onClick={() => startCreate(Number(form.day))}>새 일정</button>
                        <button className="directory-btn danger" onClick={deleteEvent} disabled={!editingId || form.locked}>삭제</button>
                      </div>
                    </aside>
                  </div>
                </>
              )}
            </article>
          </section>
        )}
        {monthDetail && (
          <div className="planner-modal-backdrop" onClick={() => setMonthDetail(null)}>
            <section className="planner-day-modal" onClick={(event) => event.stopPropagation()}>
              <div className="planner-day-modal-head">
                <div>
                  <p>{month.label}</p>
                  <h2>{monthDetail.date}일 {CALENDAR_DAYS.find((day) => day.value === monthDetail.day)?.label}요일</h2>
                </div>
                <button type="button" onClick={() => setMonthDetail(null)} aria-label="닫기">×</button>
              </div>
              {monthDetail.holiday && <div className="modal-holiday-label">{monthDetail.holiday}</div>}
              <div className="modal-event-list">
                {monthDetail.events.length === 0 ? (
                  <div className="modal-empty">등록된 일정이 없습니다.</div>
                ) : (
                  monthDetail.events
                    .slice()
                    .sort((a, b) => toMinutes(a.start, 0) - toMinutes(b.start, 0))
                    .map((event) => (
                      <button
                        type="button"
                        key={event.id}
                        className="modal-event-item"
                        onClick={() => {
                          setMonthDetail(null)
                          startEdit(event)
                        }}
                      >
                        <span style={{ background: event.color ?? '#6b9ee8' }} />
                        <strong>{event.title}</strong>
                        <em>{event.start} - {event.end}</em>
                      </button>
                    ))
                )}
              </div>
              <button
                type="button"
                className="directory-btn primary modal-create-btn"
                onClick={() => {
                  startCreateFromMonth(monthDetail)
                }}
              >
                이 날짜에 일정 추가
              </button>
            </section>
          </div>
        )}
        {deleteTarget && (
          <div className="planner-modal-backdrop" onClick={() => setDeleteTarget(null)}>
            <section className="planner-confirm-modal" onClick={(event) => event.stopPropagation()}>
              <h2>플래너를 삭제할까요?</h2>
              <p><strong>{deleteTarget.title}</strong> 플래너와 직접 추가한 시간표가 함께 삭제됩니다.</p>
              <div className="confirm-actions">
                <button className="directory-btn" onClick={() => setDeleteTarget(null)}>아니오</button>
                <button className="directory-btn danger solid" onClick={removePlanner}>예, 삭제</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
