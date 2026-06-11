import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteStoredPlanner, getStoredPlanners, saveStoredPlanner } from '../utils/plannerStorage'
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseJobTime(job, index) {
  const text = [job.workingDays, job.sub, job.schedule, job.time].filter(Boolean).join(' ')
  const times = [...text.matchAll(/(\d{1,2}:\d{2})/g)].map((match) => match[1])
  const defaultStart = 9 * 60 + (index % 3) * 60
  const start = toMinutes(times[0], defaultStart)
  const end = toMinutes(times[1], start + 7 * 60)
  return { start: minutesToTime(start), end: minutesToTime(Math.max(end, start + 60)) }
}

function parseJobDays(job) {
  const text = [job.workingDays, job.sub, job.schedule, job.time].filter(Boolean).join(' ')
  if (/Mon-Fri|월-금|주\s*5/.test(text)) return [0, 1, 2, 3, 4]
  if (/주\s*4/.test(text)) return [0, 1, 2, 3]
  if (/주말|Sat|Sun|토|일/.test(text)) return [5, 6]
  return [0, 1, 2, 3, 4]
}

function createJobSchedule(planner) {
  return (planner.jobs ?? []).flatMap((job, jobIndex) => {
    const time = parseJobTime(job, jobIndex)
    const jobColor = COLORS[jobIndex % COLORS.length]
    return parseJobDays(job).map((day) => ({
      id: `work-${planner.id}-${job.id ?? jobIndex}-${day}`,
      title: job.name ?? job.title ?? '근무',
      type: 'work',
      day,
      start: time.start,
      end: time.end,
      color: jobColor,
      memo: job.company ?? job.type ?? '자동 생성된 근무 일정',
      locked: true,
    }))
  })
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
  const [planners, setPlanners] = useState(() => getStoredPlanners())
  const [activeId, setActiveId] = useState(() => getStoredPlanners()[0]?.id ?? null)
  const [viewMode, setViewMode] = useState('week')
  const [selectedDay, setSelectedDay] = useState(0)
  const activePlanner = useMemo(
    () => planners.find((planner) => planner.id === activeId) ?? null,
    [planners, activeId]
  )
  const [title, setTitle] = useState(() => activePlanner?.title ?? '')
  const [memo, setMemo] = useState(() => activePlanner?.memo ?? '')
  const [editingId, setEditingId] = useState(null)
  const [monthDetail, setMonthDetail] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({
    title: '',
    day: 0,
    start: '18:00',
    end: '19:00',
    type: 'personal',
    memo: '',
  })

  const schedule = useMemo(() => getSchedule(activePlanner), [activePlanner])
  const dayEvents = schedule.filter((event) => event.day === selectedDay)
  const month = useMemo(() => getMonthDays(), [])

  const refresh = (saved) => {
    const next = getStoredPlanners()
    setPlanners(next)
    setActiveId(saved?.id ?? next[0]?.id ?? null)
  }

  const persistPlanner = (patch) => {
    if (!activePlanner) return null
    const saved = saveStoredPlanner({ ...activePlanner, schedule, ...patch })
    refresh(saved)
    return saved
  }

  const selectPlanner = (planner) => {
    setActiveId(planner.id)
    setTitle(planner.title ?? '')
    setMemo(planner.memo ?? '')
    setEditingId(null)
  }

  const saveSummary = () => {
    persistPlanner({ title, memo })
  }

  const removePlanner = () => {
    if (!activePlanner) return
    const next = deleteStoredPlanner(activePlanner.id)
    setPlanners(next)
    setActiveId(next[0]?.id ?? null)
    setTitle(next[0]?.title ?? '')
    setMemo(next[0]?.memo ?? '')
    setDeleteTarget(null)
  }

  const startCreate = (day = selectedDay, startTime = '18:00') => {
    const start = toMinutes(startTime, 18 * 60)
    setEditingId(null)
    setForm({
      title: '',
      day,
      start: minutesToTime(start),
      end: minutesToTime(start + 60),
      type: 'personal',
      memo: '',
    })
  }

  const startEdit = (event) => {
    if (event.locked) {
      setForm({ ...event, memo: event.memo ?? '' })
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
      memo: event.memo ?? '',
    })
  }

  const saveEvent = () => {
    if (!activePlanner || !form.title.trim()) return
    const start = toMinutes(form.start, 0)
    const end = toMinutes(form.end, start + 60)
    const matchingWorkColor = schedule.find((event) => (
      event.type === 'work' && event.title === form.title.trim()
    ))?.color
    const normalized = {
      ...form,
      title: form.title.trim(),
      day: Number(form.day),
      end: minutesToTime(Math.max(end, start + 30)),
      color: form.type === 'work' ? (matchingWorkColor ?? COLORS[0]) : form.type === 'study' ? COLORS[2] : form.type === 'rest' ? COLORS[3] : form.type === 'event' ? '#8b5cf6' : COLORS[5],
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
      memo: '',
    })
  }

  const startCreateFromMonth = (cell) => {
    if (!cell) return
    const events = schedule.filter((event) => event.day === cell.day)
    const latestEnd = events.reduce((latest, event) => Math.max(latest, toMinutes(event.end, latest)), 8 * 60)
    const start = clamp(Math.ceil(latestEnd / 60) * 60, HOURS[0] * 60, (HOURS[HOURS.length - 1]) * 60)

    setSelectedDay(cell.day)
    setViewMode('day')
    startCreate(cell.day, minutesToTime(start))
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
              {planners.map((planner) => (
                <button
                  className={`planner-item${planner.id === activeId ? ' active' : ''}`}
                  key={planner.id}
                  onClick={() => selectPlanner(planner)}
                >
                  <h2 className="directory-card-title">{planner.title}</h2>
                  <p className="directory-card-sub">{planner.regionName} · {planner.jobs?.length ?? 0}개 일자리</p>
                  <p className="directory-card-sub">수정 {formatDate(planner.updatedAt ?? planner.createdAt)}</p>
                </button>
              ))}
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
                                {schedule.filter((event) => event.day === day.value).map((event) => (
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
                        요일
                        <select
                          value={form.day}
                          onChange={(event) => setForm((prev) => ({ ...prev, day: Number(event.target.value) }))}
                          disabled={form.locked}
                        >
                          {CALENDAR_DAYS.map((day) => <option value={day.value} key={day.label}>{day.label}요일</option>)}
                        </select>
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
                        <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} disabled={form.locked}>
                          <option value="personal">개인 일정</option>
                          <option value="study">준비/학습</option>
                          <option value="rest">휴식</option>
                          <option value="work">근무</option>
                          <option value="event">행사/이벤트</option>
                        </select>
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
                이 요일에 일정 추가
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
