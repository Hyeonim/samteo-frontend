import React from 'react'

const LABELS = ['지역 선택', '일자리 검증', '숙소 매칭', '가계부 연산', '플래너 완성']

export default function StepIndicator({ currentStep, total }) {
  return (
    <div className="step-indicator">
      {LABELS.map((label, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <React.Fragment key={step}>
            <div className={`step-ind-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
              <div className="step-ind-circle">{isDone ? '✓' : step}</div>
              <div className="step-ind-label">{label}</div>
            </div>
            {step < total && (
              <div className={`step-ind-line${isDone ? ' done' : ''}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
