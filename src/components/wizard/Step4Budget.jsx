import { useRef } from 'react'
import CandidatePairChip from './CandidatePairChip'

export default function Step4Budget({
  selectedJobs,
  activeJobId,
  onActiveJobChange,
  selectedHotelsByJobId,
  foodExpense,
  transportExpense,
  onFoodExpenseChange,
  onTransportExpenseChange,
  defaultFoodExpense,
  defaultTransportExpense,
}) {
  const sliderRef = useRef(null)

  const activeJob = selectedJobs.find((j) => j.id === activeJobId) ?? selectedJobs[0] ?? null
  const selectedHotel = selectedHotelsByJobId[activeJob?.id] ?? { name: '', price: null }
  const accommodationPrice = selectedHotel.price == null ? null : Number(selectedHotel.price)
  const food = Number(foodExpense) || 0
  const transport = Number(transportExpense) || 0
  const total = activeJob ? Math.max(0, activeJob.salary - (accommodationPrice ?? 0) - food - transport) : 0
  const chartData = activeJob
    ? Array.from({ length: 6 }, (_, index) => {
      const month = `${index + 1}개월`
      const expense = (accommodationPrice ?? 0) + food + transport
      return {
        month,
        income: Math.max(24, Math.round(Number(activeJob.salary ?? 0) / 30000)),
        expense: Math.max(18, Math.round(expense / 30000)),
        projected: index > 0,
      }
    })
    : []

  function handleExpenseChange(setter) {
    return (event) => {
      const value = Number(event.target.value)
      setter(Number.isFinite(value) && value >= 0 ? value : 0)
    }
  }

  function scrollSlider(dir) {
    sliderRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' })
  }

  return (
    <div className="step-card">
      <div className="step-title">후보 플래너를 비교해 보세요</div>
      <div className="step-subtitle">각 일자리와 해당 숙소를 한 쌍으로 계산한 월 예상 잔액입니다.</div>

      {/* 상단 선택 정보 */}
      <div className="budget-top-info">
        <div className="budget-top-label">
          {selectedJobs.length > 0
            ? `비교 후보 ${selectedJobs.length}개 · 후보를 클릭하면 해당 일자리와 숙소의 가계부를 확인해요`
            : 'Step 2에서 알바를 선택하면 여기에 표시됩니다'}
        </div>
        {selectedJobs.length === 0 ? (
          <div className="job-chip-empty">
            <span style={{ fontSize: 20 }}>💼</span>
            Step 2에서 알바를 선택하면 여기에 표시됩니다.
          </div>
        ) : (
          <div className="job-slider-carousel">
            <button className="slider-arrow" onClick={() => scrollSlider(-1)} aria-label="이전">‹</button>
            <div className="job-slider" ref={sliderRef}>
              {selectedJobs.map((j, index) => (
                <CandidatePairChip
                  key={j.id}
                  index={index}
                  job={j}
                  hotel={selectedHotelsByJobId[j.id]}
                  active={activeJob?.id === j.id}
                  onClick={() => onActiveJobChange?.(j.id)}
                />
              ))}
            </div>
            <button className="slider-arrow" onClick={() => scrollSlider(1)} aria-label="다음">›</button>
          </div>
        )}
      </div>

      {!activeJob ? (
        <div className="step-empty-state">
          <div style={{ fontSize: 44, marginBottom: 12 }}>📒</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>알바를 선택하면 가계부가 표시됩니다</div>
          <div style={{ fontSize: 13, color: '#bbb' }}>이전 단계로 돌아가 알바를 선택해 주세요</div>
        </div>
      ) : (
        <>
          <div className="candidate-focus-bar">
            <span><small>현재 비교 중</small><strong>{activeJob.name}</strong></span>
            <b>↔</b>
            <span><small>매칭 숙소</small><strong>{selectedHotel.name || '숙소 미선택'}</strong></span>
          </div>
          <div className="budget-layout">
          <div className="summary-box">
            <div className="srow">
              <div className="slabel">📅 근무일</div>
              <div className="svalue sv-blue">22일</div>
            </div>
            <div className="srow">
              <div className="slabel">⏰ 일일 근무</div>
              <div className="svalue">8시간</div>
            </div>
            <div className="srow">
              <div className="slabel">📈 총 급여 (알바)</div>
              <div className="svalue sv-green">+₩{activeJob.salary.toLocaleString()}</div>
            </div>
            <div className="srow">
              <div className="slabel">🏠 숙박비</div>
              <div className="svalue sv-red">{accommodationPrice == null ? '미제공' : `-₩${accommodationPrice.toLocaleString()}`}</div>
            </div>
            <div className="srow editable-row">
              <div className="slabel">🍽️ 식비 (30일) <span className="editable-badge">✏️ 직접 입력</span></div>
              <div className="editable-value-group">
                <div className="svalue sv-red editable-value">
                  <span>-₩</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    inputMode="numeric"
                    aria-label="식비 직접 입력"
                    value={food}
                    onChange={handleExpenseChange(onFoodExpenseChange)}
                  />
                </div>
                {food !== defaultFoodExpense && (
                  <button
                    type="button"
                    className="expense-reset-btn"
                    onClick={() => onFoodExpenseChange(defaultFoodExpense)}
                  >
                    ↺ 기본값({Number(defaultFoodExpense).toLocaleString()})
                  </button>
                )}
              </div>
            </div>
            <div className="srow editable-row">
              <div className="slabel">🚌 교통비 <span className="editable-badge">✏️ 직접 입력</span></div>
              <div className="editable-value-group">
                <div className="svalue sv-red editable-value">
                  <span>-₩</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    inputMode="numeric"
                    aria-label="교통비 직접 입력"
                    value={transport}
                    onChange={handleExpenseChange(onTransportExpenseChange)}
                  />
                </div>
                {transport !== defaultTransportExpense && (
                  <button
                    type="button"
                    className="expense-reset-btn"
                    onClick={() => onTransportExpenseChange(defaultTransportExpense)}
                  >
                    ↺ 기본값({Number(defaultTransportExpense).toLocaleString()})
                  </button>
                )}
              </div>
            </div>
            <div className="stotal">
              <div className="t-lbl">예상 월 실수령액</div>
              <div className="t-amt">₩{total.toLocaleString()}</div>
            </div>
          </div>

          <div className="budget-right">
            <div className="budget-chart-title">📊 월간 수입 &amp; 지출 추이</div>
            <div className="bar-chart">
              {chartData.map((d) => (
                <div key={d.month} className="bar-group">
                  <div className="bars">
                    <div className="bar income" style={{ height: d.income, opacity: d.projected ? 0.45 : 1 }} />
                    <div className="bar expense" style={{ height: d.expense, opacity: d.projected ? 0.45 : 1 }} />
                  </div>
                  <div className="bar-month">{d.month}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="cl-item">
                <div className="cl-dot" style={{ background: '#3B82F6' }} />
                수입
              </div>
              <div className="cl-item">
                <div className="cl-dot" style={{ background: '#FCA5A5' }} />
                지출
              </div>
              <div style={{ fontSize: 10, color: '#bbb', marginLeft: 'auto' }}>단위: 만원 · 5월~ 예상치</div>
            </div>
            <div className="analysis-list">
              <div className="ai-item">
                <div className="ai-icon ai-green">💰</div>
                <div>
                  <div className="ai-title">{activeJob.name} 급여 기준</div>
                  <div className="ai-desc">
                    월급 <strong>₩{activeJob.salary.toLocaleString()}</strong>에서 숙박비·식비·교통비를 공제하면 실수령액은 <strong>₩{total.toLocaleString()}</strong>입니다.
                  </div>
                </div>
              </div>
              <div className="ai-item">
                <div className="ai-icon ai-blue">📍</div>
                <div>
                  <div className="ai-title">근무 위치</div>
                  <div className="ai-desc">{activeJob.location}</div>
                </div>
              </div>
              <div className="ai-item">
                <div className="ai-icon ai-orange">🚌</div>
                <div>
                  <div className="ai-title">출퇴근 소요 시간</div>
                  <div className="ai-desc">
                    {selectedHotel.name || '선택한 숙소 없음'} → {activeJob.name}: 후보별 출퇴근 경로를 기준으로 확인합니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
