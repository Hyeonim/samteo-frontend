import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/wizard/StepIndicator'
import Step1Region from '../components/wizard/Step1Region'
import Step2Jobs from '../components/wizard/Step2Jobs'
import Step3Accommodation from '../components/wizard/Step3Accommodation'
import Step4Budget from '../components/wizard/Step4Budget'
import Step5Planner from '../components/wizard/Step5Planner'
import { api } from '../api'
import { saveStoredPlanner } from '../utils/plannerStorage'
import './PlannerPage.css'

const TOTAL = 5
const FIXED_EXPENSES = 380000

const DEFAULT_HOTEL = {
  id: 'acc-001',
  name: '대구 다운타운 호스텔',
  price: 450000,
}

function prepareSeedJob(job) {
  if (!job) return null
  const salary = Number(job.salary ?? job.monthlySalary ?? 0)
  return {
    ...job,
    name: job.name ?? job.title,
    title: job.title ?? job.name,
    region: job.region ?? job.district ?? job.regionId,
    type: job.type ?? job.category ?? '추천',
    salary,
    monthlySalary: salary,
    priceLabel: job.priceLabel ?? `${salary.toLocaleString()}원`,
    unit: job.unit ?? '/월',
    sub: job.sub ?? job.workingDays ?? '',
    emoji: job.emoji ?? '💼',
  }
}

export default function PlannerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seedJob = prepareSeedJob(location.state?.selectedJob)
  const seedRegion = location.state?.selectedRegion ?? seedJob?.regionId ?? 'junggu'
  const seedStep = seedJob ? Number(location.state?.startStep ?? 3) : 1

  const [currentStep, setCurrentStep] = useState(Math.min(Math.max(seedStep, 1), TOTAL))
  const [selectedRegion, setSelectedRegion] = useState(seedRegion)
  const [selectedJobs, setSelectedJobs] = useState(seedJob ? [seedJob] : [])
  const [selectedHotel, setSelectedHotel] = useState(DEFAULT_HOTEL)
  const [saving, setSaving] = useState(false)

  function selectRegion(region) {
    setSelectedRegion(region)
    setSelectedJobs([])
  }

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

  async function completePlanner() {
    if (selectedJobs.length === 0) {
      alert('일자리를 하나 이상 선택해 주세요.')
      setCurrentStep(2)
      return
    }

    setSaving(true)
    const totalSalary = selectedJobs.reduce((sum, job) => sum + Number(job.salary ?? job.monthlySalary ?? 0), 0)
    const accommodationCost = Number(selectedHotel.price ?? selectedHotel.monthlyPrice ?? 0)
    const planner = {
      id: `planner-${Date.now()}`,
      title: `${selectedRegion} 체류 플래너`,
      regionId: selectedRegion,
      regionName: selectedRegion,
      jobs: selectedJobs.map((job) => ({
        id: job.id,
        name: job.name ?? job.title,
        type: job.type ?? job.category,
        salary: Number(job.salary ?? job.monthlySalary ?? 0),
      })),
      accommodation: {
        id: selectedHotel.id,
        name: selectedHotel.name,
        price: accommodationCost,
      },
      totalSalary,
      accommodationCost,
      fixedExpense: FIXED_EXPENSES,
      disposableIncome: Math.max(0, totalSalary - accommodationCost - FIXED_EXPENSES),
      createdAt: new Date().toISOString(),
      memo: '',
    }

    try {
      await api.post('/api/planner', {
        regionId: planner.regionId,
        jobIds: planner.jobs.map((job) => job.id),
        accommodationId: planner.accommodation.id,
        stayMonth: 1,
      })
    } catch {
      // The backend currently creates planners but does not expose a list API.
      // Local persistence keeps the UI usable even when the API is offline.
    }

    saveStoredPlanner(planner)
    setSaving(false)
    navigate('/my-planner')
  }

  const isLastStep = currentStep === TOTAL

  const stepContent = [
    <Step1Region key={1} selectedRegion={selectedRegion} onSelect={selectRegion} />,
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
            disabled={currentStep === 1 || saving}
          >
            이전 단계
          </button>
          <div className="step-counter">{currentStep} / {TOTAL} 단계</div>
          <button
            className="btn-next"
            onClick={isLastStep ? completePlanner : () => moveStep(1)}
            disabled={saving}
          >
            {isLastStep ? (saving ? '저장 중...' : '플래너 저장하고 결과 보기') : '다음 단계'}
          </button>
        </div>
      </div>
    </div>
  )
}
