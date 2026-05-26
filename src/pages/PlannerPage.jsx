import { useState, useEffect } from 'react'
import StepIndicator from '../components/wizard/StepIndicator'
import Step1Region from '../components/wizard/Step1Region'
import Step2Jobs from '../components/wizard/Step2Jobs'
import Step3Accommodation from '../components/wizard/Step3Accommodation'
import Step4Budget from '../components/wizard/Step4Budget'
import Step5Planner from '../components/wizard/Step5Planner'
import './PlannerPage.css'

const TOTAL = 5

export default function PlannerPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRegion, setSelectedRegion] = useState('서울')
  const [selectedJobs, setSelectedJobs] = useState([])
  const [selectedHotel, setSelectedHotel] = useState({ name: '대구 도심 호스텔', price: 450000 })

  useEffect(() => {
    setSelectedJobs([])
  }, [selectedRegion])

  function toggleJob(job) {
    setSelectedJobs((prev) => {
      const exists = prev.find((j) => j.id === job.id)
      return exists ? prev.filter((j) => j.id !== job.id) : [...prev, job]
    })
  }

  function moveStep(dir) {
    const next = currentStep + dir
    if (next < 1 || next > TOTAL) return
    setCurrentStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isLastStep = currentStep === TOTAL

  const stepContent = [
    <Step1Region key={1} selectedRegion={selectedRegion} onSelect={setSelectedRegion} />,
    <Step2Jobs key={2} region={selectedRegion} selectedJobs={selectedJobs} onToggle={toggleJob} />,
    <Step3Accommodation key={3} selectedJobs={selectedJobs} selectedHotel={selectedHotel} onSelect={setSelectedHotel} />,
    <Step4Budget key={4} selectedJobs={selectedJobs} selectedHotel={selectedHotel} />,
    <Step5Planner key={5} selectedJobs={selectedJobs} selectedHotel={selectedHotel} />,
  ]

  return (
    <div className="planner-wizard">
      <div className="wizard-inner">
        <StepIndicator currentStep={currentStep} total={TOTAL} />
        {stepContent[currentStep - 1]}
        <div className="wizard-nav">
          <button
            className="btn-prev"
            onClick={() => moveStep(-1)}
            disabled={currentStep === 1}
          >
            ← 이전 단계
          </button>
          <div className="step-counter">{currentStep} / {TOTAL} 단계</div>
          <button
            className="btn-next"
            onClick={
              isLastStep
                ? () => alert('공모전 심사위원용 프로토타입 설계가 최종 승인되었습니다! 🎉')
                : () => moveStep(1)
            }
          >
            {isLastStep ? '플래너 저장 및 배포 ✓' : '다음 단계 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
