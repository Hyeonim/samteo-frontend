import { useRef, useState } from 'react'

const FIXED_EXPENSES = 380000

export default function Step5Planner({ selectedJobs, selectedHotel }) {
  const [activeJobId, setActiveJobId] = useState(selectedJobs[0]?.id ?? null)
  const sliderRef = useRef(null)

  const activeJob = selectedJobs.find((job) => job.id === activeJobId) ?? selectedJobs[0] ?? null
  const accommodationCost = Number(selectedHotel.price ?? 0)
  const total = activeJob ? Math.max(0, Number(activeJob.salary ?? 0) - accommodationCost - FIXED_EXPENSES) : 0

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
                <div className="cal-month-title">선택한 일자리 요약</div>
              </div>
              <div className="community-list">
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
