import { useState, useEffect, useRef } from 'react'

const FIXED_EXPENSES = 380000

const CALENDAR_DAYS = [
  { type: 'empty' }, { type: 'empty' }, { type: 'empty' },
  { day: 1, type: 'work' },
  { day: 2, type: 'work' },
  { day: 3, type: 'work' },
  { day: 4, type: 'rest' },
  { day: 5, type: 'rest', event: '🌸 벚꽃 축제' },
  { day: 6, type: 'work' },
  { day: 7, type: 'work' },
  { day: 8, type: 'work' },
  { day: 9, type: 'work' },
  { day: 10, type: 'work' },
  { day: 11, type: 'rest' },
  { day: 12, type: 'rest' },
  { day: 13, type: 'work' },
  { day: 14, type: 'work' },
  { day: 15, type: 'today' },
  { day: 16, type: 'work' },
  { day: 17, type: 'work' },
  { day: 18, type: 'rest', event: '🍺 치맥 페스티벌' },
  { day: 19, type: 'festival', event: '🍺 치맥 페스티벌' },
  { day: 20, type: 'work' },
  { day: 21, type: 'work' },
  { day: 22, type: 'work' },
  { day: 23, type: 'work' },
  { day: 24, type: 'work' },
  { day: 25, type: 'rest' },
  { day: 26, type: 'rest' },
  { day: 27, type: 'work' },
  { day: 28, type: 'work' },
  { day: 29, type: 'work' },
  { day: 30, type: 'festival', event: '🌸 달성 꽃 축제' },
  { type: 'empty' }, { type: 'empty' },
]

const BADGE = { work: '근무', rest: '휴일', festival: '축제', today: '오늘' }

export default function Step5Planner({ selectedJobs, selectedHotel }) {
  const [activeJobId, setActiveJobId] = useState(selectedJobs[0]?.id ?? null)
  const sliderRef = useRef(null)

  useEffect(() => {
    if (selectedJobs.length > 0 && !selectedJobs.find((j) => j.id === activeJobId)) {
      setActiveJobId(selectedJobs[0].id)
    }
    if (selectedJobs.length === 0) setActiveJobId(null)
  }, [selectedJobs])

  const activeJob = selectedJobs.find((j) => j.id === activeJobId) ?? null
  const total = activeJob ? Math.max(0, activeJob.salary - selectedHotel.price - FIXED_EXPENSES) : 0

  function scrollSlider(dir) {
    sliderRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })
  }

  return (
    <div className="step-card">
      <div className="step-title">🎉 나만의 워킹홀리데이 플래너 완성!</div>
      <div className="step-subtitle">
        일(Work)과 놀이(Play)의 완벽한 밸런스 · 근무일·휴무일·축제 일정 자동 배치
      </div>

      {/* 상단 선택 정보 */}
      <div className="budget-top-info">
        <div className="budget-top-label">
          {selectedJobs.length > 0
            ? `선택한 알바 ${selectedJobs.length}개 · 알바를 클릭하면 해당 플래너를 확인해요`
            : 'Step 2에서 알바를 선택하면 여기에 표시됩니다'}
        </div>
        {selectedJobs.length === 0 ? (
          <div className="job-chip-empty">
            <span style={{ fontSize: 20 }}>📅</span>
            Step 2에서 알바를 선택하면 여기에 표시됩니다.
          </div>
        ) : (
          <div className="job-slider-carousel">
            <button className="slider-arrow" onClick={() => scrollSlider(-1)} aria-label="이전">‹</button>
            <div className="job-slider" ref={sliderRef}>
              {selectedJobs.map((j) => (
                <div
                  key={j.id}
                  className={`job-chip${activeJobId === j.id ? ' active' : ''}`}
                  onClick={() => setActiveJobId(j.id)}
                >
                  <span className="job-chip-emoji">{j.emoji}</span>
                  <div>
                    <div className="job-chip-name">{j.name}</div>
                    <div className="job-chip-sub">{j.type} · {j.priceLabel}{j.unit}</div>
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
          <div style={{ fontSize: 44, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>알바를 선택하면 플래너가 표시됩니다</div>
          <div style={{ fontSize: 13, color: '#bbb' }}>이전 단계로 돌아가 알바를 선택해 주세요</div>
        </div>
      ) : (
        <>
          <div className="planner-summary-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="summary-icon" style={{ fontSize: 22 }}>{activeJob.emoji}</div>
              <div>
                <div className="summary-job-name">{activeJob.name}</div>
                <div className="summary-meta">
                  <span className="meta-tag">📍 {activeJob.region}</span>
                  <span className="meta-tag">⏰ 09:00–18:00</span>
                  <span className="meta-tag">🏠 {selectedHotel.name}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-change" onClick={() => {}}>일자리 변경</button>
              <button className="btn-view" onClick={() => {}}>숙소 보기</button>
            </div>
          </div>

          <div className="planner-layout">
            <div className="cal-panel">
              <div className="cal-panel-header">
                <div className="cal-month-title">2026년 4월 · {activeJob.region} 한달살기</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="cal-nav-btn">‹</button>
                  <button className="cal-nav-btn">›</button>
                </div>
              </div>
              <div className="cal-legend">
                <div className="leg-item"><div className="leg-dot ld-work" /> 근무일</div>
                <div className="leg-item"><div className="leg-dot ld-rest" /> 휴일</div>
                <div className="leg-item"><div className="leg-dot ld-festival" /> 지역 축제</div>
                <div className="leg-item"><div className="leg-dot ld-today" /> 오늘</div>
              </div>
              <div className="cal-body">
                <div className="cal-weekdays">
                  {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                    <div key={d} className={`cal-wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>{d}</div>
                  ))}
                </div>
                <div className="cal-days">
                  {CALENDAR_DAYS.map((d, i) => (
                    <div
                      key={i}
                      className={`cal-day${d.type === 'empty' ? ' empty' : ` ${d.type}`}`}
                      style={d.type === 'today' ? { background: '#EFF6FF' } : {}}
                    >
                      {d.day && (
                        <>
                          <div className="day-num" style={d.type === 'today' ? { color: '#3B82F6' } : {}}>
                            {d.day}
                          </div>
                          <div className={`day-badge b-${d.type}`}>{BADGE[d.type]}</div>
                          {d.event && <div className="day-evt">{d.event}</div>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="planner-right">
              <div className="ps-card">
                <div className="ps-header">
                  <div className="ps-title">💰 4월 수입·지출 요약</div>
                  <div className="ps-badge">시뮬레이션</div>
                </div>
                <div className="ps-body">
                  <div className="ps-row">
                    <div className="ps-lbl">근무일</div>
                    <div className="ps-val" style={{ color: '#3B82F6' }}>22일</div>
                  </div>
                  <div className="ps-row">
                    <div className="ps-lbl">총 급여</div>
                    <div className="ps-val" style={{ color: '#059669' }}>+₩{activeJob.salary.toLocaleString()}</div>
                  </div>
                  <div className="ps-row">
                    <div className="ps-lbl">숙박비</div>
                    <div className="ps-val" style={{ color: '#ef4444' }}>-₩{selectedHotel.price.toLocaleString()}</div>
                  </div>
                  <div className="ps-row">
                    <div className="ps-lbl">식비·교통</div>
                    <div className="ps-val" style={{ color: '#ef4444' }}>-₩{FIXED_EXPENSES.toLocaleString()}</div>
                  </div>
                  <div className="ps-total">
                    <div className="pt-lbl">예상 월 실수령액</div>
                    <div className="pt-amt">₩{total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="planner-actions">
                <button
                  className="act-btn act-primary"
                  onClick={() => alert('공모전 심사위원용 프로토타입 설계가 최종 승인되었습니다! 🎉')}
                >
                  ✅ 플랜 확정하기
                </button>
                <button className="act-btn act-outline">📤 공유하기</button>
                <button className="act-btn act-outline">🖨️ 인쇄</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
