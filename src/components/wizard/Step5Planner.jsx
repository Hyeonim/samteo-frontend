import { useEffect, useMemo, useRef, useState } from 'react'

const FIXED_EXPENSES = 380000
const CALENDAR_DAYS = [
  { label: '일', value: 6, weekend: 'sun' },
  { label: '월', value: 0 },
  { label: '화', value: 1 },
  { label: '수', value: 2 },
  { label: '목', value: 3 },
  { label: '금', value: 4 },
  { label: '토', value: 5, weekend: 'sat' },
]

function toScheduleDay(nativeDay) {
  return nativeDay === 0 ? 6 : nativeDay - 1
}

function createMonthPreview(schedule) {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const cells = []

  for (let index = 0; index < first.getDay(); index += 1) {
    cells.push(null)
  }

  for (let date = 1; date <= last.getDate(); date += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), date)
    const nativeDay = day.getDay()
    const scheduleDay = toScheduleDay(nativeDay)
    cells.push({
      date,
      day: scheduleDay,
      weekend: nativeDay === 0 ? 'sun' : nativeDay === 6 ? 'sat' : '',
      events: schedule.filter((event) => event.day === scheduleDay),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return {
    label: `${today.getFullYear()}년 ${today.getMonth() + 1}월`,
    cells,
  }
}

export default function Step5Planner({ selectedJobs, selectedHotel, plannerPreview }) {
  const [activeJobId, setActiveJobId] = useState(selectedJobs[0]?.id ?? null)
  const sliderRef = useRef(null)

  const activeJob = selectedJobs.find((job) => job.id === activeJobId) ?? selectedJobs[0] ?? null
  const accommodationCost = Number(selectedHotel.price ?? selectedHotel.monthlyPrice ?? 0)
  const total = activeJob ? Math.max(0, Number(activeJob.salary ?? 0) - accommodationCost - FIXED_EXPENSES) : 0
  const previewSchedule = plannerPreview?.schedule ?? []
  const monthPreview = useMemo(() => createMonthPreview(previewSchedule), [previewSchedule])

  useEffect(() => {
    if (!selectedJobs.some((job) => job.id === activeJobId)) {
      setActiveJobId(selectedJobs[0]?.id ?? null)
    }
  }, [activeJobId, selectedJobs])

  function scrollSlider(dir) {
    sliderRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })
  }

  return (
    <div className="step-card">
      <div className="step-title">플래너 저장 준비가 끝났어요</div>
      <div className="step-subtitle">
        선택한 일자리와 숙소 기준으로 저장될 플래너 요약을 확인하세요.
      </div>

      <div className="budget-top-info">
        <div className="budget-top-label">
          {selectedJobs.length > 0
            ? `선택한 일자리 ${selectedJobs.length}개 · 클릭하면 기준 일자리를 바꿀 수 있어요`
            : 'Step 2에서 일자리를 선택하면 여기에 표시됩니다.'}
        </div>
        {selectedJobs.length === 0 ? (
          <div className="job-chip-empty">
            <span style={{ fontSize: 20 }}>📌</span>
            Step 2에서 일자리를 선택해 주세요.
          </div>
        ) : (
          <div className="job-slider-carousel">
            <button className="slider-arrow" onClick={() => scrollSlider(-1)} aria-label="이전">‹</button>
            <div className="job-slider" ref={sliderRef}>
              {selectedJobs.map((job) => (
                <div
                  key={job.id}
                  className={`job-chip${activeJob?.id === job.id ? ' active' : ''}`}
                  onClick={() => setActiveJobId(job.id)}
                >
                  <span className="job-chip-emoji">{job.emoji}</span>
                  <div>
                    <div className="job-chip-name">{job.name}</div>
                    <div className="job-chip-sub">{job.type} · {job.priceLabel}{job.unit}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="slider-arrow" onClick={() => scrollSlider(1)} aria-label="다음">›</button>
          </div>
        )}
      </div>

      {!activeJob ? (
        <div className="step-empty-state">
          <div style={{ fontSize: 44, marginBottom: 12 }}>📌</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>일자리를 선택하면 플래너가 표시됩니다</div>
          <div style={{ fontSize: 13, color: '#bbb' }}>이전 단계로 돌아가 일자리를 선택해 주세요.</div>
        </div>
      ) : (
        <>
          <div className="planner-summary-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="summary-icon" style={{ fontSize: 22 }}>{activeJob.emoji}</div>
              <div>
                <div className="summary-job-name">{activeJob.name}</div>
                <div className="summary-meta">
                  <span className="meta-tag">📍 {activeJob.region ?? activeJob.district ?? '-'}</span>
                  <span className="meta-tag">🕒 {activeJob.workingDays ?? activeJob.sub ?? '-'}</span>
                  <span className="meta-tag">🏠 {selectedHotel.name || '선택한 숙소 없음'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="planner-layout">
            <div className="cal-panel">
              <div className="cal-panel-header">
                <div>
                  <div className="cal-month-title">완성될 플래너 미리보기</div>
                  <p className="planner-preview-sub">{plannerPreview?.title ?? '새 체류 플래너'}</p>
                </div>
              </div>
              <div className="planner-preview-body">
                <div className="directory-metrics compact planner-preview-metrics">
                  <div className="directory-metric"><span>지역</span><strong>{plannerPreview?.regionName ?? '-'}</strong></div>
                  <div className="directory-metric"><span>숙소</span><strong>{plannerPreview?.accommodation?.name || '-'}</strong></div>
                  <div className="directory-metric"><span>일자리</span><strong>{plannerPreview?.jobs?.length ?? 0}개</strong></div>
                  <div className="directory-metric"><span>월 잔액</span><strong>{Number(plannerPreview?.disposableIncome ?? 0).toLocaleString()}원</strong></div>
                </div>

                <div className="planner-month-preview" aria-label="저장될 월간 플래너 미리보기">
                  <div className="planner-month-title">{monthPreview.label}</div>
                  <div className="planner-month-weekdays">
                    {CALENDAR_DAYS.map((day) => (
                      <span className={day.weekend ?? ''} key={day.label}>{day.label}</span>
                    ))}
                  </div>
                  <div className="planner-month-grid">
                    {monthPreview.cells.map((cell, index) => (
                      <div
                        className={`planner-month-cell${cell ? '' : ' empty'}${cell?.weekend ? ` ${cell.weekend}` : ''}`}
                        key={`${cell?.date ?? 'blank'}-${index}`}
                      >
                        {cell && (
                          <>
                            <strong>{cell.date}</strong>
                            {cell.events.slice(0, 2).map((event) => (
                              <span key={event.id} style={{ background: event.color ?? '#6b9ee8' }}>{event.title}</span>
                            ))}
                            {cell.events.length > 2 && <em>+{cell.events.length - 2}</em>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="planner-preview-section-title">선택한 일자리</div>
                {selectedJobs.map((job) => (
                  <article className="directory-card" key={job.id}>
                    <div className="directory-card-top">
                      <div>
                        <h2 className="directory-card-title">{job.name}</h2>
                        <p className="directory-card-sub">{job.company ?? job.desc ?? job.region ?? '-'}</p>
                      </div>
                      <span className="directory-badge">{job.type ?? '일자리'}</span>
                    </div>
                    <div className="directory-metrics compact">
                      <div className="directory-metric"><span>예상 급여</span><strong>{Number(job.salary ?? 0).toLocaleString()}원</strong></div>
                      <div className="directory-metric"><span>근무</span><strong>{job.workingDays ?? job.sub ?? '-'}</strong></div>
                      <div className="directory-metric"><span>지역</span><strong>{job.region ?? job.district ?? '-'}</strong></div>
                      <div className="directory-metric"><span>태그</span><strong>{(job.tags ?? []).slice(0, 2).join(', ') || '-'}</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="planner-right">
              <div className="ps-card">
                <div className="ps-header">
                  <div className="ps-title">예산 요약</div>
                  <div className="ps-badge">계산값</div>
                </div>
                <div className="ps-body">
                  <div className="ps-row">
                    <div className="ps-lbl">기준 일자리 급여</div>
                    <div className="ps-val" style={{ color: '#059669' }}>+{Number(activeJob.salary ?? 0).toLocaleString()}원</div>
                  </div>
                  <div className="ps-row">
                    <div className="ps-lbl">숙박비</div>
                    <div className="ps-val" style={{ color: '#ef4444' }}>-{accommodationCost.toLocaleString()}원</div>
                  </div>
                  <div className="ps-row">
                    <div className="ps-lbl">생활 고정비</div>
                    <div className="ps-val" style={{ color: '#ef4444' }}>-{FIXED_EXPENSES.toLocaleString()}원</div>
                  </div>
                  <div className="ps-total">
                    <div className="pt-lbl">예상 월 잔액</div>
                    <div className="pt-amt">{total.toLocaleString()}원</div>
                  </div>
                </div>
              </div>
              <div className="planner-actions">
                <div className="directory-empty" style={{ padding: 18 }}>
                  다음 버튼을 누르면 이 플래너가 내 플래너에 저장됩니다.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
